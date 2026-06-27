# Architecture

Henkanki is a **local-first file converter**. The default path is no upload, no account, no database, and no server-side compute.

## Core idea

```text
User device
  -> loads Henkanki
  -> selects files
  -> converts locally
  -> saves result
```

The server, if present, is allowed to serve static assets, release metadata, documentation, and optional fallback services.
It must not be required for the core product experience.

## Layers

```text
apps/
  web       Browser/PWA shell.
  desktop   Native desktop shell.
  cli       Terminal shell.
  mobile    Android/iOS/mobile Linux shell.

packages/
  core       Product model and shared conversion planning.
  formats    Format metadata and MIME/extension rules.
  converters Converter adapters and capability declarations.
  ui         Shared UI vocabulary where useful.
  config     Shared project configuration.

crates/
  henkanki-core  Portable Rust core for native/WASM targets.
  henkanki-cli   CLI binary.
  henkanki-wasm  WebAssembly bindings.

ports/
  OS and architecture packaging that should not pollute app code.

retro/
  Legacy and historical work with strict isolation from modern builds.
```

## Design rules

1. Keep the conversion core independent from any single UI toolkit.
2. Prefer local conversion over server conversion.
3. Keep heavy generated files and release binaries out of Git.
4. Put platform-specific hacks in `ports/` or `retro/`, not in the core.
5. Treat old systems as separate compatibility products, not blockers for modern releases.
6. Allow many programming languages, but require each directory to document why that language exists there.

## Future server mode

A future optional server may provide:

- static hosting;
- update metadata;
- documentation;
- optional cloud fallback conversion;
- plugin indexes;
- crash/telemetry endpoints only if explicitly opt-in.

A database is intentionally not part of the baseline architecture.
