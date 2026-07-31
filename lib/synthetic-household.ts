export const syntheticHousehold = {
  marker: "hearth-synthetic-launch-household-v1",
  caregiver: {
    displayName: "Jordan Ellis",
    email: "jordan.ellis.hearth@example.com",
    relationship: "Daughter",
    preferredLanguage: "en",
    timezone: "America/Chicago",
  },
  helper: {
    displayName: "Avery Ellis",
    email: "avery.ellis.hearth@example.com",
    relationship: "Sibling",
    preferredLanguage: "en",
    timezone: "America/Chicago",
  },
  recipient: {
    preferredName: "Margaret Ellis",
    preferredLanguage: "en",
    preferences: {
      synthetic_household: true,
      communication: "Use short sentences, large text, and one request at a time.",
      mobility: "Uses a foldable walker for appointments.",
      routine: "Prefers morning calls after 9:00 AM and quiet evenings.",
      caregiver_relationship: "Daughter",
    },
  },
  careSpaceName: "Margaret's Care Plan · Synthetic Test",
  helperPermission: {
    purpose: "Cardiology transportation on August 1",
    allowedCategories: ["tasks", "appointments", "transportation"],
    withheldCategories: ["diagnoses", "medications", "insurance", "caregiver_private_notes"],
  },
  capacity: {
    requiredHours: 31,
    availableHours: 18,
    deficitHours: 13,
    input: {
      work_schedule: "Weekdays, 8:30 AM to 5:00 PM",
      sleep_target_hours: 7,
      other_responsibilities: ["Two school pickups", "Household meals", "Own medical appointment"],
      busiest_period: "Weekday evenings",
    },
    recommendation: {
      summary: "Jordan needs 13 fewer care hours this week.",
      first_step: "Keep the cardiology ride with Avery after Avery accepts it.",
    },
  },
} as const;

export type SyntheticHousehold = typeof syntheticHousehold;
