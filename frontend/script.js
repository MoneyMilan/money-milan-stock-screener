// Search functionality
document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value;
  if (query.trim()) {
    console.log('Searching for:', query);
    // TODO: Call backend API to search for companies
  }
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('searchBtn').click();
  }
});

// File upload functionality
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadLink = document.getElementById('uploadLink');

uploadLink.addEventListener('click', (e) => {
  e.preventDefault();
  fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = 'rgba(100, 150, 255, 0.8)';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = 'rgba(100, 100, 100, 0.5)';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  handleFiles(files);
  uploadArea.style.borderColor = 'rgba(100, 100, 100, 0.5)';
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

// Paste functionality
document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (items) {
    for (let item of items) {
      if (item.kind === 'file' && item.type.startsWith('image')) {
        const file = item.getAsFile();
        handleFiles([file]);
      }
    }
  }
});

function handleFiles(files) {
  for (let file of files) {
    if (file.type.startsWith('image')) {
      console.log('File uploaded:', file.name);
      // TODO: Send image to backend for analysis
      uploadFile(file);
    }
  }
}

function uploadFile(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  // TODO: Replace with actual backend URL
  // fetch('/api/analyze', {
  //   method: 'POST',
  //   body: formData
  // })
  // .then(response => response.json())
  // .then(data => {
  //   console.log('Analysis result:', data);
  //   // Display results to user
  // })
  // .catch(error => console.error('Error:', error));
  
  console.log('Would upload file to backend:', file);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Stock Screener initialized');
});
