// src/lib/subjects.ts
//
// Single source of truth for subjects and their NESA modules.
// This is the ONLY file that should need editing to add a new subject,
// rename a module, or adjust the structure.
//
// IMPORTANT: All modules listed below reflect the CURRENT (pre-2027 reform)
// NESA syllabus, which is what the 2026 HSC cohort is examined on.
//
// Subjects with a single "General" module are placeholders. Their real
// modules have not yet been confirmed against the official NESA syllabus.
// Replace the array for that subject once research is completed; nothing
// else in the app needs to change.

export const SUBJECTS: Record<string, string[]> = {
  "Maths Standard": [
    "Algebra",
    "Measurement",
    "Financial Mathematics",
    "Statistical Analysis",
    "Networks",
  ],
  "Maths Advanced": [
    "Functions",
    "Trigonometric Functions",
    "Calculus",
    "Financial Mathematics",
    "Statistical Analysis",
  ],
  "Maths Extension 1": [
    "Functions",
    "Trigonometric Functions",
    "Calculus",
    "Proof",
    "Vectors",
    "Statistical Analysis",
  ],
  "Maths Extension 2": ["Proof", "Vectors", "Complex Numbers", "Calculus", "Mechanics"],
  Physics: [
    "Advanced Mechanics",
    "Electromagnetism",
    "The Nature of Light",
    "From the Universe to the Atom",
  ],
  Chemistry: [
    "Equilibrium and Acid Reactions",
    "Acid/Base Reactions",
    "Organic Chemistry",
    "Applying Chemical Ideas",
  ],
  Biology: [
    "Heredity",
    "Genetic Change",
    "Infectious Disease",
    "Non-infectious Disease and Disorders",
  ],

  // Placeholder subjects: modules not yet confirmed against NESA syllabus.
  "Earth Science": ["General"],
  Economics: ["General"],
  "Business Studies": ["General"],
  "Legal Studies": ["General"],
  Geography: ["General"],
  "Music 1": ["General"],
  "Music 2": ["General"],
  "Science Extension": ["General"],
  "Ancient History": ["General"],
  "Modern History": ["General"],
  "History Extension": ["General"],
  "English Extension 1": ["General"],
};

export function getSubjectNames(): string[] {
  return Object.keys(SUBJECTS);
}

export function getModulesForSubject(subject: string): string[] {
  return SUBJECTS[subject] || [];
}

export const DIFFICULTY_OPTIONS = ["Challenging", "Band 6 stretch", "Common trap"] as const;
