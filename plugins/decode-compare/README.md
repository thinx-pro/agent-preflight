# decode-compare

Compare output lengths, generation times and token rates for two runs of the same prompt. [Usage and examples](skills/decode-compare/tool/README.md).

Install the skill in Claude Code, then give it paths to the baseline and candidate text files. It reads the reported measurements offline using Node 18 or later. The result shows how many additional tokens were generated and how the generation times differed. The included pair reproduces observations from a public single-prompt comparison.

```text
/plugin install decode-compare --marketplace thinx-pro/agent-preflight
```
