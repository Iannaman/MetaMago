# Unified Workspace 3.4.0 — development stages

Status: stage 1 implementation candidate, pending CI. This branch is not a complete 3.4.0 release; keep the version at 3.3.1 until the integrated candidate is ready.

## Stage 1 — shared session adapter
- Derive the active document and unsaved draft status from existing Office and PDF sessions; no duplicate bytes or persisted session state.
- Explicit switching between the two supported open documents, with original properties and independent drafts.
- Track the most recently selected valid editor and fall back when a document closes; inspector return targets the actual open source file.
- Existing confirmation dialogs and read-only analysis remain unchanged. No automatic download.

## Stage 2 — operation plan
Define format-specific operation schema, validate conflicts, preserve originals; implement metadata, selected cleanup, publication and protection as explicit ordered operations. Encryption runs last. Reuse verified engines; do not silently skip incompatible operations.

## Stage 3 — UI integration
Expose a single planned-operation summary, remove redundant source selection for the unified path, provide preview and explicit final confirmation. No intermediate downloads required by the unified path.

## Stage 4 — acceptance
End-to-end tests for combined operations, cancellation, unchanged original hashes, verified outputs, invalid input, no remote processing, keyboard, mobile and both languages. Manual Office/PDF reader/managed Edge acceptance is still required. Monitor PWA migration test stability separately.

Existing flows remain available during migration. Stage 1 deliberately does not implement a combined document rewrite or a new file format.
