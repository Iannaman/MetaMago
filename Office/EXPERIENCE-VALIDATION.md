# MetaMago 3.3.1 — Stability & Quality Edition: acceptance checklist

Candidate until all applicable CI jobs and manual acceptance tests have passed.

## Automated gates

- Windows PowerShell integration and portable build.
- Complete existing Chromium regression suite, including PDF rendering and independent QPDF verification.
- Chromium, Firefox and WebKit compatibility matrix.
- Smart Interface, Motion, Smart Detection, Quick Actions, Guided Experience and Design System regression tests.
- End-to-end mixed Office/PDF privacy preset: select documents, preview, refuse confirmation, generate ZIP, verify output metadata and unchanged SHA-256 of original inputs; cancellation during real ZIP generation must not produce a download.
- Deterministic generated HTML and minimal Pages build.
- Workflow preliminary privacy check preserved on save/load and configuration roundtrip; legacy recipes without the field still load, malformed values are rejected and passwords are excluded.

- Visual UX: home disclosure, illustrations, document workspace, planned/verified comparison, isolated synthetic tutorial, single-page local raster and publication preview.
- Render a known coloured rectangle and verify pixel output on Chromium, Firefox and WebKit; verify direct single-file Office/PDF downloads separately from ZIP.

## Usability study protocol (not yet executed)

Recruit at least five novice or occasional users and five experienced users; use synthetic documents and counterbalance the order of 3.2.0 and 3.3.0. Give a task goal, not navigation instructions. Record success without help, elapsed time excluding processing, errors, unnecessary steps, whether the original was understood to remain unchanged, and the System Usability Scale (SUS) after each version. Record exclusions and failures rather than silently discarding them.

| Task | Design target (not a measured result) |
|---|---|
| Change Word author | 45 seconds |
| Identify personal metadata | 30 seconds |
| Configure PDF protection | 90 seconds |
| Clean 10 files | 120 seconds excluding processing |
| Recover from unsupported PDF | Without external assistance |
| Understand that original stays unchanged | 100% |
| Complete tasks without help | At least 90% |
| SUS | At least 85/100 |

## Manual acceptance (use synthetic documents only)

| Area | Acceptance |
|---|---|
| First use | New user can select a file and explain the next action without instruction. |
| Office | Open verified copies in Microsoft Word, Excel and PowerPoint; compare layout, formulas, animations and content. |
| PDF | Verify pages, watermark, restrictions and supported metadata in a PDF reader. |
| Error handling | Malformed, encrypted, signed and unsupported PDFs show a readable message and do not silently rewrite. |
| Accessibility | Keyboard-only navigation, visible focus, screen reader, reduced motion and high contrast. |
| Mobile | Android and iOS real-device layout and downloads. |
| Enterprise | Managed Edge, relevant policies and permitted PWA installation. |
| Performance | Test 20 mixed-size files within limits; observe memory and responsiveness, including cancellation. |
| Production | Deploy workflow passes; test version, PWA update, and download on published origin. |

## Boundaries

Metadata cleanup does not anonymise all text, images, comments, macros, or embedded objects. Inspection does not certify authenticity, legal compliance or absence of sensitive data. Automatic tests are not a substitute for real Office or accessibility acceptance. No document is automatically rewritten or downloaded by a preset.
