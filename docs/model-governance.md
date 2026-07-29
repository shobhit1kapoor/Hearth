# Model governance

## Phase 1 processing

The working proof of concept uses deterministic TypeScript fixtures and rules. No external foundation model receives the synthetic case during normal application use.

The “AI interpretation” label demonstrates a provenance category; it is not a claim that a production model performed live extraction. Smart 40 records the compiler as `HEARTH deterministic compiler v0.3`.

## Production model policy

Before introducing a model:

- document the exact task, input fields, vendor, model/version, region, retention, training configuration, and replacement strategy;
- minimize and redact prompts before transmission;
- separate source text, caregiver observation, and model interpretation;
- use structured output with schema validation;
- attach confidence and exact source spans;
- prevent model output from lowering safety authority;
- require H3/H4 review outside the model;
- test subgroup performance, ambiguous records, prompt injection, staleness, and unavailable services;
- record model, configuration, source version, prompt policy, result, correction, and human approval;
- support deterministic degraded mode and full model disablement.

## Change management

A model or prompt change requires:

1. versioned change proposal;
2. locked regression and adversarial evaluation;
3. human safety review;
4. documented deltas and known failures;
5. staged release with monitoring;
6. rollback path;
7. updated user-facing explanation where behavior changes.

Real user records must not be used for model training by default.
