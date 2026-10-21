# GitHub Workflows & Automation

### Pipeline Overview
1. **[`dependabot.yml`](dependabot.yml)** scans Go modules and GitHub Actions on schedule and opens pull requests.
2. **[`ci.yml`](workflows/ci.yml)** compiles Go sources, runs unit tests, and reports status via `ci-gate`.
3. **[`dependabot-auto-merge.yml`](workflows/dependabot-auto-merge.yml)** approves and squash-merges passing, non-breaking PRs into `main`.

---

### [`ci.yml`](workflows/ci.yml)
- **Purpose**: Fast Go compilation and unit test validation without branch protection deadlocks.
- **Triggers**: Pull requests and pushes to `main`.
- **What is run**: Checks out repository; sets up Go 1.24; verifies modules (`go mod tidy`); builds packages (`go build -v ./...`); runs tests (`go test -v ./...`); aggregates status in `ci-gate`.
- **Expected outcomes**: `ci-gate` passes when tests succeed, satisfying branch protection requirements.

### [`dependabot-auto-merge.yml`](workflows/dependabot-auto-merge.yml)
- **Purpose**: Direct auto-merging of safe dependency updates on GitHub Free repositories (where native auto-merge is unavailable).
- **Triggers**: Successful `CI` completion on Dependabot PRs (`workflow_run`).
- **What is run**: Verifies updates are non-breaking; approves PR; executes direct squash-merge and deletes the branch.
- **Expected outcomes**: Safe minor/patch PRs merge automatically; major breaking bumps halt for human review.

### [`dependabot.yml`](dependabot.yml)
- **Purpose**: Scheduled updates across Go modules and GitHub Actions.
- **Triggers**: Weekly schedule.
- **What is run**: Scans `gomod` and `github-actions`.
- **Expected outcomes**: Dependencies update on a regular schedule with grouped pull requests.
