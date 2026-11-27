# Advanced Batch Edition — 3.6.0 roadmap

Internal version remains 3.5.0 until the candidate is prepared.

Stage 1a: explicit optional independent PDF rules, passed CI (46007114052).

Stage 1b: per-family Office rules implemented, pending CI. Word, Excel and PowerPoint (including supported macro/template variants) may inherit common settings or explicitly replace author, last author, company, manager, Mark and identity cleanup. Overrides replace all those common Office settings; they do not alter PDF routing. Preview and generation route through the same function. Legacy workflows without officeRules inherit common settings; new recipes retain optional overrides, and presets reset them. Tests extend the actual mixed ZIP to all four families, validate malformed and conflicting overrides, roundtrip configuration, and legacy reset.
- Existing shared authors/Mark and Office properties retain their legacy behavior unless separate rules are enabled.
- Independent PDF authors and Mark; Office-only properties are scoped to Office. PDF privacy conflicts use PDF author rules; Office conflicts remain independent.
- Preview and generation use the same format routing. Existing fingerprint, output limits, verification and confirmation remain unchanged.
- Workflows and configuration backups preserve optional pdfRules. Older recipes lacking the property use shared legacy behavior; presets reset new options. Credentials excluded.
- Mixed Office/PDF output and workflow roundtrip regression tests.

Next: verified combined operation engine integration, batch privacy preflight and comparison, queue and cancellation improvements, final candidate validation. No automatic release/deploy.
