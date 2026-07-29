# Burden-study data dictionary

Schema identifier: `hearth-burden-study/v1`

| Field | Type | Definition |
|---|---|---|
| `schema` | string | Export schema identifier |
| `condition` | enum | `manual` or `hearth` |
| `startedAt` / `finishedAt` | timestamp | Anonymous session boundaries |
| `totalSeconds` | integer | Elapsed time including setup, review, corrections, approval, and error recovery |
| `tasks` | array | Eight task records with completion and elapsed seconds |
| `interactions` | integer | Count of recorded interface or manual-workflow actions |
| `helpRequests` | integer | Count of facilitator or instruction help requests |
| `corrections` | integer | Count of participant revisions after an error or uncertainty |
| `completionStatus` | enum | Complete or incomplete at session end |
| `missedResponsibilities` | integer | Required responsibilities not identified |
| `incorrectResponsibilities` | integer | Unsupported responsibilities added |
| `confidence` | integer 1-5 | Participant-rated confidence after the condition |
| `effort` | integer 1-5 | Participant-rated effort after the condition |
| `feedback` | string | Optional de-identified qualitative feedback |

The prototype does not prefill identity, participant results, or outcome values and does not transmit the export. If an approved participant-code linkage exists, store it separately from the exported session data.
