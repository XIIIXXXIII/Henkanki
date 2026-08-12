# Contributing to Henkanki

Henkanki accepts conversion routes only when they are **truthful, local, and tested**. A format added to the registry must state its support tier, required tools, lossy behaviour, and route-level tests. Do not register a route that returns a message, a synthetic file, or unverified metadata in place of a conversion.

Run `pnpm test:all` before opening a pull request. For native adapters, include a fixture generated locally by the test and confirm that missing tools return `MISSING_DEPENDENCY` or an equivalent diagnostic. Do not add network uploads, telemetry, automatic plugin downloads, or shell-interpolated command construction.
