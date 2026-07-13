# Runtime Variables

| Name | Scope/source | Use/failure |
| --- | --- | --- |
| `CHEMVAULT_SITE_ORIGIN` | Public build config | Canonical Chinese URLs |
| `SOURCE_DATE_EPOCH` | Reproducible-build input | Optional deterministic timestamp; must be valid Unix seconds |
| Public product origins | Versioned copy/config | Canonical deep links; stale value misroutes users |

No runtime secret is required. Build/deploy credentials remain CI-only and must never enter static output. Pre-go-live verifies contract equality, public-only index, canonical Lab links, translation review, sitemap, and deterministic regeneration.
