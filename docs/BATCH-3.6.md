# Advanced Batch Edition — 3.6.0 roadmap

Internal version remains 3.5.0 until the candidate is prepared.

Stage 1a: explicit optional independent PDF rules, pending CI.
- Existing shared authors/Mark and Office properties retain their legacy behavior unless separate rules are enabled.
- Independent PDF authors and Mark; Office-only properties are scoped to Office. PDF privacy conflicts use PDF author rules; Office conflicts remain independent.
- Preview and generation use the same format routing. Existing fingerprint, output limits, verification and confirmation remain unchanged.
- Workflows and configuration backups preserve optional pdfRules. Older recipes lacking the property use shared legacy behavior; presets reset new options. Credentials excluded.
- Mixed Office/PDF output and workflow roundtrip regression tests.

Next: separate Word/Excel/PowerPoint overrides, verified combined operation engine integration, batch privacy preflight and comparison, queue and cancellation improvements, final candidate validation. No automatic release/deploy.
