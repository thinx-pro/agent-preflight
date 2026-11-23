# loop-placement

Count device changes between consecutive decoder-layer executions when a block of layers repeats.

![Node 18+](https://img.shields.io/badge/node-18%2B-green) ![MIT](https://img.shields.io/badge/license-MIT-blue)

| Example plan | Outside the core, including entry and exit | Within each pass × passes | Between passes | Total |
|---|---:|---:|---:|---:|
| Even split | 0 | 1 × 3 | 2 | 5 |
| Core on B, prefix and suffix on A | 2 | 0 × 3 | 0 | 2 |

## Why

A split inside a repeated core is traversed multiple times. A return to the start of that core can add another device change. A user described this placement problem on a mixed Arc and RTX system in [llama.cpp discussion 32781](https://github.com/ggml-org/llama.cpp/discussions/32781).

## Quick start

From this directory with Node 18+, compare the two synthetic plans:

```sh
node bin/loop-placement.js examples/split.json
node bin/loop-placement.js examples/colocated.json
```

Read `total` for each plan. Run `npm test` to check the calculation against explicit execution traces.

## Model your own plan

Copy one example. Set one device name per physical layer in `devices`, ordered from layer zero. Set `start` to the first repeated layer and `end` to the first layer after the core (exclusive). Set `passes` to total traversals, including the first. For a single traversal use 1. Compare plans using the same range, layers and passes. Each successful run prints JSON and exits 0. Invalid input exits 2.

The calculation visits every adjacent physical layer once, weights boundaries inside the core by the pass count, and adds each cross-device return from the last core layer to the first.

## Limits and roadmap

This models one contiguous fixed-pass loop with whole-layer placement. Input and output heads, KV cache, expert offload and tensor parallelism are outside the model. Counts describe a proposed layout. Hardware traffic, fit, latency and output quality require measurement. An engine placement-log importer would remove the manual mapping step.

## License

MIT. See LICENSE.
