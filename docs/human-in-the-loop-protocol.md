# Human-in-the-loop protocol

## Authority levels

| Level | Meaning | Prototype behavior |
|---|---|---|
| H0 · Organize | Low-risk structure | May organize without approval |
| H1 · Prepare | Draft administrative action | Caregiver approves before external use |
| H2 · Confirm | Explicit confirmation | Cannot activate without named confirmation |
| H3 · Professional review | Qualified judgment | Workflow blocks and routes to qualified resolver |
| H4 · Urgent redirection | Configured urgent pathway | No diagnosis; redirect to configured human pathway |

The current synthetic case exercises H0 through H3. H4 is documented and tested as a policy boundary but is not presented as a production emergency service.

## Review actions

Users can review, correct, reject, reassign, pause, revoke permission, inspect uncertainty, view the source, and request human review. A correction preserves the original source and history.

## “I don’t know” sequence

1. Stop the affected workflow.
2. Name the unknown.
3. Cite the conflicting or missing source.
4. State what HEARTH cannot conclude.
5. Name the qualified resolver.
6. Prepare an escalation request if permitted.
7. Allow unaffected work to continue.

Protocol 9-Delta output is retained in `evidence/validation-results.json`.
