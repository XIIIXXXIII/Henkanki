# CI Templates

This directory contains the release-quality automation prepared for Henkanki v1:

| Template | Purpose |
|---|---|
| `workflows/ci.yml` | Core tests, adapter tests, Rust core test, PWA typecheck/build and production audit |
| `workflows/freebsd.yml` | Manual and path-triggered FreeBSD CLI smoke test in a FreeBSD VM |
| `dependabot.yml` | Weekly dependency update configuration for Node and Cargo |

To activate these files, copy `ci/workflows/` to `.github/workflows/` and `ci/dependabot.yml` to `.github/dependabot.yml` in a commit made by a GitHub token with the **Workflows** permission. The current automated push credential cannot create or update files below `.github/workflows`, so storing the templates here preserves the exact intended automation without implying that it is already active.
