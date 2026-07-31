import "server-only";

import { createHash } from "node:crypto";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
]);

export function validateUpload(file: File) {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Use a PDF, JPG, PNG, or plain-text file.");
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error("Files must be between 1 byte and 10 MB.");
}

export function sanitizeFileName(value: string) {
  const base = value.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return base.slice(0, 120) || "care-source";
}

export async function sha256File(file: File) {
  return createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
}

export async function extractLocalText(file: File) {
  if (file.type === "text/plain") return (await file.text()).slice(0, 100_000);
  if (file.type !== "application/pdf") return "";
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await getDocument({ data, useWorkerFetch: false }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 50); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => "str" in item ? item.str : "").join(" ");
    pages.push(`[Page ${pageNumber}]\n${text}`);
  }
  return pages.join("\n\n").slice(0, 100_000);
}

export async function prepareDocumentForAnalysis(file: File) {
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return {
      text: "",
      pages: [] as Array<{ pageNumber: number; text: string }>,
      images: [{
        mimeType: file.type as "image/jpeg" | "image/png",
        base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      }],
    };
  }
  if (file.type === "text/plain") {
    const text = (await file.text()).slice(0, 100_000);
    return { text, pages: [{ pageNumber: 1, text }], images: [] };
  }
  if (file.type !== "application/pdf") {
    return { text: "", pages: [], images: [] };
  }

  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");
  const document = await getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  }).promise;
  const pages: Array<{ pageNumber: number; text: string }> = [];
  const images: Array<{ mimeType: "image/png"; base64: string }> = [];
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 50); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => "str" in item ? item.str : "").join(" ").trim();
    pages.push({ pageNumber, text });
    if (text.length < 80 && images.length < 8) {
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({
        canvas: canvas as never,
        canvasContext: canvas.getContext("2d") as never,
        viewport,
      }).promise;
      images.push({ mimeType: "image/png", base64: canvas.toBuffer("image/png").toString("base64") });
    }
  }
  const text = pages.map((page) => `[Page ${page.pageNumber}]\n${page.text}`).join("\n\n").slice(0, 100_000);
  return { text, pages, images };
}
