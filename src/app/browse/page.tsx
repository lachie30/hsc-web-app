// src/app/browse/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getModulesForSubject, getSubjectNames } from "@/lib/subjects";
import { getQuestions, upvoteQuestion, flagQuestionForReview } from "@/lib/questions";
import type { Question } from "@/lib/types";

const subjects = getSubjectNames();

export default function BrowsePage() {
  const [subject, setSubject] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const modules = subject ? getModulesForSubject(subject) : [];

  async function runSearch() {
    setLoading(true);
    try {
      const results = await getQuestions({
        subject: subject || undefined,
        module: moduleName || undefined,
        keyword: keyword || undefined,
      });
      setQuestions(results);
    } finally {
      setLoading(false);
    }
  }

  // Load an unfiltered view on first visit.
  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpvote(id: string) {
    await upvoteQuestion(id);
    runSearch();
  }

  async function handleFlag(id: string) {
    await flagQuestionForReview(id);
    setFlaggedIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <div className="rounded-xl border border-[#dfe3e8] bg-white p-7 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold text-[#12294c]">Find questions</h1>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Subject</label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setModuleName("");
              }}
              className="input"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Module</label>
            <select
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              disabled={!subject}
              className="input"
            >
              <option value="">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold">Keyword search</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search sub-topics and notes"
            className="input"
          />
        </div>

        <button
          onClick={runSearch}
          className="rounded-lg bg-[#1a3c6e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#12294c]"
        >
          Search
        </button>
      </div>

      <PracticePaperBuilder subject={subject} module={moduleName} />

      <div>
        {loading && <div className="py-10 text-center text-[#5c6570]">Loading...</div>}

        {!loading && questions && questions.length === 0 && (
          <div className="py-10 text-center text-[#5c6570]">
            No questions found. Try widening your filters, or be the first to upload one.
          </div>
        )}

        {!loading && questions && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="rounded-xl border border-[#dfe3e8] bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Tag>{q.subject}</Tag>
                    <Tag>{q.module}</Tag>
                    {q.difficulty && <Tag variant="difficulty">{q.difficulty}</Tag>}
                  </div>
                  <div className="whitespace-nowrap text-sm text-[#5c6570]">★ {q.upvotes || 0}</div>
                </div>

                {q.subtopic && <p className="mb-1 font-medium">{q.subtopic}</p>}
                {q.notes && <p className="mb-2 text-sm text-[#5c6570]">{q.notes}</p>}

                <div className="mb-3 text-xs text-[#5c6570]">
                  Added by {q.uploaderName || "Anonymous"}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  
                    href={q.questionFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    View question
                  </a>
                  {q.answerFileUrl && (
                    
                      href={q.answerFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      View answer
                    </a>
                  )}
                  <button onClick={() => handleUpvote(q.id)} className="btn-secondary">
                    Upvote
                  </button>
                  <button
                    onClick={() => handleFlag(q.id)}
                    disabled={flaggedIds.has(q.id)}
                    className="btn-secondary disabled:opacity-60"
                  >
                    {flaggedIds.has(q.id) ? "Flagged" : "Flag for review"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "difficulty";
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        variant === "difficulty" ? "bg-[#fdf1e3] text-[#8a5a1e]" : "bg-[#eef2f8] text-[#12294c]"
      }`}
    >
      {children}
    </span>
  );
}

function PracticePaperBuilder({ subject, module: moduleName }: { subject: string; module: string }) {
  const [count, setCount] = useState("");
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    downloadUrl?: string;
    fileName?: string;
  } | null>(null);

  async function handleGenerate() {
    setResult(null);

    if (!subject) {
      setResult({ type: "error", message: "Please select a subject first." });
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generate-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          modules: moduleName ? [moduleName] : [],
          includeAnswers,
          questionCount: count ? parseInt(count, 10) : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not generate paper.");
      }

      // Mobile browsers frequently block or silently ignore JS-triggered
      // downloads, especially for large data: URLs like a base64 PDF. The
      // reliable approach across desktop and mobile alike is to show the
      // person a normal link they tap/click themselves, rather than trying
      // to force a download programmatically.
      setResult({
        type: "success",
        message: `Paper ready with ${data.questionCount} questions.`,
        downloadUrl: data.downloadUrl,
        fileName: data.fileName || "practice-paper.pdf",
      });
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#dfe3e8] bg-white p-7 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-[#12294c]">Build a practice paper</h2>
      <p className="mb-4 text-sm text-[#5c6570]">
        Uses the subject and module filters above. Leave module set to &quot;All modules&quot;
        to build a paper across the whole subject.
      </p>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Number of questions</label>
          <input
            type="text"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="Leave blank for all matching questions"
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Include answers</label>
          <select
            value={includeAnswers ? "yes" : "no"}
            onChange={(e) => setIncludeAnswers(e.target.value === "yes")}
            className="input"
          >
            <option value="no">No, questions only</option>
            <option value="yes">Yes, include answers</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="btn-secondary disabled:opacity-60"
      >
        {generating ? "Generating..." : "Generate practice paper"}
      </button>

      {result && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            result.type === "success"
              ? "border-[#bfe0cf] bg-[#e5f3ec] text-[#2f7d5e]"
              : "border-[#eec4b6] bg-[#fbeae5] text-[#b3452c]"
          }`}
        >
          <p>{result.message}</p>
          {result.downloadUrl && (
            
              href={result.downloadUrl}
              download={result.fileName}
              className="mt-2 inline-block underline font-semibold"
            >
              Tap here to download your practice paper
            </a>
          )}
        </div>
      )}
    </div>
  );
}
