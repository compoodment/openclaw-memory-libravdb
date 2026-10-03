import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { buildContextEngineFactory } from "../../src/context-engine.js";
import type { PluginRuntime } from "../../src/plugin-runtime.js";
import type { LibravDBClient } from "../../src/libravdb-client.js";

for (const change of ["runtime", "client"] as const) {
  test(`post-tool recall does not reuse another destination after changing ${change}`, async () => {
    const assemblies: string[] = [];
    function client(destination: string): LibravDBClient {
      return {
        async assembleContextInternal() {
          assemblies.push(destination);
          return { messages: [], estimatedTokens: 0, systemPromptAddition: `<memory_context>private ${destination} fact</memory_context>` };
        },
      } as unknown as LibravDBClient;
    }
    const firstClient = client("first");
    const secondClient = client("second");
    let activeClient = firstClient;
    function runtime(): PluginRuntime {
      return { getClient: async () => activeClient, onShutdown() {}, async shutdown() {}, async emitLifecycleHint() {} };
    }
    const firstRuntime = runtime();
    const cfg = { userId: "tester", beforeTurnEnabled: false };
    const logger = { info() {}, warn() {}, error() {} };
    const first = buildContextEngineFactory(firstRuntime, cfg, logger);
    const next = buildContextEngineFactory(change === "runtime" ? runtime() : firstRuntime, cfg, logger);
    const user = { role: "user", id: "same-user-turn", content: "look up the current fact" };
    const args = { sessionId: randomUUID(), messages: [user], tokenBudget: 4000 };
    const continuationArgs = { ...args, messages: [user,
      { role: "assistant", content: [{ type: "toolCall", id: "lookup", name: "lookup", arguments: {} }] },
      { role: "toolResult", toolCallId: "lookup", content: "lookup finished" },
    ] };
    try {
      assert.match((await first.assemble(args)).systemPromptAddition, /private first fact/);
      activeClient = secondClient;
      const continuation = await next.assemble(continuationArgs);
      assert.deepEqual(assemblies, ["first", "second"], "a different daemon client must assemble its own context");
      assert.match(continuation.systemPromptAddition, /private second fact/);
      assert.doesNotMatch(continuation.systemPromptAddition, /private first fact/);
      await next.assemble(continuationArgs);
      assert.deepEqual(assemblies, ["first", "second"], "same-client continuations still reuse recall");
    } finally { await first.dispose(); await next.dispose(); }
  });
}
