// Henkanki VS Code Extension
// Local-first file conversion in VS Code

const vscode = require('vscode');
const { convert, listTextConverters, canConvert } = require('../../packages/converters/src/index.mjs');
const { listFormats, detectFormat } = require('../../packages/core/src/index.mjs');

function activate(context) {
  console.log('Henkanki VS Code extension is now active!');

  // Register commands
  const convertCommand = vscode.commands.registerCommand('henkanki.convert', async () => {
    await convertSelection();
  });

  const convertFileCommand = vscode.commands.registerCommand('henkanki.convertFile', async (uri) => {
    await convertFile(uri);
  });

  const showFormatsCommand = vscode.commands.registerCommand('henkanki.showFormats', async () => {
    await showFormats();
  });

  const convertClipboardCommand = vscode.commands.registerCommand('henkanki.convertClipboard', async () => {
    await convertClipboard();
  });

  context.subscriptions.push(convertCommand, convertFileCommand, showFormatsCommand, convertClipboardCommand);
}

async function convertSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found');
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  if (!selectedText) {
    vscode.window.showErrorMessage('No text selected');
    return;
  }

  // Detect format from content
  const detectedFormat = detectFormatFromContent(selectedText);
  
  // Show format selection
  const fromFormat = await vscode.window.showQuickPick([
    { label: 'Auto-detect', description: detectedFormat ? `Detected: ${detectedFormat}` : 'Unknown' },
    ...listFormats().filter(f => f.category === 'text').map(f => ({ label: f.id, description: f.mime }))
  ], { placeHolder: 'Select input format' });

  if (!fromFormat) return;

  const toFormat = await vscode.window.showQuickPick(
    listFormats()
      .filter(f => canConvert(fromFormat.label === 'Auto-detect' ? detectedFormat : fromFormat.label, f.id))
      .map(f => ({ label: f.id, description: f.mime })),
    { placeHolder: 'Select output format' }
  );

  if (!toFormat) return;

  try {
    const inputFormat = fromFormat.label === 'Auto-detect' ? detectedFormat : fromFormat.label;
    const result = await convert(selectedText, inputFormat, toFormat.label);

    // Replace selection with result
    editor.edit(editBuilder => {
      editBuilder.replace(selection, String(result));
    });

    vscode.window.showInformationMessage(`Converted from ${inputFormat} to ${toFormat.label}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Conversion failed: ${error.message}`);
  }
}

async function convertFile(uri) {
  if (!uri) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showErrorMessage('No file selected');
      return;
    }
    uri = activeEditor.document.uri;
  }

  const filePath = uri.fsPath;
  const fileContent = await vscode.workspace.fs.readFile(uri);
  const content = fileContent.toString('utf8');

  // Detect format
  const detectedFormat = detectFormat(filePath)?.id || detectFormatFromContent(content);
  
  // Show format selection
  const fromFormat = await vscode.window.showQuickPick([
    { label: 'Auto-detect', description: detectedFormat ? `Detected: ${detectedFormat}` : 'Unknown' },
    ...listFormats().map(f => ({ label: f.id, description: f.mime }))
  ], { placeHolder: 'Select input format' });

  if (!fromFormat) return;

  const toFormat = await vscode.window.showQuickPick(
    listFormats()
      .filter(f => canConvert(fromFormat.label === 'Auto-detect' ? detectedFormat : fromFormat.label, f.id))
      .map(f => ({ label: f.id, description: f.mime })),
    { placeHolder: 'Select output format' }
  );

  if (!toFormat) return;

  try {
    const inputFormat = fromFormat.label === 'Auto-detect' ? detectedFormat : fromFormat.label;
    const result = await convert(content, inputFormat, toFormat.label);

    // Save result to new file
    const newFileName = `${filePath}.${toFormat.label}`;
    await vscode.workspace.fs.writeFile(vscode.Uri.file(newFileName), Buffer.from(String(result)));

    vscode.window.showInformationMessage(`File converted and saved to ${newFileName}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Conversion failed: ${error.message}`);
  }
}

