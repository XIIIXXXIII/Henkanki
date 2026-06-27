# Plugin System Draft

Plugins describe converters, detectors, metadata readers, or UI tools.

```json
{
  "id": "henkanki.converter.example",
  "name": "Example Converter",
  "runtime": "wasm",
  "inputs": ["png"],
  "outputs": ["webp"]
}
```

Preferred runtimes:
- WASM for portability.
- External commands for CLI/Desktop.
- JavaScript for Web-only helpers.
