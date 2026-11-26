# MetaMago 3.2.0 — Experience Edition: acceptance checklist

Candidate until all applicable CI jobs and manual acceptance tests have passed.

## Automated gates

- Windows PowerShell integration and portable build.
- Complete existing Chromium regression suite, including PDF rendering and independent QPDF verification.
- Chromium, Firefox and WebKit compatibility matrix.
- Smart Interface, Motion, Smart Detection, Quick Actions, Guided Experience and Design System regression tests.
- End-to-end mixed Office/PDF privacy preset: select documents, preview, refuse confirmation, generate ZIP, verify output metadata and unchanged SHA-256 of original inputs.
- Deterministic generated HTML and minimal Pages build.

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
