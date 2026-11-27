# Privacy Inspector 2.0 — roadmap 3.5.0

Stage 1 evidence locations passed CI (45987404613). Stage 2 review queue passed CI (45988157238). Stage 3a Office text pattern review implemented, pending CI. Internal version remains 3.4.0 until the integrated candidate is ready.

- Office: bounded internal package paths, metadata field identifiers, relationship IDs, sheet IDs and part references for existing findings.
- PDF: bounded indirect object references from QPDF's existing structural traversal. References are object locations, not page coordinates; counts remain indicators, not distinct objects.
- Details are collapsed by default; up to 20 references per finding, with explicit truncation. No new extraction of document text, URLs, scripts, attachment contents or passwords. No new report export fields.
- Existing applicability, unknown/partial coverage and read-only behaviour stay intact. A negative finding is not proof of anonymisation.

Next stages:
1. Validate localization with Office and PDF fixtures (including locked and incomplete scans).
2. Filterable review queue implemented: category counts (not risk scores), all/present/unknown/not detected/not applicable filters, context-specific next checks, unknown-state guidance and empty state. Filters affect only display, not report or scan results. New inspection clears filters and old guidance. Dedicated Office/PDF tests extended.
3. Stage 3a: optional local Office patterns in standard metadata, recognized Word paragraphs, Excel shared/inline strings (not formulas or numeric cells), and PowerPoint slide/note paragraphs. ASCII email, Italian fiscal-code and IBAN checksum checks, Italian-prefix phone heuristics. Counts occurrences, not identities; no raw match values in new results or exports. Limits: 100 XML parts, 12 MiB, 1M characters, 16k per text block, 20 technical locations/category; incomplete coverage explicit. Shared string references are not cell coordinates. No OCR, custom properties, arbitrary embedded objects or PDF text yet. Stage 3b: separate PDF text extraction and tests.
4. Integrate residual review with the verified operation plan and test original/copy identity, cancellation, accessibility and privacy boundaries. Any destructive content removal requires separate design and verification.
