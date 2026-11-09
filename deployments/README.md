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

## Branch list ratings

`branch-locator-list-ratings.tar.gz` adds the average published rating and yellow
stars to each branch card. See [deployment instructions](list-ratings.md).

## Branch list photos

`branch-locator-list-photos.tar.gz` adds rounded main-photo thumbnails to branch
cards and includes the list ratings update. It accepts either of the preceding
review releases. See [deployment instructions](list-photos.md).

## Leader and Zol Uvegadol

`leader-zol-customer-experience.tar.gz` contains separately targeted updates for
Leader and Zol Uvegadol, retaining each site's branding and data bindings.
See [deployment instructions and validation](enseignes.md).
