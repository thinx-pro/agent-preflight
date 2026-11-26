# decode-compare

Compare two saved generation summaries and see when a higher token rate took longer to finish.

![Node 18+](https://img.shields.io/badge/node-18%2B-green) ![MIT](https://img.shields.io/badge/license-MIT-blue)

The example returns `"generationSecondsDelta": 24.8`, `"outputTokensDelta": 1133` and `"rateTimeReversal": true`.

## Why

One developer ran the same Python prompt on two local models. The runs generated 1,860 and 2,993 tokens at 22.3 and 27.6 tok/s respectively. The bundled example transcribes the three reported fields for each run. [Original observations](https://news.ycombinator.com/item?id=50635106)

## Quick start

```sh
git clone https://github.com/thinx-pro/agent-preflight.git
cd agent-preflight/plugins/decode-compare/skills/decode-compare/tool
node bin/decode-compare.js examples/baseline.txt examples/candidate.txt
```

## Compare your runs

Save one summary per UTF-8 file. Each summary needs one line each for Generation (positive seconds ending in s), Speed (positive tok/s), and Tokens (positive integer, optional thousands commas). See the example files for the exact labels. Other lines such as prompt speed are ignored. Repeated fields produce an error. Use the same task, prompt and settings for a meaningful comparison.

The command prints both observations and subtracts baseline from candidate. A positive time delta means the candidate spent longer generating. A reversal means the run with the higher reported token rate also had the longer reported generation time. A tie gives false. Exit 0 means a valid comparison, exit 2 signals a file or input error. Run tests with `node --test`.

## Limits and roadmap

Generation time excludes setup and prompt processing. Across tokenizers, token counts can differ even for identical text. Check output quality separately. The example is a third-party observation from one prompt. Additional runtime formats need recorded examples.

## License

MIT
