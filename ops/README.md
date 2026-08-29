# Production fork operations

This fork keeps `release/v*` branches aligned with upstream and carries deployment-only changes on `production`.

## Branch model

- `release/vX.Y.Z`: clean upstream release branch mirror. Fast-forward it to the current upstream release head as upstream moves.
- `production`: deployable branch = a tested upstream release point + local commits not yet accepted upstream + intentionally custom behavior. Do not rebuild production for every upstream CI-only commit; update it deliberately before the next custom release.
- `fix/*`: short-lived, minimal branches used for upstream pull requests.

Generic fixes should be proposed upstream as focused PRs. Once merged upstream, rebase the next `production` release onto a clean upstream release branch and drop the now-redundant local commit.

## CI policy

This repository is public, so standard GitHub-hosted runner minutes are not charged against the private-repository Actions minute quota. Core verification workflows such as CI, Quality Gates, Semgrep, CodeQL and the manual Build App workflow may stay enabled.

Workflows with external side effects or unnecessary recurring load remain disabled in this fork unless explicitly needed: VPS deployment, npm/Docker publishing, Electron publishing and upstream nightly/maintenance automation. The custom release workflow is manual and never deploys automatically.

## Releases

`.github/workflows/build-custom-release.yml` builds `production` in GitHub Actions, runs focused regression tests, packages OmniRoute, runs a packaged browser smoke test, and publishes a checksum + schema-v2 manifest. It never deploys automatically.

`ops/omniroute-production-update` installs only a verified artifact/manifest pair, runs a canary, backs up SQLite databases, atomically switches `/opt/omniroute-current`, checks production health, and rolls back the package on failure.
