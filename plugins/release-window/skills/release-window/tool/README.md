# release-window

Recover a dated release digest from archived GitHub JSON, without inventing historical trends.

![Node 18+](https://img.shields.io/badge/node-18%2B-green) ![dependencies 0](https://img.shields.io/badge/dependencies-0-green) ![MIT](https://img.shields.io/badge/license-MIT-blue)

## Quick start

```sh
git clone https://github.com/thinx-pro/agent-preflight.git
cd agent-preflight/plugins/release-window/skills/release-window/tool
node bin/release-window.js examples/releases.json --from 2026-11-02 --to 2026-11-02 --timezone Asia/Shanghai
```

Node 18+ is required. No install, API key or network access is used by the tool. The examples are synthetic fixtures, not measurements of real models.

### Actual output from the bundled example

```text
# Release window: 2026-11-02 to 2026-11-02

Timezone: Asia/Shanghai. 1 releases; 0 duplicates removed.

| Local date | Repository | Tag | Kind | Signals | Source |
|---|---|---|---|---|---|
| 2026-11-02 | example/engine | v1.0.0 | stable | fixes, features | [release](https://github.com/example/engine/releases/tag/v1.0.0) |

Archived publication dates, not historical popularity. Signals are keyword hints, not upgrade advice. Completeness depends on supplied records.
```

## Why

[Agent Zero 2.15](https://github.com/agent0ai/agent-zero/releases/tag/v2.15) was published late on November 1 UTC, which is November 2 in Shanghai. Backfilled newsletters and upgrade reports need publication-time boundaries, not guesses based on tag dates or today's star counts.

## Features and data contract

Reads release objects or arrays with published_at, html_url, tag_name and prerelease. Dates are inclusive in an IANA timezone. Canonical release URLs must match repository and tag. Identical duplicate records collapse; conflicting publication metadata fails. Compatibility/fixes/features labels are keyword hints only.

Run `node bin/release-window.js --help` for flags. Add `--json` for structured output. Input files are read only; redirect output yourself if you want a saved report.

## Agent skill

Install from [agent-preflight](https://github.com/thinx-pro/agent-preflight):

```text
/plugin marketplace add thinx-pro/agent-preflight
/plugin install release-window@agent-preflight
```

The parent skill directory ships this tool together with its instructions. Agents that support SKILL.md can use it; automatic discovery varies by client. No plugin configuration is changed by these instructions.

## Alternatives

GitHub Releases and dependency-update services remain better for live subscriptions. This tool is for reproducible, archived date-window reports.

## Validation

```sh
node --test
```

Tests use known-answer fixtures and negative controls. The Quick start above was run in a clean copy. macOS tested; Windows and Linux not exercised in this release.

## Limits and roadmap

Offline: does not fetch GitHub, discover every release, inspect installed dependencies, or recommend upgrades. Each file is capped at 10 MB. Drafts are ignored; prereleases need --include-prerelease. Invalid records fail the whole run rather than quietly disappearing. It does not reconstruct historical popularity. Exit 0 includes a valid empty window; exit 2 is invalid input.

Future formats should be added only with real fixtures and failing tests. No performance or token-savings claims are made.

## License

MIT
