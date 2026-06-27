# Henkanki (変換機)

> **Local-first universal file converter**
> No database. No required upload. Your files stay on your device.

---

## 📌 About

**Henkanki** (Japanese for "converter") is a **local-first** file conversion tool that works entirely on your device. It supports converting between various text-based formats (JSON, YAML, CSV, Markdown, HTML, plain text) with a **CLI** and a **PWA web interface**.

### ✨ Features

- **Local-first**: All processing happens on your device. No cloud, no uploads.
- **Extensible**: Easy to add new formats via plugins.
- **Cross-platform**: Works in browsers (PWA) and Node.js (CLI).
- **Offline support**: The web app works offline thanks to service workers.

---

## 🚀 Quick Start

### CLI Usage

1. **Install dependencies** (if any):
   ```bash
   npm install
   ```

2. **List supported formats**:
   ```bash
   node apps/cli/henkanki.mjs formats
   ```

3. **Get file info**:
   ```bash
   node apps/cli/henkanki.mjs info package.json
   ```

4. **Convert a file**:
   ```bash
   node apps/cli/henkanki.mjs convert input.json output.yaml --from json --to yaml
   ```
   Or let Henkanki auto-detect formats:
   ```bash
   node apps/cli/henkanki.mjs convert input.json output.yaml
   ```

5. **Run all checks**:
   ```bash
   npm run check
   ```

### Web App Usage

1. **Start the development server**:
   ```bash
   npm run dev:web
   ```
   Open [http://localhost:4173](http://localhost:4173) in your browser.

2. **Use the PWA**:
   - Choose a file (JSON, YAML, CSV, Markdown, HTML, or TXT).
   - Select the input and output formats.
   - Click "Convert locally".
   - Download the result.

---

## 📦 Project Structure

```
Henkanki/
├── apps/
│   ├── cli/               # CLI tool
│   │   └── henkanki.mjs   # Main CLI entry point
│   └── web/               # Web PWA
│       ├── index.html     # Main HTML
│       ├── server.mjs     # Dev server
│       ├── src/
│       │   └── main.mjs    # Web app logic
│       └── public/
│           ├── manifest.webmanifest  # PWA manifest
│           └── service-worker.js      # Service worker
├── packages/
│   ├── core/              # Core logic
│   │   └── src/index.mjs  # Format detection & conversion graph
│   ├── converters/        # Conversion implementations
│   │   ├── src/index.mjs  # Converter router
│   │   └── src/text.mjs   # Text-based converters
│   └── formats/           # Format registry
│       └── src/formats.json
├── docs/
│   └── roadmap.md         # Development roadmap
├── tools/
│   └── check.mjs          # Project validation
├── package.json
├── henkanki.config.json
└── README.md
```

---

## 🔧 Supported Formats & Conversions

### Text Formats

| Format | Extension | MIME Type | Can Convert To |
|--------|-----------|-----------|----------------|
| JSON   | `.json`    | `application/json` | YAML, TXT, CSV |
| YAML   | `.yaml`    | `application/x-yaml` | JSON, TXT |
| CSV    | `.csv`     | `text/csv` | JSON, MD, TXT |
| Markdown | `.md`    | `text/markdown` | HTML, TXT |
| HTML   | `.html`    | `text/html` | MD, TXT |
| Text   | `.txt`     | `text/plain` | JSON, YAML, MD, HTML, CSV |

### Example Conversions

```bash
# JSON to YAML
node apps/cli/henkanki.mjs convert data.json data.yaml

# CSV to JSON
node apps/cli/henkanki.mjs convert data.csv data.json

# Markdown to HTML
node apps/cli/henkanki.mjs convert README.md README.html

# HTML to Markdown
node apps/cli/henkanki.mjs convert index.html index.md --from html --to md

# Any text to JSON
node apps/cli/henkanki.mjs convert notes.txt notes.json --from txt --to json
```

---

## 🛠 Development

### Adding a New Format

1. **Add to `packages/formats/src/formats.json`**:
   ```json
   {
     "id": "xml",
     "extension": "xml",
     "mime": "application/xml",
     "category": "text",
     "outputs": ["json", "yaml"]
   }
   ```

2. **Implement converters in `packages/converters/src/text.mjs`**:
   ```javascript
   export function xmlToJson(text) {
     // Your conversion logic
   }
   ```

3. **Register in `packages/converters/src/index.mjs`**:
   ```javascript
   const textConverters = {
     'xml->json': xmlToJson,
     // ...
   };
   ```

4. **Test it**:
   ```bash
   node apps/cli/henkanki.mjs convert input.xml output.json
   ```

### Running Tests

```bash
npm run check
```

This will:
- Verify all required files exist.
- Test the CLI commands.
- Validate all supported conversions.

---

## 📜 Roadmap

See [docs/roadmap.md](docs/roadmap.md) for future plans, including:
- **Phase 2**: Binary file support (images, PDFs).
- **Phase 3**: Desktop & mobile apps.
- **Phase 4**: Heavy formats (video, audio, archives).

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.
