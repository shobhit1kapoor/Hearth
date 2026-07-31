export type IdentityCandidate = {
  id: string;
  displayName: string;
  disambiguator?: string;
};

export type CorrectionProposal = {
  actorId: string;
  baseVersion: number;
  value: string;
  reason: string;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export function resolveNamedAssignee(requestedName: string, candidates: IdentityCandidate[]) {
  const matches = candidates.filter((candidate) => normalize(candidate.displayName) === normalize(requestedName));
  if (matches.length === 1) {
    return {
      action: "assign_unique" as const,
      memberId: matches[0].id,
      options: matches,
      message: `Assign to ${matches[0].displayName}.`,
    };
  }
  if (matches.length > 1) {
    return {
      action: "request_disambiguation" as const,
      memberId: null,
      options: matches,
      message: `More than one person is named ${requestedName}. Choose the correct person before assigning this task.`,
    };
  }
  return {
    action: "request_disambiguation" as const,
    memberId: null,
    options: [] as IdentityCandidate[],
    message: `No matching person was found for ${requestedName}. Choose a person from the care team.`,
  };
}

type DateLocale = "month-first" | "day-first";

export function resolveNumericDate(input: string, locale?: DateLocale) {
  const match = input.match(/\b(0?[1-9]|1[0-2])[/-](0?[1-9]|1[0-2])(?:[/-](\d{2}|\d{4}))?\b/);
  if (!match) {
    return {
      action: "no_numeric_date" as const,
      original: null,
      parsed: null,
      choices: [] as string[],
      message: "No ambiguous numeric date was found.",
    };
  }

  const original = match[0];
  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = match[3] ?? null;
  const choices = [
    `${monthName(first)} ${second}${year ? `, ${normalizeYear(year)}` : ""}`,
    `${monthName(second)} ${first}${year ? `, ${normalizeYear(year)}` : ""}`,
  ];

  if (!locale && first !== second) {
    return {
      action: "request_date_locale" as const,
      original,
      parsed: null,
      choices,
      message: `${original} can mean ${choices[0]} or ${choices[1]}. Confirm the intended date.`,
    };
  }

  const month = locale === "day-first" ? second : first;
  const day = locale === "day-first" ? first : second;
  return {
    action: "date_resolved" as const,
    original,
    parsed: {
      month,
      day,
      year: year ? normalizeYear(year) : null,
      locale: locale ?? "month-first",
    },
    choices,
    message: `Date confirmed as ${monthName(month)} ${day}${year ? `, ${normalizeYear(year)}` : ""}.`,
  };
}

const shorthandPatterns = [
  { token: "qhs", pattern: /\bqhs\b/i },
  { token: "MAR", pattern: /\bMAR\b/ },
  { token: "qd", pattern: /\bqd\b/i },
  { token: "bid", pattern: /\bbid\b/i },
  { token: "tid", pattern: /\btid\b/i },
  { token: "qid", pattern: /\bqid\b/i },
  { token: "prn", pattern: /\bprn\b/i },
  { token: "ac", pattern: /\bac\b/i },
  { token: "pc", pattern: /\bpc\b/i },
];

export function assessClinicalShorthand(input: string) {
  const terms = shorthandPatterns
    .filter(({ pattern }) => pattern.test(input))
    .map(({ token }) => token);
  if (terms.length === 0) {
    return {
      action: "ordinary_review" as const,
      terms,
      original: input,
      requiresProfessionalReview: false,
      message: "No protected clinical shorthand was detected.",
    };
  }
  return {
    action: "escalate_shorthand" as const,
    terms,
    original: input,
    requiresProfessionalReview: true,
    message: `Unclear clinical shorthand (${terms.join(", ")}) was kept exactly as written. A pharmacist or clinician must clarify it before use.`,
  };
}

export function reconcileCorrections(proposals: CorrectionProposal[]) {
  if (proposals.length === 0) {
    return {
      action: "no_correction" as const,
      activeValue: null,
      conflicts: [] as CorrectionProposal[],
      message: "No correction was supplied.",
    };
  }

  const baseVersions = new Set(proposals.map((proposal) => proposal.baseVersion));
  const values = new Set(proposals.map((proposal) => normalize(proposal.value)));
  if (baseVersions.size === 1 && values.size > 1) {
    return {
      action: "persist_conflict" as const,
      activeValue: null,
      conflicts: proposals,
      message: "Two corrections disagree. Both versions were saved and the task remains blocked until a person resolves the conflict.",
    };
  }

  const latest = proposals.at(-1)!;
  return {
    action: "apply_correction" as const,
    activeValue: latest.value,
    conflicts: [] as CorrectionProposal[],
    message: "The correction can be applied with its history preserved.",
  };
}

export function modelRecurringSchedule(input: string) {
  const recurring = /\b(daily|every day|weekly|every week|each day|each week)\b/i.test(input);
  const exceptionMatch = input.match(/\b(?:except|unless|skip(?:ping)?)(.+)$/i);
  const baseSchedule = input.split(/\b(?:except|unless|skip(?:ping)?)\b/i, 1)[0];
  const frequency = /\bweekly|every week|each week\b/i.test(baseSchedule) ? "weekly" as const : "daily" as const;
  if (recurring && exceptionMatch) {
    const exceptionText = exceptionMatch[1].trim().replace(/[.]+$/, "");
    const dynamic = /\b(vary|varies|varying|changes?|different)\b/i.test(exceptionText);
    return {
      action: "model_exception_rule" as const,
      schedule: {
        frequency,
        exceptionText,
        exceptionKind: dynamic ? "dynamic_source_days" as const : "named_exception" as const,
        requiresConfirmation: dynamic,
      },
      message: dynamic
        ? "The repeating task has changing exception days. Confirm each exception from an approved schedule before creating reminders."
        : `The repeating task excludes ${exceptionText}.`,
    };
  }
  return {
    action: recurring ? "recurring_schedule" as const : "single_schedule" as const,
    schedule: recurring ? {
      frequency,
      exceptionText: null,
      exceptionKind: null,
      requiresConfirmation: false,
    } : null,
    message: recurring ? "A repeating schedule was detected." : "No repeating schedule was detected.",
  };
}

function monthName(month: number) {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][month - 1];
}

function normalizeYear(year: string) {
  return year.length === 2 ? 2000 + Number(year) : Number(year);
}
