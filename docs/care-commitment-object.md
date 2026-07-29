# Care Commitment Object

A Care Commitment Object (CCO) is the auditable unit of HEARTH. The implementation is in `lib/hearth.ts`.

## Fields

Each object contains:

- unique identifier and plain-language responsibility;
- responsible owner and permitted alternates;
- source identifier, location, excerpt, and date;
- verification category and confidence;
- safe time window;
- dependencies, equipment, and required skill;
- privacy classification and consent rule;
- risk and H0–H4 authority level;
- approval requirement;
- completion criteria and current evidence;
- backup and escalation recipient;
- lifecycle state;
- immutable-style event history.

## Lifecycle

Supported states are Identified, Needs review, Assigned, Awaiting acceptance, Accepted, In progress, Awaiting external response, Blocked, Escalated, Completed, Verified, Cancelled, and Superseded.

The UI demonstrates that:

- a refill remains open until a pharmacy outcome is recorded;
- an appointment remains open while the provider response is pending;
- transport remains unresolved until a helper accepts;
- medication conflict remains blocked until professional resolution and human confirmation;
- superseded instructions stay visible for audit without becoming active.

## Evidence rule

No CCO is complete because HEARTH drafted or sent a message. `completionCriteria` defines the required real-world outcome, and `evidence` records whether it exists.
