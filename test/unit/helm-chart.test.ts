import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

const helm = process.env.HELM_BINARY || "helm";
const helmAvailable = spawnSync(helm, ["version", "--short"]).status === 0;
const chart = path.join(process.cwd(), "deploy", "helm", "libravdbd");

function render(...args: string[]): string {
  const result = spawnSync(helm, ["template", "audit", chart, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

test("Helm persistence disabled uses ephemeral data storage without referencing a missing PVC", {
  skip: !helmAvailable && "Helm is required to render the chart",
}, () => {
  const rendered = render("--set", "persistence.enabled=false");
  assert.doesNotMatch(rendered, /kind: PersistentVolumeClaim/);
  assert.doesNotMatch(rendered, /persistentVolumeClaim:/);
  assert.match(rendered, /- name: data\n\s+emptyDir: \{\}/);
  assert.match(rendered, /- name: data\n\s+mountPath: \/var\/lib\/libravdbd\/data/);
});

test("Helm default persistence creates and mounts the data claim", {
  skip: !helmAvailable && "Helm is required to render the chart",
}, () => {
  const rendered = render();
  assert.match(rendered, /kind: PersistentVolumeClaim\nmetadata:\n\s+name: audit-data/);
  assert.match(rendered, /- name: data\n\s+persistentVolumeClaim:\n\s+claimName: audit-data/);
  assert.doesNotMatch(rendered, /emptyDir:/);
});
