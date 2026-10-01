# bug: cross-tenant recall hits share paths and memory_get reads the wrong record

At upstream c3570e1f30f1db43be5434a5ca57f936e198a3e3 (v1.10.25), the client preserves colliding IDs during cross-tenant search, but the memory runtime gives those hits identical exact-read paths. Its text cache overwrites the first record with the second, so reading the selected first search hit returns the second hit's text.

This affects records within explicitly configured tenant read access. It is incorrect record association, not evidence of unauthorized tenant disclosure.

## Affected code

- src/libravdb-client.ts: searchTextCollections() deduplicates by tenant plus record ID but does not add source tenant to the returned record.
- src/memory-runtime.ts: structured search paths and returnedSearchPaths use only collection plus record ID; readFile() uses the overwritten text cache.
- src/memory-runtime.ts: mergeSearchResults() deduplicates dream and normal hits by bare record ID, potentially discarding distinct tenant results.
- src/tools/memory-recall.ts: graph expansion accepts record ID without the originating tenant.

## Deterministic reproduction

Use the compiled runtime module and adjust the import path to its emitted location. This audit ran an equivalent fixture through compiled test modules; this is not a claim that the production bundle exports internal helpers.

```js
import assert from "node:assert/strict";
import { buildMemoryRuntimeBridge } from "./dist/memory-runtime.js";

const metadataJson = new TextEncoder().encode(
  JSON.stringify({ collection: "user:u1" }),
);
const client = {
  status: async () => ({ ok: true }),
  searchTextCollections: async () => ({
    results: [
      { id: "shared-id", text: "tenant A record", score: 0.9, metadataJson },
      { id: "shared-id", text: "tenant B record", score: 0.8, metadataJson },
    ],
  }),
};
const { manager } = await buildMemoryRuntimeBridge(
  async () => client,
  { userId: "u1" },
).getMemorySearchManager();
const results = await manager.search({ query: "recall" });
const exactRead = await manager.readFile({ relPath: results[0].path });
assert.equal(results.length, 2);
assert.equal(results[0].path, results[1].path);
assert.notEqual(exactRead.text, results[0].snippet);
console.log({
  snippets: results.map(result => result.snippet),
  paths: results.map(result => result.path),
  firstPathRead: exactRead.text,
});
```

Observed output during the audit:

```json
{
  "snippets": ["tenant A record", "tenant B record"],
  "paths": ["user%3Au1::shared-id", "user%3Au1::shared-id"],
  "firstPathRead": "tenant B record"
}
```

Expected: each hit retains sufficient provenance for an unambiguous exact read and subsequent graph expansion. Deduplication should consistently distinguish tenant, collection, and record ID.

This uses deterministic client responses, not a live multi-tenant daemon reproduction.

## Fix status and related reports

Issue-only: no fix is included. Opaque cache handles could repair immediate reads, but graph expansion also requires tenant-bound routing. A complete fix should retain tenant provenance and use tenant-bound request routing.

Upstream #364 addresses preserving colliding IDs during client fan-out. Upstream #369 addresses concurrent tenant routing mutation. The prepared cross-tenant-search submission fixes ranking, limits, and total-failure propagation; it does not fix this downstream path collision.
