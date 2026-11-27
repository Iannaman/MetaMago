# Privacy Inspector 2.0 — roadmap 3.5.0

Stage 1 candidate: evidence locations, pending CI. Internal version remains 3.4.0 until the integrated candidate is ready.

- Office: bounded internal package paths, metadata field identifiers, relationship IDs, sheet IDs and part references for existing findings.
- PDF: bounded indirect object references from QPDF's existing structural traversal. References are object locations, not page coordinates; counts remain indicators, not distinct objects.
- Details are collapsed by default; up to 20 references per finding, with explicit truncation. No new extraction of document text, URLs, scripts, attachment contents or passwords. No new report export fields.
- Existing applicability, unknown/partial coverage and read-only behaviour stay intact. A negative finding is not proof of anonymisation.

Next stages:
1. Validate localization with Office and PDF fixtures (including locked and incomplete scans).
2. Add a filterable review queue distinguishing present, unknown, not detected and not applicable. Provide actionable guidance without arbitrary risk scores.
3. Add optional, bounded local detection of selected patterns in supported text sources, with explicit coverage, false-positive caveats and no raw matched values in exports by default.
4. Integrate residual review with the verified operation plan and test original/copy identity, cancellation, accessibility and privacy boundaries. Any destructive content removal requires separate design and verification.
