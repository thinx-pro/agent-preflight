# agent-preflight

**16 skills that check the things your coding agent won't check for itself:** API keys sitting in its session logs, what it could delete from this shell, what a plugin can do before you install it, what your sessions really cost, tests that pass without your fix, processes it left running overnight.

Install once in Claude Code, then just ask: *"did my agent log any of my API keys?"*

![skills 16](https://img.shields.io/badge/skills-16-3f8f5a) ![offline](https://img.shields.io/badge/runs-offline-3f8f5a) ![zero dependencies](https://img.shields.io/badge/dependencies-0-3f8f5a) ![license MIT](https://img.shields.io/badge/license-MIT-blue)

![trace-scrub finding leaked keys in agent session logs](assets/trace-scrub.png)

<sub>The `trace-scrub` skill on a demo home folder with fake tokens. Values are never printed; **LIVE** marks keys still configured on the machine.</sub>

## Install

In Claude Code:

```
/plugin marketplace add thinx-pro/agent-preflight
/plugin install all@agent-preflight
```

Restart Claude Code, then ask in plain words (see the table). To install only some of them, use the plugin name instead of `all`, e.g. `/plugin install trace-scrub@agent-preflight`.

From a terminal, the same thing is `claude plugin marketplace add thinx-pro/agent-preflight` and `claude plugin install all@agent-preflight`.

## The skills

| Ask Claude… | Skill (plugin) | What it does |
|---|---|---|
| **Secrets & access** | | |
| "Did my agent log any of my API keys?" | `trace-scrub` | Finds keys and tokens in Claude Code, Codex, Gemini CLI, OpenCode, Cline/Roo and Aider session logs; redacts them in place if you say yes |
| "Where are my OpenAI / Anthropic keys stored?" | `ai-key-map` | Every copy of every AI provider key on the machine, grouped by fingerprint, plus a rotation checklist |
| "What could the agent delete if I leave it running?" | `blast-check` (blastmap) | Permission modes, logged-in cloud/kube CLIs, token scopes, publish tokens, SSH keys, Docker socket, mounted shares, then the smallest fixes |
| "Is this plugin safe to install?" | `mod-audit` | Static map of what a Claude Code plugin hooks, runs, reads, writes and contacts; lockfile + upgrade diff |
| "Does this page hide instructions for AI?" | `cloak-diff` | Text people can't see but agents read (hidden prompt injection), crawler-only content |
| "What did the agent send out this week?" | `outbound-check` (agent-trail) | Form posts, pushes, publishes and messages from your transcripts; asks before government, bank or health sites |
| **Cost** | | |
| "Would Haiku have been cheaper for my sessions?" | `cost-cliff` | Replays your own sessions on other models' prices, including long-prompt tiers |
| "Where did my tokens go?" | `token-blame` | Main thread vs each subagent type, inherited expensive models, cache rebuilds and why |
| "I'm leaving this running overnight." | `overnight-preflight` (nightcap) | Pinned tiers, a hard dollar cap and a morning report for paid tools and side effects |
| "What agent processes are still running?" | `agent-ps` | Sessions, daemons, runaway test loops, secret env var names held, old versions eating disk |
| **Verification** | | |
| "Does my new test actually test the fix?" | `fail-first` | Runs changed tests on the code before and after; flags tests that pass without the fix |
| "Would my hooks stop the agent from gaming the tests?" | `cheat-drill` | Scores your hooks against 39 known cheat moves and 15 legitimate controls |
| "Is the Rust port equivalent to the old one?" | `port-verify` (port-diff) | Runs old and new on the same inputs, normalizes noise, grades BREAK / DIFF / SAME |
| "Walk through this README like a new user." | `readme-walk` | Follows the README literally in a clean copy and writes a friction log |
| **Models** | | |
| "Does my local model do tool calls properly?" | `toolcall-smoke` | 20 tool-calling cases against Ollama, llama.cpp, LM Studio, vLLM or any OpenAI-compatible server |
| "Do we use DeepSeek anywhere?" | `model-census` | Model ids, endpoints and SDKs in a codebase, mapped to whose weights they're built on; CI deny gate, CycloneDX |

## How it works

- **Each skill carries its own tool.** The scanner code sits next to the `SKILL.md` and runs with the `node` or `python3` you already have. No `npm install`, no packages, nothing downloaded at run time.
- **Offline and read-only by default.** Nothing is sent anywhere. Changes (redacting a log, killing a process, installing a hook) happen only after you say yes; the skills tell Claude to ask.
- **Secret values are never printed.** Keys show as a masked prefix plus a fingerprint, so copies can be matched without revealing them.
- **No hooks are installed by the plugin.** Two skills (`outbound-check`, `overnight-preflight`) can print a hook snippet for you to add if you want enforcement.
- About 1.6K tokens are added to every session for the 16 skill descriptions (measured with `claude plugin details`); a skill's full instructions load only when it is used.

Requirements: Claude Code, Node 18+ (12 skills), Python 3.8+ (`agent-ps`, `cheat-drill`, `port-verify`, `readme-walk`). macOS and Linux; Windows is untested.

## Without Claude Code

Every skill folder (`plugins/<name>/skills/<skill>/`) is a self-contained `SKILL.md` + tool, so agents that read SKILL.md folders should be able to use it; this has only been tested with Claude Code. The tools also run directly, e.g.:

```bash
git clone https://github.com/thinx-pro/agent-preflight
node agent-preflight/plugins/trace-scrub/skills/trace-scrub/tool/bin/trace-scrub.js --help
```

Each tool also has its own repository with full docs: [trace-scrub](https://github.com/thinx-pro/trace-scrub), [ai-key-map](https://github.com/thinx-pro/ai-key-map), [blastmap](https://github.com/thinx-pro/blastmap), [mod-audit](https://github.com/thinx-pro/mod-audit), [cloak-diff](https://github.com/thinx-pro/cloak-diff), [agent-trail](https://github.com/thinx-pro/agent-trail), [cost-cliff](https://github.com/thinx-pro/cost-cliff), [token-blame](https://github.com/thinx-pro/token-blame), [nightcap](https://github.com/thinx-pro/nightcap), [agent-ps](https://github.com/thinx-pro/agent-ps), [fail-first](https://github.com/thinx-pro/fail-first), [cheat-drill](https://github.com/thinx-pro/cheat-drill), [port-diff](https://github.com/thinx-pro/port-diff), [readme-walk](https://github.com/thinx-pro/readme-walk), [toolcall-smoke](https://github.com/thinx-pro/toolcall-smoke), [model-census](https://github.com/thinx-pro/model-census).

Browser tools from the same author: [trust-threshold](https://thinx-pro.github.io/trust-threshold/) (confidence thresholds for model routing), [agent-search-costs](https://thinx-pro.github.io/agent-search-costs/) (search API price calculator).

## Testing

```bash
node test/smoke.mjs
```

Runs every bundled tool on a small fixture with a known answer (a planted fake token, a hidden instruction, a real regression test, …) plus five negative controls that must *not* be flagged. Pass a path to test an installed copy, e.g. the plugin cache folder.

## Limits

- These are young tools with no user base yet. Expect rough edges and please open an issue when one is wrong.
- Pattern-based scanners miss secrets in formats they don't know, and can flag look-alikes.
- Prices in `cost-cliff` / `token-blame` are list prices from a dated table in each tool; subscription plans bill differently.
- Not a security guarantee: `blast-check` and `mod-audit` show what *can* happen, not what will.

## License

MIT
