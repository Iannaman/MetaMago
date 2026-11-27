# Unified Workspace 3.4.0 — development stages

Status: stage 1 and PDF engine passed CI (45983397394); Office combined engine passed CI (45984394193); guided unified UI implemented, pending CI. Keep the internal version aligned to main (3.3.2) until the integrated 3.4.0 candidate is ready.

## Stage 1 — shared session adapter
- Derive the active document and unsaved draft status from existing Office and PDF sessions; no duplicate bytes or persisted session state.
- Explicit switching between the two supported open documents, with original properties and independent drafts.
- Track the most recently selected valid editor and fall back when a document closes; inspector return targets the actual open source file.
- Existing confirmation dialogs and read-only analysis remain unchanged. No automatic download.

## Stage 2 — operation plan
Initial PDF-only engine: validate standard metadata, publication and protection settings; reject overlap between edits and selected cleanup. Reuse verified engines in the order metadata → publication → protection, credentials separate from the plan, no intermediate downloads. Tests independently decrypt the output and check final metadata and watermark text. Office engine combines standard property edits, selected cleanup, final status and Mark in one verified OOXML rewrite. It rejects conflicting fields, invalid inputs and no-op plans, and returns residual privacy findings. Regression coverage for DOCX/XLSX/PPTX compares unchanged non-property parts and original bytes. UI now exposes an independent plan in the workspace; no intermediate downloads.

## Stage 3 — UI integration
The guided planner imports supported pending editor changes, offers field-level keep/edit/remove, PDF publication/protection and Office final/Mark controls, a review summary and explicit confirmation. Edits invalidate review; switching documents or views clears the plan and credentials. Existing drafts remain separate and unchanged. Unsupported pending PDF custom/Mark edits are refused rather than silently dropped. The summary is not a rendered preview; PDF page preview remains available in the legacy workspace. UI CI and manual acceptance pending.

## Stage 4 — acceptance
End-to-end tests for combined operations, cancellation, unchanged original hashes, verified outputs, invalid input, no remote processing, keyboard, mobile and both languages. Manual Office/PDF reader/managed Edge acceptance is still required. Monitor PWA migration test stability separately.

Existing flows remain available during migration. Stage 1 deliberately does not implement a combined document rewrite or a new file format.
