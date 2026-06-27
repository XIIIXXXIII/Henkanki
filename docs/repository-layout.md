# Repository Layout

This repository is intentionally allowed to become large, but not chaotic.
Every top-level directory has a responsibility boundary.

## Top-level directories

| Directory | Responsibility |
| --- | --- |
| `apps/` | User-facing applications and shells. |
| `packages/` | Shared product packages that may be used by multiple apps. |
| `crates/` | Rust crates for portable native and WebAssembly code. |
| `ports/` | OS, architecture, packaging, and distribution integrations. |
| `retro/` | Legacy and historical ports isolated from modern builds. |
| `docs/` | Human-readable architecture, platform, and decision documents. |
| `tools/` | Scripts for build, lint, release, and repository maintenance. |
| `examples/` | Small examples that demonstrate supported APIs. |
| `testdata/` | Tiny fixtures only; large files belong in external artifacts. |

## Organization principles

1. A directory may use any programming language, but it must document the language choice in a local README once it contains real code.
2. Modern production paths must not depend on retro code.
3. Retro ports may copy or adapt code when necessary for ancient toolchains.
4. Packaging belongs in `ports/`, not inside the portable core.
5. Release artifacts belong in releases or package registries, not Git.
6. Large conversion samples belong in external test-data storage, not the main repository.

## Expected growth

The repository may eventually contain hundreds of languages, platforms, and experiments.
That is acceptable if each piece has:

- a clear owner directory;
- a README;
- a build entry point;
- declared support level;
- no accidental coupling to unrelated platforms.
