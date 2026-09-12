// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 rounded-xl border border-[#dfe3e8] bg-white p-7 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-[#12294c]">
          Study smarter with real Band 6 questions
        </h1>
        <p className="text-[#5c6570]">
          This is a shared bank of the hardest HSC questions across every subject, contributed
          by top students. Browse questions by subject and module, or upload one you got wrong
          so others can learn from it too.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          href="/upload"
          className="rounded-xl border border-[#dfe3e8] bg-white p-7 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
        >
          <h2 className="mb-1 font-semibold text-[#1a3c6e]">Upload a question</h2>
          <p className="text-sm text-[#5c6570]">
            Add a screenshot or file of a tricky question. Choose the subject and module and it
            is filed automatically.
          </p>
        </Link>
        <Link
          href="/browse"
          className="rounded-xl border border-[#dfe3e8] bg-white p-7 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
        >
          <h2 className="mb-1 font-semibold text-[#1a3c6e]">Browse &amp; practice</h2>
          <p className="text-sm text-[#5c6570]">
            Search the question bank by subject or module, and build a practice paper you can
            download and complete.
          </p>
        </Link>
      </div>
    </div>
  );
}
