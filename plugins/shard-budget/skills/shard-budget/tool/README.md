# shard-budget

Count the on-disk bytes of indexed Hugging Face weight shards before downloading them.

![Node 18+](https://img.shields.io/badge/node-18%2B-green) ![license MIT](https://img.shields.io/badge/license-MIT-blue)

```text
Hy4-flash · 1,964 tensors · 148 unique shards · 440,521,065,214 bytes
```

## Why

A model's active parameter count cannot tell you how much disk space its files need. Several tensors can live in one shard, and a repository can contain other files. The example above uses the root weight index at [this Hy4-flash revision](https://huggingface.co/tencent/Hy4-flash/tree/b2498eba6a1a3f9bbcab4190bc1313a3c7010c2f).

## Quick start

From this tool directory with Node 18 or later, run the included synthetic example.

```sh
node bin/shard-budget.js examples/info.json examples/index.json --budget-bytes 1024
node bin/shard-budget.js examples/info.json examples/index.json --budget-bytes 1023
```

The first command reports two shards and zero shortfall. The second reports one byte short and exits 1. Run the tests with `npm test`.

## Use your own model

Save the Hub response from `https://huggingface.co/api/models/OWNER/MODEL?blobs=true`. Use its exact `sha` to download `https://huggingface.co/OWNER/MODEL/resolve/SHA/model.safetensors.index.json`. Preserve the original bytes. Pass the two saved paths to the command above. Omit the budget to print totals alone.

The tool verifies the Git blob ID and length of the supplied index against the saved manifest. It sums each referenced shard's listed size once. Invalid inputs, missing sizes and unknown shards produce exit 2. The CLI reads two local files and makes no network requests.

## Limits and roadmap

The total covers the root index's referenced files on a fresh download. Budget extra space separately for tokenizer files, auxiliary tables outside that index, caches and temporary files. RAM, VRAM and inference performance need runtime measurements. Subdirectory indexes and cached partial downloads are outside the current scope.

## License

MIT. See LICENSE.
