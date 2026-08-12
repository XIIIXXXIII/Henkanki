# Henkanki — Local-First File Conversion

> Henkanki identifies a file from its **bytes and parseable content before its filename extension**, plans a conversion, and only then executes it. Text routes run inside the application; PDF, image, media, Office and archive routes are enabled only after their local adapter is discovered. **Files are not uploaded by Henkanki.**

## v1 at a glance

| Surface | What is real today | Scope |
|---|---|---|
| CLI | `convert`, `batch`, `inspect`, `plan`, `formats`, `doctor`, `plugins` | Reference engine for all verified routes |
| PWA | Offline shell; browser-local text conversion plus signature-based input identification | JSON, YAML, CSV, Markdown, HTML and codecs; native routes are identified and handed off honestly |
| Native adapters | PDF text/image, raster transforms, audio/video, Office, ZIP/TAR/GZ/BZ2/XZ | Require local Poppler, FFmpeg, LibreOffice and archive tools as applicable |
| Desktop | Tauri v2 shell invoking the local CLI with explicit argument arrays | Current Linux validation; standard desktop targets are documented |
| Mobile | Expo client for JSON/YAML/plain-text on Android and iOS | Native heavy adapters are intentionally out of scope |
| Niche Unix | FreeBSD port draft and HaikuPorts recipe scaffold | See [platform support](docs/platform-support.md) |

## Quick start

```sh
git clone https://github.com/XIIIXXXIII/Henkanki.git
cd Henkanki
pnpm install
pnpm test:all

# Inspect what the host can really execute
node apps/cli/henkanki.mjs doctor
node apps/cli/henkanki.mjs inspect renamed-upload.bin
node apps/cli/henkanki.mjs plan mp4 webm

# Convert a verified local route
node apps/cli/henkanki.mjs convert profile.json profile.yaml
node apps/cli/henkanki.mjs batch ./incoming ./out --to webp
```

`henkanki doctor` is the source of truth for optional tooling. A missing adapter produces a typed diagnostic rather than a placeholder file.

`henkanki inspect` reports the detected format, confidence, and evidence. PNG/JPEG/PDF/ZIP/Office containers, common audio/video containers, archives, and text formats are identified from content where possible; extensions are a final hint for ambiguous containers such as MP4/M4A/MOV. See [format detection](docs/format-detection.md) for the detection cascade and support policy.

## Route families

| Family | Examples | Execution |
|---|---|---|
| Structured text | JSON, YAML, TOML, INI, XML, CSV, TSV, NDJSON | Built in and tested |
| Markup/codecs | Markdown, HTML, plain text, Base64, URL, hex | Built in and tested |
| Images | PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, AVIF | FFmpeg adapter; output warnings identify lossy codecs |
| Documents | PDF ↔ text/image; image → PDF; Office → PDF/text | Native libraries or discovered tools |
| Audio | MP3, WAV, FLAC, OGG, M4A, AAC, Opus, AIFF | FFmpeg adapter |
| Video | MP4, MKV, WebM, MOV, AVI, 3GP, MPEG, MPEG-TS, GIF/frame output | FFmpeg adapter |
| Archives | ZIP, TAR, GZ, BZ2, XZ list/repack | JSZip and local archive tools |

## Applications

```sh
# Web PWA
pnpm --filter henkanki-web dev

# Desktop shell (requires platform Tauri dependencies)
cargo run --manifest-path apps/desktop/Cargo.toml

# Mobile Expo client
cd apps/mobile && npm install && npm run android
```

The VS Code extension is under `apps/vscode`. It calls the colocated local CLI; set `henkanki.cliPath` in VS Code settings when your CLI lives elsewhere.

## Platform policy

Henkanki has a support model, not an indiscriminate platform claim. FreeBSD `amd64` CLI is the initial Unix priority; Haiku `x86_64` has an explicitly experimental packaging path. See [docs/platform-support.md](docs/platform-support.md) for the full matrix and release criteria.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), run `pnpm test:all`, and add a route-level test for every new converter. External plugins use [packages/plugin-sdk](packages/plugin-sdk/README.md); they are never downloaded or executed automatically.

## License

MIT. See [LICENSE](LICENSE).
