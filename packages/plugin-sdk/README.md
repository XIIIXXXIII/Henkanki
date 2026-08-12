# Henkanki Plugin SDK

A plugin declares conversion operations, local tool requirements and supported platforms in a JSON-compatible manifest. Henkanki never downloads or executes a plugin automatically: users opt into a local plugin directory, and the host validates the manifest before exposing its routes.

Plugins receive file paths and explicit options, not a shell command string. They report progress through structured events and must return either an output file or a typed diagnostic.
