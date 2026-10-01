# Continue the upstream audit locally

The user authorized auditing https://github.com/xDarkicex/openclaw-memory-libravdb, creating issues and pull requests, and continuing the audit. The destination is **xDarkicex/openclaw-memory-libravdb**. This branch is only a transfer location in the user's fork; it is not a submission destination.

## What is ready

- **29 reviewed fix branches**, already pushed to compoodment/openclaw-memory-libravdb.
- **29 complete PR drafts** in upstream-submissions.json, with titles, bodies, exact source branch names and recorded head SHAs.
- **35 candidate issue reports**, mapped to the prepared submissions. Several fixes combine multiple findings; do not generate additional PRs from every issue candidate.
- One unresolved issue-only finding in cross-tenant-path-issue.md.
- Historical combined validation: 325 unit + 63 integration tests passed, no failures or skips. Build, typecheck, package dry run and diff check passed; the plugin inspector reported no breakages and one existing dependency-install proof gap.

No upstream submissions were created by the cloud audit. All mistakenly posted fork PRs #1-30 are closed. PR #16 (separate Markdown fences) was consolidated into #8 (empty-markdown plus fence handling and snapshot migration).

The cloud executor became unavailable and the user could not download the ZIP. This replacement handoff recovered the actual PR drafts and branch metadata from GitHub, plus candidate issue titles and the outstanding report retained by auditing agents. It does not include original raw logs or every original issue body's exact wording. Use the included PR evidence and committed regression tests to prepare precise issue bodies.

## Pick up the work

Clone this branch to a new local folder:

```
git clone --branch codex/upstream-handoff-20261001 https://github.com/compoodment/openclaw-memory-libravdb.git openclaw-audit
```

All prepared fix branches are fetched as origin remote-tracking branches. The handoff branch itself is based on the audited upstream baseline, not the combined fixes. Inspect each fix separately. A checkout of the combined review commit is not guaranteed to be available from GitHub; its SHA is historical validation provenance.

1. Check local authentication with `gh auth status --hostname github.com`. Use the actual local GitHub CLI login, not the cloud proxy credentials. If login is needed, have the user complete `gh auth login --hostname github.com --git-protocol https --web`. Do not ask them to paste tokens into chat.
2. Refresh upstream main and list/search existing upstream issues and PRs, including closed reports. The audited baseline is c3570e1f30f1db43be5434a5ca57f936e198a3e3 (v1.10.25). Check whether each finding still exists and whether someone already submitted its fix.
3. Verify the current branch head for each submission against its recorded head_sha, review its diff and regression test, and inspect conflicts if upstream has advanced.
4. Create or reuse appropriate upstream issues from issue_candidates. Narrow grouped PR evidence to each issue; use actual upstream issue URLs in the corresponding PR body. The cross-tenant exact-read path issue has no prepared fix.
5. Create the 29 PRs sequentially, always using `--repo xDarkicex/openclaw-memory-libravdb --base main --head compoodment:codex/fix-...`. Use the manifest titles and bodies, adding accurate issue references. Write bodies to UTF-8 files and use `--body-file`; do not interpolate Markdown into shell commands. Make normal open PRs once reviewed, or draft them if a material validation concern remains and explain that concern.
6. Before each creation, check upstream for an existing PR from that exact head. Keep a resumable publication ledger with every successful issue/PR URL. Preserve progress on a permission failure; do not blindly repeat the batch.
7. Attach each newly created upstream PR to the local Codex chat with codex_app__attach_artifact. Report actual publication URLs and validation limits, then continue the authorized audit.

A normal local GitHub user login can usually create public-repository issues and fork PRs without upstream write permission, subject to repository policies. Installing the GitHub App on upstream was only relevant to the cloud connector route.

## Important behavior constraints

- All fix heads were independently based on c3570e1; they do not require publication ordering. Same-file merges may need rebasing.
- compactSessionTokenBudget=0 disables implicit predictive compaction unless a positive explicit compactThreshold overrides it. Manual/host compaction remains available.
- Durable turn ACK fixes preserve acknowledged prefixes and persist recoveryPending. Failed recovery must remain retryable, including unconfirmed messages before the prePrompt boundary. Missing-ID retries use stable, separate advancement and recovery identity namespaces.
- Cross-tenant search ranking/limits/error propagation does **not** repair the unresolved downstream exact-read provenance ambiguity.
- Markdown empty-file retirement and fence handling share a version-3 to version-4 ingestion snapshot migration; keep them together.
- Recorded suite results describe the combined cloud review, not fresh local runs or identical checks on every independent branch.
- Do not merge, release, deploy or delete branches as part of this publication handoff.
