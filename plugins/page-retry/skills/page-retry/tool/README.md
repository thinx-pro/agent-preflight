# page-retry

Find the pages where a table export lost, changed or repeated a pinned row.

![Node 18+](https://img.shields.io/badge/node-18%2B-green) ![MIT](https://img.shields.io/badge/license-MIT-blue)

The synthetic two-page example changes USD to EUR on page 2. The result includes `"reviewPages": [2]`.

## Why

Multi-pass document parsing can improve results at extra compute cost. Use a few independently transcribed rows to decide which pages of a saved export need another look. [NVIDIA's parse training and evaluation report](https://huggingface.co/blog/nvidia/building-on-nemotron-35-parse-open-data-fine-tunin)

## Quick start

```sh
git clone https://github.com/thinx-pro/agent-preflight.git
cd agent-preflight/plugins/page-retry/skills/page-retry/tool
node bin/page-retry.js examples/plan.json examples/changed.txt
```

Use examples/clean.txt as the passing control. Run `node --test` for unit tests.

## Input and results

Read the original and enter its physical page count and reference rows in the example JSON format. Choose lines that should occur exactly once on their page. Include the label, value and unit as printed. Supply UTF-8 text with form feed between pages, such as the output of `pdftotext -layout input.pdf output.txt`. A final form feed terminates the last page. Preserve blank pages.

Each reference matches a whole line after trimming and collapsing spaces and tabs. Case, punctuation and numeric formatting matter. The JSON gives one-based reference and physical page numbers, match counts and sorted review pages. Exit 0 means every pinned row and the total page count matched. Exit 1 means review findings or a page-count mismatch. If the counts differ, inspect pagination before rerunning any pages. Exit 2 means invalid input.

## Limits and roadmap

Only annotated lines are checked. Text order and line wrapping affect matching. Matching text cannot verify crop coordinates or column alignment. This version takes one export at a time. A future layout-aware mode would need independently annotated bounding boxes.

## License

MIT
