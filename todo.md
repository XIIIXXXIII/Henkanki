# Conversion-workspace redesign

- [x] Remove template and Manus-specific web-client artifacts that do not belong to Henkanki.
- [x] Replace the decorative landing composition with a direct file-to-result workbench.
- [x] Add useful local-only task states: file metadata, availability, recent metadata-only routes, clear/reset, and precise errors.
- [x] Verify browser routes, desktop/mobile layouts, and the production bundle.
- [x] Commit and push the redesign to GitHub.

# Universal format detection and conversion

- [x] Define verified, optional, and unavailable conversion routes for every supported format family.
- [x] Detect files by magic bytes, container metadata, text content, and extension as a final hint.
- [x] Add and test real local image, audio, video, document, archive, and structured-data routes.
- [x] Present automatic detection, confidence, output choices, and native dependency needs in CLI and PWA.
- [ ] Update the support matrix, test suite, and release documentation; then publish the verified update.
