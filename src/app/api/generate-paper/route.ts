// src/app/api/generate-paper/route.ts
//
// Server-side endpoint that pulls matching questions from Firestore, fetches
// each question's image, and compiles them into a single PDF using pdf-lib.
// Returns the PDF as a base64 data URL so the browser can trigger a direct
// download without needing a separate file host.

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getModulesForSubject } from "@/lib/subjects";
import type { Question } from "@/lib/types";

interface GeneratePaperRequest {
  subject: string;
  modules: string[];
  includeAnswers: boolean;
  questionCount: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: GeneratePaperRequest = await req.json();

    if (!body.subject) {
      return NextResponse.json({ success: false, message: "Please select a subject." }, { status: 400 });
    }

    const modulesToUse =
      body.modules && body.modules.length > 0 ? body.modules : getModulesForSubject(body.subject);

    let questions: Question[] = [];
    for (const moduleName of modulesToUse) {
      const q = query(
        collection(db, "questions"),
        where("status", "==", "Live"),
        where("subject", "==", body.subject),
        where("module", "==", moduleName),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      questions = questions.concat(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Question, "id">) }))
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No questions found for that subject/module selection yet." },
        { status: 404 }
      );
    }

    if (body.questionCount && body.questionCount > 0) {
      questions = shuffle(questions).slice(0, body.questionCount);
    }

    const pdfBytes = await buildPaperPdf(body.subject, modulesToUse, questions, body.includeAnswers);
    const base64 = Buffer.from(pdfBytes).toString("base64");
    const fileName = `${body.subject.replace(/\s+/g, "-")}-practice-paper.pdf`;

    return NextResponse.json({
      success: true,
      downloadUrl: `data:application/pdf;base64,${base64}`,
      fileName,
      questionCount: questions.length,
    });
  } catch (err) {
    console.error("generate-paper error:", err);
    return NextResponse.json(
      {
        success: false,
        message: `Could not generate paper: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

/**
 * Builds the actual PDF: a title page followed by one section per question,
 * embedding the question image directly where possible. Non-image files
 * (e.g. PDFs uploaded as the question itself) get a clickable-style link
 * line instead, since embedding arbitrary PDFs into another PDF page by
 * page is out of scope for a lightweight generator like this.
 */
async function buildPaperPdf(
  subject: string,
  modules: string[],
  questions: Question[],
  includeAnswers: boolean
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;

  // Title page
  const titlePage = pdfDoc.addPage([pageWidth, pageHeight]);
  titlePage.drawText(`${subject} Practice Paper`, {
    x: margin,
    y: pageHeight - 100,
    size: 22,
    font: boldFont,
    color: rgb(0.1, 0.24, 0.43),
  });
  titlePage.drawText(`Modules covered: ${modules.join(", ")}`, {
    x: margin,
    y: pageHeight - 130,
    size: 12,
    font,
  });
  titlePage.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: margin,
    y: pageHeight - 150,
    size: 12,
    font,
  });
  titlePage.drawText(`${questions.length} questions included`, {
    x: margin,
    y: pageHeight - 170,
    size: 12,
    font,
  });

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await addQuestionSection(pdfDoc, font, boldFont, i + 1, q, false);

    if (includeAnswers && q.answerFileUrl) {
      await addQuestionSection(pdfDoc, font, boldFont, i + 1, q, true);
    }
  }

  return pdfDoc.save();
}

async function addQuestionSection(
  pdfDoc: PDFDocument,
  font: import("pdf-lib").PDFFont,
  boldFont: import("pdf-lib").PDFFont,
  index: number,
  q: Question,
  isAnswer: boolean
) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  const heading = isAnswer ? `Question ${index} - Answer` : `Question ${index} (${q.module})`;
  page.drawText(heading, {
    x: margin,
    y: cursorY,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.24, 0.43),
  });
  cursorY -= 24;

  if (!isAnswer && q.subtopic) {
    page.drawText(`Topic: ${q.subtopic}`, { x: margin, y: cursorY, size: 10, font });
    cursorY -= 20;
  }

  const fileUrl = isAnswer ? q.answerFileUrl : q.questionFileUrl;

  try {
    const imageBytes = await fetchAsBytes(fileUrl);
    const isPng = fileUrl.toLowerCase().includes(".png");
    const image = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

    const maxWidth = pageWidth - margin * 2;
    const maxHeight = cursorY - margin;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;

    page.drawImage(image, {
      x: margin,
      y: cursorY - drawHeight,
      width: drawWidth,
      height: drawHeight,
    });
  } catch {
    // Not an image (e.g. a PDF was uploaded as the question file), or the
    // fetch/embed failed for some reason. Fall back to a plain text link
    // rather than failing the whole paper generation.
    page.drawText("Attached file (open link to view):", {
      x: margin,
      y: cursorY,
      size: 10,
      font,
    });
    cursorY -= 16;
    page.drawText(fileUrl, {
      x: margin,
      y: cursorY,
      size: 9,
      font,
      color: rgb(0.1, 0.24, 0.43),
    });
  }
}

async function fetchAsBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch file");
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
