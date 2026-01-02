// Backend Server for Money Milan Stock Screener
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Keys
const FMP_API_KEY = process.env.FMP_API_KEY || 'nE6s76QRMcVBKnz8IvGqdEMGlSTn1hWi';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd58b7bhr01qptoardtkgd58b7bhr01qptoardtl0';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'nE6s76QRMcVBks3lbGqdEMGi5TnlHwl';

// Firebase Admin SDK Initialization (if needed)
// Initialize Firebase Admin SDK with credentials
// This will be configured with environment variables

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
});

// COMPANY SEARCH API - Using FMP and Finnhub
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Search using FMP API
    const fmpUrl = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`;
    
    const fmpResponse = await axios.get(fmpUrl);
    const companies = fmpResponse.data.slice(0, 5).map(company => ({
      symbol: company.symbol,
      name: company.name,
      exchange: company.exchangeShortName,
      type: 'stock',
      source: 'FMP'
    }));

    res.json({ success: true, results: companies });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to search companies', details: error.message });
  }
});

// STOCK DATA API - Get real-time stock data using FMP
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    // Get company profile
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`;
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`;
    
    const [profileResponse, quoteResponse] = await Promise.all([
      axios.get(profileUrl),
      axios.get(quoteUrl)
    ]);

    const profile = profileResponse.data[0] || {};
    const quote = quoteResponse.data[0] || {};

    const stockData = {
      symbol: symbol.toUpperCase(),
      name: profile.companyName || '',
      price: quote.price || 0,
      change: quote.change || 0,
      percentChange: quote.changesPercentage || 0,
      volume: quote.volume || 0,
      marketCap: profile.mktCap || 0,
      pe: profile.pe || 0,
      sector: profile.sector || '',
      website: profile.website || '',
      description: profile.description || ''
    };

    res.json({ success: true, data: stockData });
  } catch (error) {
    console.error('Stock data error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock data', details: error.message });
  }
});

// TECHNICAL ANALYSIS API - Get chart data for analysis
app.get('/api/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '3mo' } = req.query; // 1mo, 3mo, 1y, 5y
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    // Get historical data from FMP
    const historicalUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?serietype=line&apikey=${FMP_API_KEY}`;
    
    const response = await axios.get(historicalUrl);
    const historical = response.data.historical || [];

    // Format chart data
    const chartData = historical.slice(0, 50).reverse().map(item => ({
      date: item.date,
      close: item.close,
      open: item.open,
      high: item.high,
      low: item.low,
      volume: item.volume
    }));

    // Calculate technical indicators
    const rsi = calculateRSI(chartData);
    const sma20 = calculateSMA(chartData, 20);
    const sma50 = calculateSMA(chartData, 50);

    res.json({ 
      success: true, 
      data: {
        symbol: symbol.toUpperCase(),
        chartData: chartData,
        indicators: {
          rsi: rsi,
          sma20: sma20,
          sma50: sma50
        }
      }
    });
  } catch (error) {
    console.error('Chart data error:', error.message);
    res.status(500).json({ error: 'Failed to fetch chart data', details: error.message });
  }
});

// UPLOAD ANALYSIS API - Placeholder for image upload and analysis
app.post('/api/analyze', async (req, res) => {
  try {
    // TODO: Implement image upload and AI analysis
    // 1. Receive image file
    // 2. Send to OCR service or AI model for analysis
    // 3. Extract stock symbols and technical data
    // 4. Return analysis results
    
    res.json({ 
      success: true, 
      message: 'Image analysis endpoint ready. Implementation pending.',
      status: 'pending'
    });
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  }
});

// Helper Functions for Technical Analysis
function calculateRSI(data, period = 14) {
  if (data.length < period + 1) return null;
  
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 100) / 100;
}

function calculateSMA(data, period) {
  if (data.length < period) return null;
  
  const sum = data.slice(-period).reduce((acc, val) => acc + val.close, 0);
  return Math.round((sum / period) * 100) / 100;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error', message: error.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
