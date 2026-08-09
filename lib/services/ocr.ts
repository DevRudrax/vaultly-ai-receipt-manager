import * as fs from "fs";
import * as path from "path";
import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
}

export async function extractTextFromReceipt(filePathOrUrl: string): Promise<OcrResult> {
  try {
    let targetPath = filePathOrUrl;
    if (filePathOrUrl.startsWith("/uploads/")) {
      targetPath = path.join(process.cwd(), "public", filePathOrUrl);
    }

    if (fs.existsSync(targetPath)) {
      const ext = path.extname(targetPath).toLowerCase();
      const content = await fs.promises.readFile(targetPath);

      // Handle SVG / plain text directly
      if (ext === ".svg" || ext === ".txt") {
        const textContent = content.toString("utf-8");
        // Strip XML/SVG tags to leave text content
        const cleanText = textContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return {
          text: cleanText,
          confidence: 0.95,
        };
      }

      // Try Tesseract for images
      try {
        const worker = await Tesseract.createWorker("eng");
        const ret = await worker.recognize(content);
        await worker.terminate();

        return {
          text: ret.data.text || "",
          confidence: (ret.data.confidence || 85) / 100,
        };
      } catch (tessErr) {
        console.warn("Tesseract recognize warning:", tessErr);
      }
    }

    return {
      text: "",
      confidence: 0,
    };
  } catch (error) {
    console.warn("OCR fallback encountered issue:", error);
    return {
      text: "",
      confidence: 0,
    };
  }
}
