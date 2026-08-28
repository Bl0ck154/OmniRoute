# Production fork operations

This fork keeps `release/v*` branches aligned with upstream and carries deployment-only changes on `production`.

## Branch model

- `release/vX.Y.Z`: clean upstream release branch mirror.
- `production`: deployable branch = upstream release + local commits not yet accepted upstream + intentionally private/custom behavior.
- `fix/*`: short-lived, minimal branches used for upstream pull requests.

Generic fixes should be proposed upstream as focused PRs. Once merged upstream, rebase `production` onto the next clean upstream branch and drop the now-redundant local commit.

## Releases

`.github/workflows/build-custom-release.yml` builds `production` in GitHub Actions, runs focused regression tests, packages OmniRoute, runs a packaged browser smoke test, and publishes a checksum + schema-v2 manifest. It never deploys automatically.

`ops/omniroute-production-update` installs only a verified artifact/manifest pair, runs a canary, backs up SQLite databases, atomically switches `/opt/omniroute-current`, checks production health, and rolls back the package on failure.
