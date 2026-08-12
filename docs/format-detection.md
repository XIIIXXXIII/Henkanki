# Format Detection and Support Policy

Henkanki chooses the input format by **content first**. A filename extension is used only when the bytes and parseable content are inconclusive. The detector reports a format, confidence, method, and evidence so that users can see why a route was selected.

| Detection stage | Examples | Result |
|---|---|---|
| Magic bytes | PNG, JPEG, PDF, ZIP, gzip, 7z, MP3, FLAC, WAV, MP4, Matroska | High-confidence binary format or container family. |
| Container inspection | DOCX, XLSX, PPTX, ODT, ODS, ODP, EPUB | Detects internal manifest paths, not a renamed extension. |
| Parseable content | JSON, NDJSON, HTML, XML, TOML, YAML, CSV, TSV, Markdown | Text route selected only when the content resembles that syntax. |
| Extension hint | Ambiguous ISO media and generic archives | Used only to distinguish related containers such as MP4/M4A/MOV. |
| Safe fallback | Unknown readable bytes | Classified as plain text; unknown binary remains unavailable rather than being misconverted. |

## Support levels

| Level | Meaning |
|---|---|
| **Browser-ready** | Structured data, text, Markdown, HTML, and codecs that can be converted entirely in the PWA. |
| **Native verified** | Image, PDF, audio/video, Office, and archive routes with a local engine and fixture test. |
| **Optional native** | A route is planned by the local engine but requires a tool reported by `henkanki doctor`. |
| **Unavailable** | Henkanki knows the format but has no verified target route; it never produces placeholder output. |

The product does not claim that every pair of every format is convertible. A user can add any file; Henkanki will identify it when possible, surface compatible output routes, and say exactly which local engine is required for the selected operation.
