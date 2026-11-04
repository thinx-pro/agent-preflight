# cite-cut

Give an agent bounded, line-numbered source excerpts instead of an entire file.

![Node 18+](https://img.shields.io/badge/node-18%2B-green) ![dependencies 0](https://img.shields.io/badge/dependencies-0-green) ![MIT](https://img.shields.io/badge/license-MIT-blue)

## Quick start

```sh
git clone https://github.com/thinx-pro/agent-preflight.git
cd agent-preflight/plugins/cite-cut/skills/cite-cut/tool
node bin/cite-cut.js examples/notes.md --query CUDA --context 1 --max-chars 900
```

Node 18+ is required. No install, API key or network access is used by the tool. The examples are synthetic fixtures, not measurements of real models.

### Actual output from the bundled example

```text
Source: notes.md
SHA256: 75625208c675202d6fe9e4225dbdfff5b0f5839b1633b8bd49843db013e93010
Literal matches: 1; this is an excerpt, not the complete source.

--- lines 2-4 ---
2: 
3: The demo engine now uses CUDA 13.
4: This example is fictional; check your driver before upgrading.


[End of excerpts; omitted text may contain important qualifications.]
```

## Why

A real Playwright user reported that wrapper nodes consumed the context budget in [issue #42077](https://github.com/microsoft/playwright/issues/42077). Browser tools have their own limits; this utility applies explicit bounds to local text from any source.

## Features and data contract

Literal, case-insensitive OR matching selects source lines. Neighbor windows merge. Only whole windows that fit are emitted, with original line numbers and a SHA-256 of the exact input. Omitted matches remain visible in JSON metadata.

Run `node bin/cite-cut.js --help` for flags. Add `--json` for structured output. Input files are read only; redirect output yourself if you want a saved report.

## Agent skill

Install from [agent-preflight](https://github.com/thinx-pro/agent-preflight):

```text
/plugin marketplace add thinx-pro/agent-preflight
/plugin install cite-cut@agent-preflight
```

The parent skill directory ships this tool together with its instructions. Agents that support SKILL.md can use it; automatic discovery varies by client. No plugin configuration is changed by these instructions.

## Alternatives

For semantic codebase retrieval consider [ContextSlice](https://github.com/llcortex/ContextSlice). cite-cut is a smaller literal text extractor with explicit line provenance, not a replacement for semantic retrieval.

## Validation

```sh
node --test
```

Tests use known-answer fixtures and negative controls. The Quick start above was run in a clean copy. macOS tested; Windows and Linux not exercised in this release.

## Limits and roadmap

No semantic search, tokenizer, summarization, or secret filtering. The budget measures JavaScript UTF-16 code units and includes Markdown metadata; the optional JSON wrapper is outside that budget. Oversized windows are omitted entirely. Read the original source when qualifications matter. Inputs are capped at 5 MB. Exit 1 means no excerpts were included; exit 2 means invalid input.

Future formats should be added only with real fixtures and failing tests. No performance or token-savings claims are made.

## License

MIT
