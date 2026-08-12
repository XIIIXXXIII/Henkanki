# ADR 0001: Truthful support policy

## Decision

Henkanki distinguishes **format recognition** from **verified conversion support**. A format may appear in the registry for planning and capability discovery, but an operation is marked `official` or `supported` only when a real fixture test validates its output.

## Consequences

Missing local tools return a structured `MISSING_DEPENDENCY` error. They never produce a pretend success file. Experimental and historical targets remain visible in compatibility metadata but do not generate release badges.
