import { spawnSync } from 'node:child_process';
import process from 'node:process';

export const toolDefinitions = Object.freeze({
  ffmpeg: { command: 'ffmpeg', description: 'audio and video conversion' },
  ffprobe: { command: 'ffprobe', description: 'audio and video inspection' },
  pdftotext: { command: 'pdftotext', description: 'PDF text extraction' },
  pdftoppm: { command: 'pdftoppm', description: 'PDF page rendering' },
  libreoffice: { command: 'libreoffice', description: 'office document conversion' },
  tar: { command: 'tar', description: 'tar archive conversion' },
  zip: { command: 'zip', description: 'zip archive creation' },
  unzip: { command: 'unzip', description: 'zip archive inspection and extraction' }
});

export function commandAvailable(command) {
  const probe = spawnSync(command, ['--version'], { stdio: 'ignore', timeout: 3000 });
  return !probe.error || probe.status === 0;
}

export function discoverCapabilities() {
  const tools = Object.fromEntries(Object.entries(toolDefinitions).map(([id, definition]) => [id, {
    ...definition,
    available: commandAvailable(definition.command)
  }]));
  return {
    platform: process.platform,
    arch: process.arch,
    runtime: { node: process.version },
    tools
  };
}
