# Henkanki (変換器)

Local-first universal file converter. No database. No required upload. Your files stay on your device.

## Structure

- `apps/cli`: Command line interface.
- `apps/web`: Web application (PWA).
- `packages/core`: Core logic and format detection.
- `packages/converters`: Conversion implementations.
- `packages/formats`: Format registry.
- `docs`: Project documentation and roadmap.
- `compat`: OS and Architecture compatibility matrices.

## Getting Started

### CLI
```bash
node apps/cli/henkanki.mjs help
```

### Web
```bash
node apps/web/server.mjs
```
Then open `http://localhost:4173`.

## License
MIT
