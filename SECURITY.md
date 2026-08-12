# Security Policy

Henkanki is designed to operate on local files. Report a vulnerability privately through the repository security advisory interface; do not include an exploit chain in a public issue.

The project treats these as security boundaries: adapter commands use argument arrays rather than shell strings; temporary input and output use private directories; plugin manifests require validation before exposure; and a conversion must fail rather than fabricate a result when its dependency is unavailable. Users should still treat arbitrary documents as untrusted and run Henkanki with only the file-system permissions required for their work.
