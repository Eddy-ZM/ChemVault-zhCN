# Permissions

| Operation | Public visitor | Contributor | Product/data owner |
| --- | --- | --- | --- |
| Read/search public content | Allow | Allow | Allow |
| Change translation/public data | Deny at runtime | Pull request | Review/approve shared contract |
| Account/private/admin operation | Redirect to canonical product | Deny | Canonical service only |

Repository review is the only privileged boundary. Public index generation uses an explicit allowlisted projection.
