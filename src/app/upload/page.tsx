// src/app/upload/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { getModulesForSubject, getSubjectNames, DIFFICULTY_OPTIONS } from "@/lib/subjects";
import { submitQuestion } from "@/lib/questions";

const subjects = getSubjectNames();

export default function UploadPage() {
  const [subject, setSubject] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [notes, setNotes] = useState("");
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const modules = subject ? getModulesForSubject(subject) : [];

  function handleSubjectChange(value: string) {
    setSubject(value);
    setModuleName(""); // reset dependent dropdown whenever the subject changes
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!questionFile) {
      setStatus({ type: "error", message: "Please attach a question file or screenshot." });
      return;
    }

    setSubmitting(true);
    try {
      await submitQuestion({
        subject,
        module: moduleName,
        subtopic,
        difficulty,
        uploaderName,
        notes,
        questionFile,
        answerFile,
      });

      setStatus({
        type: "success",
        message: `Question added to ${subject} / ${moduleName}.`,
      });

      // Reset the form for the next submission, but keep subject/module
      // selected since contributors often add several questions in a row
      // for the same topic.
      setSubtopic("");
      setDifficulty("");
      setNotes("");
      setQuestionFile(null);
      setAnswerFile(null);
      (document.getElementById("question-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("question-file") as HTMLInputElement).value = "");
      (document.getElementById("answer-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("answer-file") as HTMLInputElement).value = "");
    } catch (err) {
      setStatus({
        type: "error",
        message: `Could not save your question: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-xl border border-[#dfe3e8] bg-white p-7 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-[#12294c]">Upload a question</h1>
        <p className="mb-6 text-sm text-[#5c6570]">
          Pick the subject and module, attach a screenshot or file of the question, and submit.
          It will be filed into the right place immediately.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Your name">
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="So others know who contributed this"
              className="input"
            />
          </Field>

          <Field label="Subject">
            <select
              required
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="input"
            >
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Module">
            <select
              required
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              disabled={!subject}
              className="input"
            >
              <option value="">{subject ? "Select a module" : "Select a subject first"}</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sub-topic (optional)">
            <input
              type="text"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              placeholder="e.g. Motors and generators"
              className="input"
            />
          </Field>

          <Field label="Difficulty (optional)">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input">
              <option value="">Not specified</option>
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Question file or screenshot">
            <input
              id="question-file"
              type="file"
              required
              accept="image/*,application/pdf"
              onChange={(e) => setQuestionFile(e.target.files?.[0] ?? null)}
              className="input"
            />
          </Field>

          <Field label="Answer or marking guidelines (optional, but encouraged)">
            <input
              id="answer-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setAnswerFile(e.target.files?.[0] ?? null)}
              className="input"
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything that helps someone attempting this question, e.g. what makes it tricky"
              className="input min-h-[70px] resize-y"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#1a3c6e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#12294c] disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit question"}
          </button>

          {status && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                status.type === "success"
                  ? "border-[#bfe0cf] bg-[#e5f3ec] text-[#2f7d5e]"
                  : "border-[#eec4b6] bg-[#fbeae5] text-[#b3452c]"
              }`}
            >
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#202631]">{label}</label>
      {children}
    </div>
  );
}
