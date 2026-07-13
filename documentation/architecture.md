# Architecture

zh-ChemVault is the Chinese public presentation of ChemVault knowledge records and product navigation. It builds static pages and a versioned public-record index from the shared English/Chinese public contract. It must not evolve into a separate identity, forms, billing, entitlement, or private-data backend.

Public chemistry data and translated copy are the only intended data. Account, Lab, Files, Mail, Forms, downloads, and administration deep-link to their canonical products. The generated index uses deterministic input-commit or `SOURCE_DATE_EPOCH` time.

Known risks: duplicated source data can drift from English; untranslated internal text/paths can leak; regional links may become stale. There is no runtime auth, private data, email, cron, or embedded automation. SEO is documented separately.

## Related documents

- [Flows](flows.md) · [Permissions](permissions.md) · [Variables](variables.md) · [Tests](tests.md) · [SEO](seo.md)
