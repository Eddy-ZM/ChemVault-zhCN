# Verification Map

## Existing coverage

| Use case | Rule/negative case | Evidence/status |
| --- | --- | --- |
| Shared public contract | Chinese/English contract schema and stable empty collections agree | contract tests; CI required |
| Public site/data build | Static pages, sitemap and index generate | `npm test`, `npm run build` |
| Reproducibility | Tracked public index must remain unchanged after build | CI `git diff --exit-code` |

## Proposed tests

- Automated untranslated/internal-path/secret scan of generated HTML/JSON.
- Cross-repository byte/hash comparison for versioned contract files.
- Live canonical-link and Chinese metadata/sitemap validation.

## Gaps

- Translation quality and regional wording require human review.
- Cross-repository contract synchronization is copied rather than consumed from one package; CI should eventually fetch a signed/versioned artifact.
