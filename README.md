# Henkanki

**Henkanki** is planned as a local-first, database-free, everywhere-targeting file converter.
The name comes from Japanese **変換器** (*henkanki*), meaning a converter or conversion device.

The project philosophy is intentionally big:

- convert files locally whenever possible;
- avoid mandatory accounts, uploads, queues, and databases;
- keep a small portable core with many platform shells;
- support modern systems officially and older/weirder systems through lite, retro, source, and community ports;
- accept a large repository, but keep it organized by responsibility.

## Editions

| Edition | Purpose |
| --- | --- |
| Henkanki Core | Portable conversion graph, format registry, job model, and shared rules. |
| Henkanki Web | Browser/PWA app using local JavaScript, Web Workers, and WebAssembly. |
| Henkanki Desktop | Native desktop shell for Windows, macOS, Linux, and selected desktop OS ports. |
| Henkanki CLI | Scriptable converter for terminals, servers, retro targets, and automation. |
| Henkanki Mobile | Android, iOS/iPadOS, and mobile Linux shells. |
| Henkanki Lite | Reduced feature set for old 32-bit machines and constrained devices. |
| Henkanki Retro | Historical ports for legacy operating systems and museum hardware. |

## Repository map

```text
apps/          User-facing applications.
packages/      Shared cross-language packages and product-level modules.
crates/        Rust-first portable core, CLI, and WASM bindings.
ports/         Packaging and OS/architecture ports.
retro/         Historical and best-effort ports kept isolated from modern builds.
docs/          Architecture, platform strategy, and project decisions.
tools/         Build, release, and repository maintenance scripts.
examples/      Minimal conversion and embedding examples.
testdata/      Tiny fixtures only; large fixtures belong outside the main repo.
```

See [`docs/repository-layout.md`](docs/repository-layout.md) for the detailed layout rules.

## Platform strategy

Henkanki targets a broad platform surface without pretending every target has the same quality level.
Support levels are:

1. **Official** — released and tested by the project.
2. **Supported** — expected to work and tested when practical.
3. **Experimental** — builds may exist; bugs and missing features are expected.
4. **Legacy** — old systems with a reduced feature set.
5. **Historical** — retro/source/community experiments only.

See [`docs/platforms.md`](docs/platforms.md) for the current target matrix.

## Architecture

Henkanki is designed as a small-core, many-ports project:

```text
portable core
  + web shell
  + desktop shell
  + mobile shell
  + CLI shell
  + lite/retro ports
```

The first architectural rule is that conversion should happen on the user's device whenever possible.
Server-side conversion can exist later as an optional fallback, but it is not part of the base requirement.

See [`docs/architecture.md`](docs/architecture.md) for the initial architecture.

## License

Henkanki is licensed under the GNU General Public License v3.0. See [`LICENSE`](LICENSE).
