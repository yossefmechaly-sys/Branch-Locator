# Branch Locator — customer review deployment

Deployment package for `/home/franck/branch-locator` and `branch-locator.service`.
Contains the tested source update and targeted deployment script.
No production environment files, installed dependencies or cloud build are included.

The script checks the archive baseline, uses the existing PostgreSQL backup
service, builds separately, validates a candidate, then switches only the
Branch Locator service. Previous code/builds are retained for rollback.

Extract the archive and run `python3 branch-locator-customer-reviews/deploy.py`
as user `franck` on the VPS. A successful deployment prints `DEPLOIEMENT_REUSSI`.

## Yellow review stars

`branch-locator-review-stars.tar.gz` updates only
`components/branches/BranchReviews.tsx` from the deployed customer reviews release.
Published ratings and distribution rows display yellow star icons, with translated
accessible labels retained. No database schema changes are included.

Extract it and run `python3 branch-locator-review-stars/deploy.py` as `franck`.
The same isolated build, health checks and rollback protections apply.
