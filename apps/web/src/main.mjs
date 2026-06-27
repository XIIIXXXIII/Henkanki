import { convertText } from '../../../packages/converters/src/index.mjs';
const $ = (id) => document.getElementById(id);
$('convert').addEventListener('click', async () => {
  const file = $('file').files[0];
  if (!file) return show('Choose a file first.');
  try {
    const result = await convertText(await file.text(), $('from').value, $('to').value);
    show(result);
    const blob = new Blob([result], { type: 'text/plain' });
    const link = $('download');
    link.href = URL.createObjectURL(blob);
    link.download = `henkanki-output.${$('to').value}`;
    link.hidden = false;
    link.textContent = `Download ${link.download}`;
  } catch (error) { show(`Error: ${error.message}`); }
});
function show(text) { $('output').textContent = text; }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/public/service-worker.js').catch(() => {});
