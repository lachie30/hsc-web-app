// src/lib/questions.ts
//
// All reads and writes to Firestore (metadata) and Storage (files) for
// questions go through this file, so there is one place that knows the
// exact shape of a question document and how files are named/stored.

import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Question, QuestionFilters } from "./types";

const QUESTIONS_COLLECTION = "questions";

/**
 * Uploads a single file into Storage under a path that mirrors the old
 * Drive folder structure (subject/module/filename), so it stays easy to
 * browse directly in the Firebase console if ever needed. Returns the
 * public download URL and the stored file name.
 */
async function uploadFile(
  subject: string,
  moduleName: string,
  file: File
): Promise<{ url: string; name: string }> {
  const timestamp = Date.now();
  const safeName = `${timestamp}-${file.name}`;
  const path = `questions/${subject}/${moduleName}/${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, name: file.name };
}

export interface SubmitQuestionInput {
  subject: string;
  module: string;
  subtopic: string;
  difficulty: string;
  uploaderName: string;
  notes: string;
  questionFile: File;
  answerFile: File | null;
}

/**
 * Handles a full question submission: uploads the question file (and
 * optional answer file) to Storage, then writes the metadata row to
 * Firestore. This is the equivalent of the old Apps Script submitQuestion
 * function, and is the "automatic sorting" step, files land in the right
 * subject/module path the moment this resolves.
 */
export async function submitQuestion(input: SubmitQuestionInput): Promise<void> {
  if (!input.subject) throw new Error("Please select a subject.");
  if (!input.module) throw new Error("Please select a module.");
  if (!input.questionFile) throw new Error("Please attach a question file or screenshot.");

  const questionUpload = await uploadFile(input.subject, input.module, input.questionFile);

  let answerUpload: { url: string; name: string } | null = null;
  if (input.answerFile) {
    answerUpload = await uploadFile(input.subject, input.module, input.answerFile);
  }

  const newQuestion: Omit<Question, "id"> = {
    subject: input.subject,
    module: input.module,
    subtopic: input.subtopic || "",
    difficulty: input.difficulty || "",
    uploaderName: input.uploaderName || "Anonymous",
    questionFileUrl: questionUpload.url,
    questionFileName: questionUpload.name,
    answerFileUrl: answerUpload ? answerUpload.url : "",
    answerFileName: answerUpload ? answerUpload.name : "",
    notes: input.notes || "",
    status: "Live",
    upvotes: 0,
    createdAt: Date.now(),
  };

  await addDoc(collection(db, QUESTIONS_COLLECTION), newQuestion);
}

/**
 * Fetches questions matching the given filters, most recent first.
 * Keyword filtering happens client-side after the Firestore query, since
 * Firestore does not support free-text search natively and our data volume
 * (a school question bank) does not warrant a dedicated search service.
 */
export async function getQuestions(filters: QuestionFilters = {}): Promise<Question[]> {
  const constraints = [where("status", "==", "Live")];

  if (filters.subject) {
    constraints.push(where("subject", "==", filters.subject));
  }
  if (filters.module) {
    constraints.push(where("module", "==", filters.module));
  }

  const q = query(collection(db, QUESTIONS_COLLECTION), ...constraints, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  let results: Question[] = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Question, "id">),
  }));

  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    results = results.filter((q) =>
      `${q.subtopic} ${q.notes} ${q.questionFileName}`.toLowerCase().includes(keyword)
    );
  }

  return results;
}

/**
 * Increments the upvote count for a single question.
 */
export async function upvoteQuestion(questionId: string): Promise<void> {
  const ref = doc(db, QUESTIONS_COLLECTION, questionId);
  await updateDoc(ref, { upvotes: increment(1) });
}

/**
 * Marks a question as flagged for review without removing it from view.
 */
export async function flagQuestionForReview(questionId: string): Promise<void> {
  const ref = doc(db, QUESTIONS_COLLECTION, questionId);
  await updateDoc(ref, { status: "Flagged" });
}
