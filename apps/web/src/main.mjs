import { convertText } from '../../../packages/converters/src/index.mjs';
import { canConvert, findFormat } from '../../../packages/core/src/index.mjs';

const $ = (id) => document.getElementById(id);

// Populate format selectors
function populateFormats() {
  const formats = ['json', 'yaml', 'csv', 'md', 'html', 'txt'];
  const fromSelect = $('from');
  const toSelect = $('to');
  
  // Clear existing options (except the first one)
  while (fromSelect.options.length > 1) fromSelect.remove(1);
  while (toSelect.options.length > 1) toSelect.remove(1);
  
  formats.forEach((fmt) => {
    if (!fromSelect.querySelector(`option[value="${fmt}"]`)) {
      const option = document.createElement('option');
      option.value = fmt;
      option.textContent = fmt.toUpperCase();
      fromSelect.appendChild(option.cloneNode(true));
      toSelect.appendChild(option);
    }
  });
}

// Check if conversion is possible
function isConversionValid(from, to) {
  return canConvert(from, to);
}

// Show message in output
function show(text, isError = false) {
  const output = $('output');
  output.textContent = text;
  output.className = isError ? 'error' : '';
}

// Update download link
function updateDownload(result, toFormat) {
  const link = $('download');
  const extension = toFormat === 'html' ? 'html' : toFormat;
  const blob = new Blob([result], { type: getMimeType(toFormat) });
  link.href = URL.createObjectURL(blob);
  link.download = `henkanki-output.${extension}`;
  link.hidden = false;
  link.textContent = `Download ${link.download}`;
}

// Get MIME type for format
function getMimeType(format) {
  const mimeMap = {
    json: 'application/json',
    yaml: 'application/x-yaml',
    csv: 'text/csv',
    md: 'text/markdown',
    html: 'text/html',
    txt: 'text/plain',
  };
  return mimeMap[format] || 'text/plain';
}

// Handle file selection
$('file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Try to detect format from filename
  const fileName = file.name.toLowerCase();
  const detectedFormat = findFormat(fileName)?.id || 'txt';
  
  // Set the 'from' selector to detected format if it's valid
  if (['json', 'yaml', 'csv', 'md', 'html', 'txt'].includes(detectedFormat)) {
    $('from').value = detectedFormat;
  }
});

// Handle conversion
$('convert').addEventListener('click', async () => {
  const file = $('file').files[0];
  if (!file) return show('Choose a file first.', true);
  
  const from = $('from').value;
  const to = $('to').value;
  
  // Check if conversion is possible
  if (!isConversionValid(from, to)) {
    return show(`Conversion from ${from.toUpperCase()} to ${to.toUpperCase()} is not supported.`, true);
  }
  
  try {
    const fileText = await file.text();
    const result = await convertText(fileText, from, to);
    show(result);
    updateDownload(result, to);
  } catch (error) {
    show(`Error: ${error.message}`, true);
  }
});

// Initialize
populateFormats();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/public/service-worker.js').catch(() => {});
}
