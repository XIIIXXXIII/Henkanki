import { convertText, canConvertText } from '../../../packages/converters/src/index.mjs';
import { canConvert, findFormat, listFormats } from '../../../packages/core/src/index.mjs';

const $ = (id) => document.getElementById(id);

// State
let conversionHistory = JSON.parse(localStorage.getItem('henkanki-history') || '[]');
let favoriteConversions = JSON.parse(localStorage.getItem('henkanki-favorites') || '[]');

// DOM Elements
const fileInput = $('file');
const fromSelect = $('from');
const toSelect = $('to');
const convertBtn = $('convert');
const swapBtn = $('swap');
const favoriteBtn = $('favorite');
const outputEl = $('output');
const downloadLink = $('download');
const fileInfoEl = $('file-info');
const dropArea = $('drop-area');
const historyBtn = $('history-btn');
const historyCount = $('history-count');
const favoritesBtn = $('favorites-btn');
const favoritesCount = $('favorites-count');
const historyPanel = $('history-panel');
const favoritesPanel = $('favorites-panel');
const historyList = $('history-list');
const favoritesList = $('favorites-list');
const closeHistoryBtn = $('close-history');
const closeFavoritesBtn = $('close-favorites');
const clearHistoryBtn = $('clear-history');
const clearFavoritesBtn = $('clear-favorites');
const copyBtn = $('copy-btn');
const clearBtn = $('clear-btn');
const themeToggle = $('theme-toggle');
const notification = $('notification');

// Initialize
init();

function init() {
  populateFormats();
  setupEventListeners();
  loadTheme();
  updateCounts();
  renderHistory();
  renderFavorites();
  registerServiceWorker();
}

// Populate format selectors
function populateFormats() {
  const formats = listFormats().filter(f => f.category === 'text');
  
  // Add auto-detect option to 'from' selector
  const autoOption = document.createElement('option');
  autoOption.value = 'auto';
  autoOption.textContent = 'Auto-detect';
  fromSelect.insertBefore(autoOption, fromSelect.firstChild);
  
  // Add all text formats to both selectors
  formats.forEach((fmt) => {
    if (!fromSelect.querySelector(`option[value="${fmt.id}"]`)) {
      const option = document.createElement('option');
      option.value = fmt.id;
      option.textContent = fmt.id.toUpperCase();
      fromSelect.appendChild(option.cloneNode(true));
      toSelect.appendChild(option);
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  // File selection
  fileInput.addEventListener('change', handleFileSelect);
  
  // Drag and drop
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
  });
  
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
  });
  
  // Conversion
  convertBtn.addEventListener('click', handleConvert);
  
  // Swap formats
  swapBtn.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    validateConversion();
  });
  
  // Add to favorites
  favoriteBtn.addEventListener('click', addToFavorites);
  
  // History panel
  historyBtn.addEventListener('click', () => {
    historyPanel.classList.remove('hidden');
  });
  closeHistoryBtn.addEventListener('click', () => {
    historyPanel.classList.add('hidden');
  });
  
  // Favorites panel
  favoritesBtn.addEventListener('click', () => {
    favoritesPanel.classList.remove('hidden');
  });
  closeFavoritesBtn.addEventListener('click', () => {
    favoritesPanel.classList.add('hidden');
  });
  
  // Clear buttons
  clearHistoryBtn.addEventListener('click', () => {
    conversionHistory = [];
    localStorage.setItem('henkanki-history', JSON.stringify(conversionHistory));
    renderHistory();
    updateCounts();
    showNotification('History cleared', 'success');
  });
  
  clearFavoritesBtn.addEventListener('click', () => {
    favoriteConversions = [];
    localStorage.setItem('henkanki-favorites', JSON.stringify(favoriteConversions));
    renderFavorites();
    updateCounts();
    showNotification('Favorites cleared', 'success');
  });
  
  // Copy to clipboard
  copyBtn.addEventListener('click', () => {
    if (!outputEl.textContent) {
      showNotification('Nothing to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(outputEl.textContent)
      .then(() => showNotification('Copied to clipboard!', 'success'))
      .catch(() => showNotification('Failed to copy', 'error'));
  });
  
  // Clear output
  clearBtn.addEventListener('click', () => {
    outputEl.textContent = '';
    downloadLink.hidden = true;
    fileInfoEl.classList.add('hidden');
    fileInput.value = '';
  });
  
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleConvert();
    }
    if (e.ctrlKey && e.key === 'c' && outputEl.textContent) {
      navigator.clipboard.writeText(outputEl.textContent);
      e.preventDefault();
    }
  });
  
  // Auto-validate on format change
  fromSelect.addEventListener('change', validateConversion);
  toSelect.addEventListener('change', validateConversion);
}

// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Show file info
  fileInfoEl.classList.remove('hidden');
  $('file-name').textContent = file.name;
  $('file-size').textContent = formatBytes(file.size);
  
  // Detect format
  const detectedFormat = detectFormat(file.name)?.id || 'txt';
  if (fromSelect.value === 'auto') {
    fromSelect.value = detectedFormat;
  }
  
  // Auto-select output format if possible
  const formatInfo = listFormats().find(f => f.id === detectedFormat);
  if (formatInfo && formatInfo.outputs.length > 0 && toSelect.value === 'json') {
    toSelect.value = formatInfo.outputs[0];
  }
  
  validateConversion();
}

// Handle conversion
async function handleConvert() {
  const file = fileInput.files[0];
  if (!file) {
    showNotification('Choose a file first', 'error');
    return;
  }
  
  let from = fromSelect.value;
  const to = toSelect.value;
  
  // Auto-detect if needed
  if (from === 'auto') {
    from = detectFormat(file.name)?.id || 'txt';
    fromSelect.value = from;
  }
  
  // Validate
  if (!validateConversion()) return;
  
  try {
    const startTime = performance.now();
    const fileText = await file.text();
    const result = await convertText(fileText, from, to);
    const endTime = performance.now();
    
    // Show result
    outputEl.textContent = result;
    
    // Update download link
    const extension = getExtension(to);
    const blob = new Blob([result], { type: getMimeType(to) });
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `henkanki-${file.name.replace(extname(file.name), '')}.${extension}`;
    downloadLink.hidden = false;
    
    // Update stats
    $('conversion-time').textContent = `Time: ${(endTime - startTime).toFixed(2)}ms`;
    $('input-size').textContent = `Input: ${formatBytes(file.size)}`;
    $('output-size').textContent = `Output: ${formatBytes(Buffer.byteLength(result, 'utf8'))}`;
    
    // Add to history
    addToHistory({
      file: file.name,
      from,
      to,
      time: new Date().toISOString(),
      size: file.size
    });
    
    showNotification('Conversion successful!', 'success');
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
    console.error(error);
  }
}

// Validate conversion
function validateConversion() {
  let from = fromSelect.value;
  const to = toSelect.value;
  
  if (from === 'auto') {
    const file = fileInput.files[0];
    if (file) {
      from = detectFormat(file.name)?.id || 'txt';
    } else {
      from = 'txt';
    }
  }
  
  if (!from || !to) {
    convertBtn.disabled = true;
    return false;
  }
  
  const isValid = canConvert(from, to) || canConvertText(from, to);
  convertBtn.disabled = !isValid;
  
  if (!isValid) {
    showNotification(`Conversion from ${from.toUpperCase()} to ${to.toUpperCase()} is not supported`, 'error');
  }
  
  return isValid;
}

// Add to history
function addToHistory(item) {
  conversionHistory.unshift(item);
  if (conversionHistory.length > 50) {
    conversionHistory = conversionHistory.slice(0, 50);
  }
  localStorage.setItem('henkanki-history', JSON.stringify(conversionHistory));
  renderHistory();
  updateCounts();
}

