// Kanso Industrial: VS Code is a local client for the same explicit Henkanki CLI plan.
const vscode = require('vscode');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);
const formats = ['json', 'yaml', 'toml', 'ini', 'xml', 'csv', 'tsv', 'ndjson', 'markdown', 'html', 'text', 'base64', 'url', 'hex'];

function cliPath() {
  const configured = vscode.workspace.getConfiguration('henkanki').get('cliPath');
  return configured || path.resolve(__dirname, '..', 'cli', 'henkanki.mjs');
}

async function invoke(args) {
  const { stdout } = await run(process.execPath, [cliPath(), ...args, '--json'], { maxBuffer: 16 * 1024 * 1024 });
  return JSON.parse(stdout);
}

function formatFromPath(filePath) {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return ({ md: 'markdown', txt: 'text', yml: 'yaml', jpg: 'jpeg', jsonl: 'ndjson' })[extension] || extension || 'text';
}

async function chooseOutput(placeHolder) { return vscode.window.showQuickPick(formats, { placeHolder }); }

async function convertFile(uri) {
  const selected = uri || vscode.window.activeTextEditor?.document.uri;
  if (!selected) return vscode.window.showErrorMessage('No file selected.');
  const from = formatFromPath(selected.fsPath); const to = await chooseOutput(`Convert ${from} to…`);
  if (!to) return;
  const target = selected.fsPath.replace(/\.[^.]+$/, '') + `.${to === 'text' ? 'txt' : to}`;
  try {
    await invoke(['convert', selected.fsPath, target, '--from', from, '--to', to]);
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(target)); await vscode.window.showTextDocument(document, { preview: false });
    vscode.window.showInformationMessage(`Henkanki converted locally to ${path.basename(target)}.`);
  } catch (error) { vscode.window.showErrorMessage(`Henkanki conversion failed: ${error.message}`); }
}

async function convertSelection() {
  const editor = vscode.window.activeTextEditor; if (!editor || editor.selection.isEmpty) return vscode.window.showErrorMessage('Select text to convert.');
  const from = formatFromPath(editor.document.fileName); const to = await chooseOutput(`Convert selection from ${from} to…`); if (!to) return;
  const stamp = Date.now(); const source = vscode.Uri.file(path.join(os.tmpdir(), `henkanki-selection-${stamp}.${from}`)); const target = vscode.Uri.file(path.join(os.tmpdir(), `henkanki-selection-${stamp}.${to}`));
  try {
    await vscode.workspace.fs.writeFile(source, Buffer.from(editor.document.getText(editor.selection)));
    await invoke(['convert', source.fsPath, target.fsPath, '--from', from, '--to', to]);
    const output = Buffer.from(await vscode.workspace.fs.readFile(target)).toString('utf8'); await editor.edit((builder) => builder.replace(editor.selection, output));
    vscode.window.showInformationMessage(`Henkanki converted the selected text to ${to}.`);
  } catch (error) { vscode.window.showErrorMessage(`Henkanki conversion failed: ${error.message}`); }
}

async function convertClipboard() {
  const input = await vscode.env.clipboard.readText(); if (!input) return vscode.window.showErrorMessage('Clipboard is empty.');
  const to = await chooseOutput('Convert clipboard text to…'); if (!to) return;
  const stamp = Date.now(); const source = vscode.Uri.file(path.join(os.tmpdir(), `henkanki-clipboard-${stamp}.text`)); const target = vscode.Uri.file(path.join(os.tmpdir(), `henkanki-clipboard-${stamp}.${to}`));
  try { await vscode.workspace.fs.writeFile(source, Buffer.from(input)); await invoke(['convert', source.fsPath, target.fsPath, '--from', 'text', '--to', to]); await vscode.env.clipboard.writeText(Buffer.from(await vscode.workspace.fs.readFile(target)).toString('utf8')); vscode.window.showInformationMessage(`Henkanki copied ${to} output locally.`); }
  catch (error) { vscode.window.showErrorMessage(`Henkanki conversion failed: ${error.message}`); }
}

async function planFile(uri) {
  const selected = uri || vscode.window.activeTextEditor?.document.uri; if (!selected) return vscode.window.showErrorMessage('No file selected.');
  const from = formatFromPath(selected.fsPath); const to = await chooseOutput(`Plan ${from} route to…`); if (!to) return;
  try { const plan = await invoke(['plan', from, to]); vscode.window.showInformationMessage(`${plan.from.id} → ${plan.to.id}: ${plan.status}`); }
  catch (error) { vscode.window.showErrorMessage(`Cannot plan route: ${error.message}`); }
}

async function showFormats() {
  const report = await invoke(['formats']);
  const panel = vscode.window.createWebviewPanel('henkanki.formats', 'Henkanki v1 formats', vscode.ViewColumn.One, {});
  panel.webview.html = `<!doctype html><html><body style="font-family:system-ui;padding:24px"><h1>Henkanki v1</h1><p>Routes are local and capability-aware.</p>${report.map((item) => `<div style="padding:8px 0;border-bottom:1px solid #ddd"><b>${item.id}</b> · ${item.family} · ${item.support}</div>`).join('')}</body></html>`;
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('henkanki.convert', convertSelection),
    vscode.commands.registerCommand('henkanki.convertFile', convertFile),
    vscode.commands.registerCommand('henkanki.convertClipboard', convertClipboard),
    vscode.commands.registerCommand('henkanki.planFile', planFile),
    vscode.commands.registerCommand('henkanki.showFormats', showFormats)
  );
}

function deactivate() {}
module.exports = { activate, deactivate };
