# eval-pairs

See which evaluation cases regressed, even when the average score stayed the same.

![Node 18+](https://img.shields.io/badge/node-18%2B-green) ![dependencies 0](https://img.shields.io/badge/dependencies-0-green) ![MIT](https://img.shields.io/badge/license-MIT-blue)

## Quick start

```sh
git clone https://github.com/thinx-pro/agent-preflight.git
cd agent-preflight/plugins/eval-pairs/skills/eval-pairs/tool
node bin/eval-pairs.js examples/before.jsonl examples/after.jsonl
```

Node 18+ is required. No install, API key or network access is used by the tool. The examples are synthetic fixtures, not measurements of real models.

### Actual output from the bundled example

```text
# Paired evaluation

2 paired; 1 improved; 1 regressed; 0 unchanged.

Direction: higher; epsilon: 0. Matched means: 0.5 → 0.5.

| Case | Before | After | Delta | Outcome |
|---|---:|---:|---:|---|
| quote-source | 0 | 1 | 1 | improved |
| tool-json | 1 | 0 | -1 | regressed |

Missing in candidate: none

New in candidate: none

Descriptive paired comparison only; not a significance test. Means use matched cases only. Missing cases are not counted as zero.
```

## Why

[MLflow 3.18.0](https://github.com/mlflow/mlflow/releases/tag/v3.18.0) emphasizes finding regressions hidden behind aggregate scores. Small local experiments also need case alignment without operating a tracking server.

## Features and data contract

Each JSONL row contains a unique nonempty string id and a finite numeric score. Use --metric latency to choose a different flat numeric field, --direction lower for latency or cost, and --epsilon for the tolerated absolute difference. Missing cases are reported separately. Means include only matched cases.

Run `node bin/eval-pairs.js --help` for flags. Add `--json` for structured output. Input files are read only; redirect output yourself if you want a saved report.

## Agent skill

Install from [agent-preflight](https://github.com/thinx-pro/agent-preflight):

```text
/plugin marketplace add thinx-pro/agent-preflight
/plugin install eval-pairs@agent-preflight
```

The parent skill directory ships this tool together with its instructions. Agents that support SKILL.md can use it; automatic discovery varies by client. No plugin configuration is changed by these instructions.

## Alternatives

Use MLflow for experiment storage and tracing. This is a narrow file comparison tool, not a replacement for an evaluation platform.

## Validation

```sh
node --test
```

Tests use known-answer fixtures and negative controls. The Quick start above was run in a clean copy. macOS tested; Windows and Linux not exercised in this release.

## Limits and roadmap

Descriptive only: no statistical significance, confidence intervals, model calls, grading, framework-specific import, or assumption that one run is representative. Supply multiple trials yourself if needed. Duplicate IDs, non-numeric scores and malformed JSON are rejected. Files are capped at 10 MB. Exit 1 means any regression, any missing case on either side, or zero paired cases; exit 2 is invalid input.

Future formats should be added only with real fixtures and failing tests. No performance or token-savings claims are made.

## License

MIT
