// src/lib/types.ts

export interface Question {
  id: string;
  subject: string;
  module: string;
  subtopic: string;
  difficulty: string;
  uploaderName: string;
  questionFileUrl: string;
  questionFileName: string;
  answerFileUrl: string;
  answerFileName: string;
  notes: string;
  status: "Live" | "Flagged";
  upvotes: number;
  createdAt: number; // stored as a millisecond timestamp for simple sorting
}

export interface QuestionFilters {
  subject?: string;
  module?: string;
  keyword?: string;
}
