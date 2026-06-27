# Henkanki (変換機)

> **Local-first universal file converter** — Convert JSON, YAML, CSV, Markdown, HTML, XML, TOML, INI, PDF, images, video, audio, documents, and more, all on your device. No servers, no uploads, no tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >=18](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://web.dev/progressive-web-apps/)
[![Desktop](https://img.shields.io/badge/Desktop-Tauri-orange.svg)](https://tauri.app/)
[![Mobile](https://img.shields.io/badge/Mobile-Capacitor-blue.svg)](https://capacitorjs.com/)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-purple.svg)](https://code.visualstudio.com/)

---

## 🌟 Features

✅ **Local-first** — All conversions happen on your device. No internet required.
✅ **Offline support** — Works as a PWA (Progressive Web App).
✅ **Cross-platform** — CLI for Node.js, Web app for browsers, Desktop (Tauri), Mobile (Capacitor), VS Code extension.
✅ **Extensible** — Easy to add new formats via plugins.
✅ **Batch processing** — Convert multiple files at once.
✅ **Rich UI** — Drag-and-drop, dark/light theme, history, favorites.
✅ **Binary formats** — Support for PDF, images (PNG, JPEG, WebP, GIF).
✅ **Heavy formats** — Support for video (MP4, WebM), audio (MP3, WAV), documents (DOCX, XLSX, PPTX), archives (ZIP, TAR).
✅ **AI-powered** — Smart format detection, conversion suggestions, quality assessment.

---

## 📦 Supported Formats

### Text Formats
| Format | Extension | MIME Type | Description |
|--------|-----------|-----------|-------------|
| JSON | `.json` | `application/json` | JavaScript Object Notation |
| YAML | `.yaml`, `.yml` | `application/x-yaml` | YAML Ain't Markup Language |
| CSV | `.csv` | `text/csv` | Comma-Separated Values |
| Markdown | `.md` | `text/markdown` | Lightweight markup language |
| HTML | `.html` | `text/html` | HyperText Markup Language |
| XML | `.xml` | `application/xml` | eXtensible Markup Language |
| TOML | `.toml` | `application/toml` | Tom's Obvious Minimal Language |
| INI | `.ini` | `text/x-ini` | Configuration file format |
| JSON5 | `.json5` | `application/json5` | JSON with extensions |
| HJSON | `.hjson` | `application/hjson` | Human JSON |
| Base64 | `.base64` | `text/plain` | Base64 encoded text |
| URL | `.url` | `text/plain` | URL-encoded text |
| Hex | `.hex` | `text/plain` | Hex dump |
| Text | `.txt` | `text/plain` | Plain text |

### Binary Formats
| Format | Extension | MIME Type | Description |
|--------|-----------|-----------|-------------|
| PNG | `.png` | `image/png` | Portable Network Graphics |
| JPEG | `.jpg`, `.jpeg` | `image/jpeg` | Joint Photographic Experts Group |
| WebP | `.webp` | `image/webp` | Web Picture format |
| GIF | `.gif` | `image/gif` | Graphics Interchange Format |
| PDF | `.pdf` | `application/pdf` | Portable Document Format |

### Video Formats
| Format | Extension | MIME Type | Description |
|--------|-----------|-----------|-------------|
| MP4 | `.mp4` | `video/mp4` | MPEG-4 Part 14 |
| WebM | `.webm` | `video/webm` | Web Media |
| MOV | `.mov` | `video/quicktime` | QuickTime File Format |
| AVI | `.avi` | `video/x-msvideo` | Audio Video Interleave |

### Audio Formats
| Format | Extension | MIME Type | Description |
|--------|-----------|-----------|-------------|
| MP3 | `.mp3` | `audio/mpeg` | MPEG Audio Layer III |
| WAV | `.wav` | `audio/wav` | Waveform Audio File Format |
| OGG | `.ogg` | `audio/ogg` | Ogg Vorbis |
| M4A | `.m4a` | `audio/mp4` | MPEG-4 Audio |

### Document Formats
| Format | Extension | MIME Type | Description |
|--------|-----------|-----------|-------------|
| DOCX | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Office Open XML Word |
| XLSX | `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Office Open XML Spreadsheet |
| PPTX | `.pptx` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | Office Open XML Presentation |

### Archive Formats
| Format | Extension | MIME Type | Description |
|--------|-----------|-----------|-------------|
| ZIP | `.zip` | `application/zip` | ZIP archive |
| TAR | `.tar` | `application/x-tar` | Tape Archive |
| GZ | `.gz` | `application/gzip` | GNU Zip |
| 7z | `.7z` | `application/x-7z-compressed` | 7-Zip |

---

## 🚀 Quick Start

### CLI Usage

1. **Install Node.js** (v18 or higher)
2. **Run a conversion**:

```bash
# Convert JSON to YAML
node apps/cli/henkanki.mjs convert data.json data.yaml

# Convert Markdown to HTML
node apps/cli/henkanki.mjs convert README.md README.html

# Convert CSV to JSON
node apps/cli/henkanki.mjs convert data.csv data.json

# Convert PDF to text
node apps/cli/henkanki.mjs convert document.pdf document.txt --from pdf --to txt

# Convert image formats
node apps/cli/henkanki.mjs convert image.png image.jpg --from png --to jpg

# Convert video to audio
node apps/cli/henkanki.mjs convert video.mp4 audio.mp3 --from mp4 --to mp3

# Specify formats explicitly
node apps/cli/henkanki.mjs convert input.txt output.json --from txt --to json

# Batch convert all JSON files in a directory
node apps/cli/henkanki.mjs batch ./input ./output --from json --to yaml

# Show file information
node apps/cli/henkanki.mjs info package.json

# List all supported formats
node apps/cli/henkanki.mjs formats

# Interactive mode
node apps/cli/henkanki.mjs interactive

# List available plugins
node apps/cli/henkanki.mjs plugins
```

#### CLI Commands

| Command | Description |
|---------|-------------|
| `henkanki formats` | List all supported formats |
| `henkanki info <file>` | Show file information (size, format, MIME) |
| `henkanki convert <input> <output> [--from fmt] [--to fmt]` | Convert a file |
| `henkanki batch <inputDir> <outputDir> [--from fmt] [--to fmt]` | Batch convert files |
| `henkanki interactive` | Interactive conversion mode |
| `henkanki plugins` | List available plugins |
| `henkanki --help` | Show help |

### Web App Usage

1. **Start the development server**:

```bash
npm run dev:web
```

2. **Open in browser**: [http://localhost:4173](http://localhost:4173)

3. **Features**:
   - Drag and drop files
   - Auto-detect format
   - Dark/light theme toggle
   - Conversion history
   - Favorite conversions
   - Copy to clipboard
   - Download results

### Desktop App (Tauri)

1. **Install Rust**: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
2. **Navigate to desktop app**:

```bash
cd apps/desktop
```

3. **Run the app**:

```bash
cargo run
```

4. **Build for production**:

```bash
cargo build --release
```

### Mobile App (Capacitor)

1. **Navigate to mobile app**:

```bash
cd apps/mobile
```

2. **Install dependencies**:

```bash
npm install
```

3. **Add platforms**:

```bash
# For Android
npm run add:android

# For iOS
npm run add:ios
```

4. **Run the app**:

```bash
# For Android
npm run run:android

# For iOS
npm run run:ios
```

### VS Code Extension

1. **Open in VS Code**:

```bash
code apps/vscode
```

2. **Run the extension**:
   - Press F5 to launch the Extension Development Host
   - Open a workspace and use the Henkanki commands from the command palette

3. **Commands**:
   - `Henkanki: Convert Selection` - Convert selected text
   - `Henkanki: Convert File` - Convert the current file
   - `Henkanki: Show Supported Formats` - Show all supported formats
   - `Henkanki: Convert Clipboard Content` - Convert clipboard content

---

## 🛠 Project Structure

```
Henkanki/
├── apps/
│   ├── cli/
│   │   └── henkanki.mjs              # CLI entry point
│   ├── web/
│   │   ├── index.html                # Web app HTML
│   │   ├── server.mjs                # Web server
│   │   └── src/
│   │       ├── main.mjs              # Web app logic
│   │       └── styles.css             # Web app styles
│   ├── desktop/
│   │   ├── Cargo.toml                # Tauri configuration
│   │   ├── tauri.conf.json            # Tauri app configuration
│   │   ├── src/
│   │   │   └── main.rs               # Rust backend
│   │   └── index.html                # Desktop app HTML
│   ├── mobile/
│   │   ├── capacitor.config.json     # Capacitor configuration
│   │   ├── package.json              # Mobile dependencies
│   │   └── README.md                 # Mobile setup guide
│   └── vscode/
│       ├── package.json              # VS Code extension manifest
│       ├── extension.js              # Extension code
│       └── esbuild.config.mjs         # Build configuration
├── packages/
│   ├── core/
│   │   └── src/
│   │       └── index.mjs             # Core logic (format detection, etc.)
│   ├── converters/
│   │   ├── src/
│   │   │   ├── index.mjs             # Converter router
│   │   │   ├── text.mjs               # Text-based converters
│   │   │   ├── binary/
│   │   │   │   └── index.mjs         # Binary format converters
│   │   │   └── heavy/
│   │   │       └── index.mjs         # Heavy format converters (video, audio, etc.)
│   │   └── plugins/
│   │       └── README.md             # Plugin system documentation
│   ├── formats/
│   │   └── src/
│   │       └── formats.json           # Format registry
│   └── ai/
│       └── src/
│           └── index.mjs              # AI-powered features
├── docs/
│   └── roadmap.md                     # Development roadmap
├── tools/
│   └── check.mjs                      # Test suite
├── package.json
├── README.md
└── henkanki.config.json               # Project configuration
```

---

## 🔧 Adding New Formats

### Step 1: Add to `formats.json`

Edit `packages/formats/src/formats.json`:

```json
{
  "id": "newformat",
  "extension": "new",
  "mime": "application/x-newformat",
  "category": "text",
  "outputs": ["json", "yaml", "txt"]
}
```

### Step 2: Add Converter Functions

Edit the appropriate converter file based on format type:

- **Text formats**: `packages/converters/src/text.mjs`
- **Binary formats**: `packages/converters/src/binary/index.mjs`
- **Heavy formats**: `packages/converters/src/heavy/index.mjs`

Example for text format:

```javascript
// In packages/converters/src/text.mjs
export function newformatToJson(text) {
  // Your conversion logic here
  return JSON.stringify(convertedData, null, 2) + '\n';
}

export function jsonToNewformat(text) {
  const data = JSON.parse(text);
  // Your conversion logic here
  return convertedText;
}
```

### Step 3: Register in Converter Index

Edit `packages/converters/src/index.mjs`:

```javascript
import { newformatToJson, jsonToNewformat } from './text.mjs';

const textConverters = {
  'newformat->json': newformatToJson,
  'json->newformat': jsonToNewformat,
  // ... other converters
};
```

### Step 4: Test

Run the test suite:

```bash
npm run check
```

---

## 🤖 AI-Powered Features

Henkanki includes several AI-powered features to enhance the conversion experience:

### Smart Format Detection

Automatically detects file formats based on:
- File extension
- Magic numbers (file signatures)
- Content analysis

```javascript
import { smartDetectFormat } from '../../packages/ai/src/index.mjs';

const result = await smartDetectFormat(fileContent, fileName);
// Returns: { format: 'json', confidence: 0.95, method: 'content' }
```

### Conversion Suggestions

Get suggestions for common conversions based on the input format:

```javascript
import { suggestConversions } from '../../packages/ai/src/index.mjs';

const suggestions = suggestConversions('json');
// Returns: ['yaml', 'toml', 'csv', 'xml']
```

### Quality Assessment

Assess the quality of conversions:

```javascript
import { assessConversionQuality, isLosslessConversion } from '../../packages/ai/src/index.mjs';

const assessment = assessConversionQuality('png', 'jpg');
// Returns: { lossless: false, quality: 0.8, note: 'JPEG is lossy' }

const isLossless = isLosslessConversion('png', 'jpg');
// Returns: false
```

### Content Analysis

Analyze content structure and complexity:

```javascript
import { analyzeContentStructure } from '../../packages/ai/src/index.mjs';

const analysis = analyzeContentStructure(jsonContent);
// Returns: { type: 'json', complexity: 42, depth: 3 }
```

### Privacy Features

Check for sensitive data before sharing:

```javascript
import { checkForSensitiveData, anonymizeContent } from '../../packages/ai/src/index.mjs';

const check = checkForSensitiveData(content);
// Returns: { hasSensitiveData: true, warnings: [...], recommendation: '...' }

const safeContent = anonymizeContent(content);
// Returns content with sensitive data replaced
```

---

## 📊 Conversion Matrix

| From \ To | JSON | YAML | CSV | MD | HTML | XML | TOML | INI | TXT | Base64 | PDF | PNG | MP4 | MP3 | DOCX | XLSX | ZIP |
|-----------|------|------|-----|----|------|-----|------|-----|-----|--------|-----|-----|-----|-----|------|------|-----|
| **JSON** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **YAML** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CSV** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MD** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **HTML** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **XML** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TOML** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **INI** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TXT** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Base64** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PDF** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PNG** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MP4** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **MP3** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **DOCX** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **XLSX** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **ZIP** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

✅ = Supported
❌ = Not supported (yet)

---

## 🎯 Roadmap

See [docs/roadmap.md](docs/roadmap.md) for detailed development plans.

### ✅ Phase 1: Foundation (Complete)
- Core architecture
- Basic text format conversions
- CLI interface
- Web PWA
- Format auto-detection

### ✅ Phase 2: Expansion (Complete)
- Binary format support (PDF, images)
- Plugin system
- Advanced CLI features
- AI-powered format detection

### ✅ Phase 3: Desktop & Mobile (Complete)
- Desktop app (Tauri)
- Mobile apps (Capacitor)
- Cross-platform support

### ✅ Phase 4: Advanced Features (Complete)
- Heavy format support (video, audio, documents)
- AI-powered features
- Quality assessment
- Privacy features

### ✅ Phase 5: Ecosystem (Complete)
- VS Code extension
- Plugin registry
- Community tools

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Good First Issues

- Add support for a new text format
- Improve error messages
- Write unit tests for converters
- Improve documentation
- Create example plugins
- Test on different platforms

### Advanced Issues

- Implement WASM-based converters for heavy formats
- Add more AI-powered features
- Improve performance for large files
- Add cloud sync (optional, opt-in)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the local-first movement
- Built with Node.js, Rust (Tauri), and modern web technologies
- Designed for privacy and offline use
- Special thanks to all contributors

---

## 📞 Contact

- **Repository**: [XIIIXXXIII/Henkanki](https://github.com/XIIIXXXIII/Henkanki)
- **Issues**: [GitHub Issues](https://github.com/XIIIXXXIII/Henkanki/issues)
- **Discussions**: [GitHub Discussions](https://github.com/XIIIXXXIII/Henkanki/discussions)

---

<p align="center">
  Made with ❤️ for the local-first community
</p>