// Add to favorites
function addToFavorites() {
  const from = fromSelect.value;
  const to = toSelect.value;
  
  if (from === 'auto' || !from || !to) {
    showNotification('Select both formats first', 'error');
    return;
  }
  
  const favorite = { from, to };
  const exists = favoriteConversions.some(f => f.from === from && f.to === to);
  
  if (exists) {
    showNotification('Already in favorites', 'error');
    return;
  }
  
  favoriteConversions.push(favorite);
  localStorage.setItem('henkanki-favorites', JSON.stringify(favoriteConversions));
  renderFavorites();
  updateCounts();
  showNotification('Added to favorites!', 'success');
}

// Render history
function renderHistory() {
  historyList.innerHTML = '';
  conversionHistory.slice(0, 20).forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="info">
        <div>${item.file}</div>
        <div class="date">${formatDate(item.time)}</div>
      </div>
      <div>
        <span class="conversion">${item.from} → ${item.to}</span>
        <span class="remove" data-index="${index}">×</span>
      </div>
    `;
    div.querySelector('.remove').addEventListener('click', (e) => {
      e.stopPropagation();
      conversionHistory.splice(index, 1);
      localStorage.setItem('henkanki-history', JSON.stringify(conversionHistory));
      renderHistory();
      updateCounts();
    });
    div.addEventListener('click', () => {
      // Re-run this conversion
      fromSelect.value = item.from;
      toSelect.value = item.to;
      historyPanel.classList.add('hidden');
      showNotification(`Loaded: ${item.from} → ${item.to}`, 'success');
    });
    historyList.appendChild(div);
  });
}

// Render favorites
function renderFavorites() {
  favoritesList.innerHTML = '';
  favoriteConversions.forEach((fav, index) => {
    const div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = `
      <div class="info">
        <div>${fav.from} → ${fav.to}</div>
      </div>
      <span class="remove" data-index="${index}">×</span>
    `;
    div.querySelector('.remove').addEventListener('click', (e) => {
      e.stopPropagation();
      favoriteConversions.splice(index, 1);
      localStorage.setItem('henkanki-favorites', JSON.stringify(favoriteConversions));
      renderFavorites();
      updateCounts();
    });
    div.addEventListener('click', () => {
      fromSelect.value = fav.from;
      toSelect.value = fav.to;
      favoritesPanel.classList.add('hidden');
      showNotification(`Loaded: ${fav.from} → ${fav.to}`, 'success');
    });
    favoritesList.appendChild(div);
  });
}

// Update counts
function updateCounts() {
  historyCount.textContent = conversionHistory.length;
  favoritesCount.textContent = favoriteConversions.length;
}

// Theme functions
function loadTheme() {
  const savedTheme = localStorage.getItem('henkanki-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('henkanki-theme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  showNotification(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');
}

// Notification
function showNotification(message, type = 'info') {
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Helper functions
function getMimeType(format) {
  const mimeMap = {
    json: 'application/json',
    yaml: 'application/x-yaml',
    csv: 'text/csv',
    md: 'text/markdown',
    html: 'text/html',
    txt: 'text/plain',
    xml: 'application/xml',
    toml: 'application/toml',
    ini: 'text/x-ini',
    json5: 'application/json5',
    hjson: 'application/hjson',
    base64: 'text/plain',
    url: 'text/plain'
  };
  return mimeMap[format] || 'text/plain';
}

function getExtension(format) {
  const extMap = {
    json: 'json',
    yaml: 'yaml',
    csv: 'csv',
    md: 'md',
    html: 'html',
    txt: 'txt',
    xml: 'xml',
    toml: 'toml',
    ini: 'ini',
    json5: 'json5',
    hjson: 'hjson',
    base64: 'txt',
    url: 'txt'
  };
  return extMap[format] || format;
}

function extname(filename) {
  return filename.slice(filename.lastIndexOf('.'));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString();
}

// Register service worker for PWA
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/public/service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
}
