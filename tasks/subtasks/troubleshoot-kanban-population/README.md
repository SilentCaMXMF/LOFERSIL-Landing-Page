# Troubleshoot Kanban Population

Objective: Diagnose and resolve why the Kanban board is not populating despite successful issue creation in the kanban-sync-classic.yml workflow, ensuring the Project V2 board reflects all tasks from kanban_payload.json.

Status legend: [ ] todo, [~] in-progress, [x] done

Tasks

- [ ] DIAG-WF-01 — Verify GitHub workflow trigger for kanban_payload.json → `01-verify-workflow-trigger.md`
- [ ] DIAG-LOG-02 — Fetch latest Actions run logs for kanban-sync-classic.yml → `02-fetch-action-run-logs.md`
- [ ] DIAG-PJGV2-03 — Confirm the target GitHub Project V2 board exists → `03-confirm-target-project-v2.md`
- [ ] DIAG-STATUS-04 — Inspect the Status field on Project V2 → `04-inspect-status-field.md`
- [ ] DIAG-MUT-05 — Check the kanban script for GraphQL mutations → `05-check-graphql-mutations.md`
- [ ] DIAG-TOKEN-06 — Verify the workflow's GitHub token permissions → `06-verify-token-permissions.md`
- [ ] DIAG-DRY-07 — Create a small dry-run payload and test → `07-create-dry-run-test.md`
- [ ] DIAG-ERR-08 — Collect and categorize any errors from the run → `08-collect-errors.md`
- [ ] DIAG-DOC-09 — Document diagnostic findings and recommended steps → `09-document-findings.md`

Dependencies

- DIAG-WF-01 depends on DIAG-LOG-02 (workflow trigger must be verified before analyzing logs)
- DIAG-PJGV2-03 depends on DIAG-LOG-02 (project validation after log review)
- DIAG-STATUS-04 depends on DIAG-PJGV2-03 (status field inspection after project confirmation)
- DIAG-MUT-05 depends on DIAG-LOG-02 (mutation check after log analysis)
- DIAG-TOKEN-06 depends on DIAG-LOG-02 (token check after log review)
- DIAG-DRY-07 depends on DIAG-WF-01, DIAG-PJGV2-03, DIAG-STATUS-04, DIAG-MUT-05, DIAG-TOKEN-06 (dry-run after initial checks)
- DIAG-ERR-08 depends on DIAG-DRY-07 (error collection after test run)
- DIAG-DOC-09 depends on DIAG-ERR-08 (documentation after error analysis)

Exit criteria

- Root cause of empty Kanban board identified (e.g., missing GraphQL mutations, incorrect field IDs, insufficient permissions)
- Concrete fix implemented and tested (e.g., addProjectV2Item and updateProjectV2ItemFieldValue mutations added to workflow script)
- Kanban board successfully populates with at least one test task in the correct column
- Diagnostic process documented for future reference
