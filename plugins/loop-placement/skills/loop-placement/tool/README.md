# loop-placement

Count device changes between consecutive decoder-layer executions when a block of layers repeats, and inspect startup memory buffers reported by llama.cpp, including compute and output reservations.

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
node bin/loop-placement.js --memory examples/buffers.txt
```

Read `total` for each plan. Run `npm test` to check the calculation against explicit execution traces.

## Model your own plan

Copy one example. Set one device name per physical layer in `devices`, ordered from layer zero. Set `start` to the first repeated layer and `end` to the first layer after the core (exclusive). Set `passes` to total traversals, including the first. For a single traversal use 1. Compare plans using the same range, layers and passes. Each successful run prints JSON and exits 0. Invalid input exits 2.

The calculation visits every adjacent physical layer once, weights boundaries inside the core by the pass count, and adds each cross-device return from the last core layer to the first.

## Read a startup log

Use `--buffers STARTUP.log` on a single llama.cpp startup. The command groups MiB records from `load_tensors` (model) and `llama_kv_cache` (KV) by backend. In the synthetic example Vulkan0 reports 640.5 MiB of model buffers and no KV line. Vulkan1 reports 512 MiB of model buffers and two KV records of 32 and 8 MiB. A reported zero appears as `[0]`; an empty array means no matching line. Separate entries preserve distinct cache allocations.

Both record kinds must appear somewhere in the input. Unsupported sizes on recognized allocation lines exit 2. The reader supports the plain and elapsed-time-prefixed formats exercised here. Filter to one startup yourself. Truncated logs and other logger formats may omit records. These rows cannot identify a layer, establish simultaneous residency or measure traffic. See the [mixed-GPU startup report](https://github.com/ggml-org/llama.cpp/issues/32785).

## Diagnose compute and output reservations

Use `--memory STARTUP.log` to add `computeMiB` and `outputMiB` arrays. The reader recognizes `llama_context` and `sched_reserve` reservation lines. It ignores teardown comparisons and failed allocation attempts. The example shows two compute reservations on Vulkan1 and reports output memory separately on CPU. Each array contains the logger's original numbers in order.

`--memory` accepts a partial startup log with at least one allocation record. Empty arrays show where the log has no matching lines. The tool keeps records separate because repeated reservations can overlap or replace one another. It does not calculate peak VRAM. Use `--buffers` for the original model/KV JSON schema and the requirement that both record kinds appear.

In [llama.cpp #33040](https://github.com/ggml-org/llama.cpp/issues/33040), a dual-GPU user's weight placement could fit while compute buffer allocation still failed. Earlier examples show the [llama_context](https://github.com/ggml-org/llama.cpp/issues/18181) and [sched_reserve](https://github.com/ggml-org/llama.cpp/discussions/20252) formats.

## Find jumps in a microbatch sweep

Run `node bin/loop-placement.js --sweep examples/rx6700s.json`. The seven observations from the [RX6700S report](https://github.com/ggml-org/llama.cpp/issues/32910#issuecomment-7216246777) yield a single interval, 31 to 32, with a rise from 2322 to 6672 (+4350 in the source table’s unspecified units). The example uses a threshold of 1000.

Copy the JSON and record one observation per microbatch. Hold the build, weights, device, remaining flags, workload, measurement phase and measurement method fixed. Use one metric and unit throughout. Keep total VRAM usage and compute-buffer reservations in separate series. Set `minimumRise` in that unit. The tool sorts by microbatch and reports every consecutive observed pair whose upward difference reaches the threshold. With gaps, `untestedBetween` counts unmeasured settings inside the interval. An empty list means no measured pair met the threshold. Exit 0 indicates a valid comparison, including one with rises. Invalid input exits 2.

The configuration label is supplied by the caller. The command cannot verify the setup, attribute the change to an allocator, or estimate throughput. Re-run the bracket on your own machine before choosing a setting.

## Limits and roadmap

This models one contiguous fixed-pass loop with whole-layer placement. Input and output heads, KV cache, expert offload and tensor parallelism are outside the model. Counts describe a proposed layout. Hardware traffic, fit, latency and output quality require measurement. Layer-level mapping still requires separate evidence.

## License

MIT. See LICENSE.