async function convertClipboard() {
  const clipboardContent = await vscode.env.clipboard.readText();

  if (!clipboardContent) {
    vscode.window.showErrorMessage('Clipboard is empty');
    return;
  }

  // Detect format from content
  const detectedFormat = detectFormatFromContent(clipboardContent);
  
  // Show format selection
  const fromFormat = await vscode.window.showQuickPick([
    { label: 'Auto-detect', description: detectedFormat ? `Detected: ${detectedFormat}` : 'Unknown' },
    ...listFormats().filter(f => f.category === 'text').map(f => ({ label: f.id, description: f.mime }))
  ], { placeHolder: 'Select input format' });

  if (!fromFormat) return;

  const toFormat = await vscode.window.showQuickPick(
    listFormats()
      .filter(f => canConvert(fromFormat.label === 'Auto-detect' ? detectedFormat : fromFormat.label, f.id))
      .map(f => ({ label: f.id, description: f.mime })),
    { placeHolder: 'Select output format' }
  );

  if (!toFormat) return;

  try {
    const inputFormat = fromFormat.label === 'Auto-detect' ? detectedFormat : fromFormat.label;
    const result = await convert(clipboardContent, inputFormat, toFormat.label);

    // Copy result to clipboard
    await vscode.env.clipboard.writeText(String(result));

    vscode.window.showInformationMessage(`Clipboard content converted from ${inputFormat} to ${toFormat.label}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Conversion failed: ${error.message}`);
  }
}

async function showFormats() {
  const formats = listFormats();
  const textConverters = listTextConverters();

  const panel = vscode.window.createWebviewPanel(
    'henkanki.formats',
    'Henkanki - Supported Formats',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  let html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    .category { margin: 20px 0; }
    .category h2 { color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .format { margin: 5px 0; padding: 5px; background: #f5f5f5; border-radius: 3px; }
    .format-id { font-weight: bold; color: #0066cc; }
    .format-mime { color: #666; font-size: 0.9em; }
    .format-outputs { color: #888; font-size: 0.85em; }
    .stats { margin-top: 20px; padding: 10px; background: #e8f4fd; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Henkanki - Supported Formats</h1>
  <p>Total: ${formats.length} formats | ${textConverters.length} text converters</p>
`;

  // Group by category
  const categories = {};
  for (const fmt of formats) {
    if (!categories[fmt.category]) categories[fmt.category] = [];
    categories[fmt.category].push(fmt);
  }

  for (const [category, categoryFormats] of Object.entries(categories)) {
    html += `<div class="category"><h2>${category}</h2>`;
    for (const fmt of categoryFormats) {
      html += `<div class="format">
        <span class="format-id">${fmt.id}</span>
        <span class="format-mime"> (${fmt.mime})</span>
        <div class="format-outputs">→ ${fmt.outputs.join(', ')}</div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `
  <div class="stats">
    <p><strong>Text Formats:</strong> JSON, YAML, CSV, Markdown, HTML, XML, TOML, INI, JSON5, HJSON, TXT, Base64, URL, Hex</p>
    <p><strong>Binary Formats:</strong> PDF, PNG, JPEG, WebP, GIF</p>
    <p><strong>Heavy Formats:</strong> MP4, WebM, MP3, WAV, DOCX, XLSX, PPTX, ZIP, TAR, GZ</p>
  </div>
</body>
</html>`;

  panel.webview.html = html;
}

function detectFormatFromContent(content) {
  if (!content) return null;

  // Simple detection based on content
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    return 'json';
  }
  if (content.includes(': ') && !content.includes('{')) {
    return 'yaml';
  }
  if (content.includes(',') && !content.includes('{')) {
    return 'csv';
  }
  if (content.includes('# ') || content.includes('## ')) {
    return 'md';
  }
  if (content.includes('<html') || content.includes('<body')) {
    return 'html';
  }
  if (content.includes('<?xml')) {
    return 'xml';
  }
  if (content.includes('=') && content.includes('[')) {
    return 'ini';
  }
  
  return 'txt';
}

function deactivate() {
  // Cleanup if needed
}

module.exports = {
  activate,
  deactivate
};
