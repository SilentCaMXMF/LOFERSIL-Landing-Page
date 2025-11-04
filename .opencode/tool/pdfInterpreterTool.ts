import { tool } from "@opencode-ai/plugin/tool"
import fs from "fs"
import pdf from "pdf-parse"
import nlp from "compromise"
import natural from "natural"
import franc from "franc"
import translate from "@vitalets/google-translate-api"

// ------------------------------
// 🔍 Core PDF Interpretation Logic
// ------------------------------
export async function interpretPDF(input: string | Buffer) {
  let dataBuffer: Buffer

  if (typeof input === "string") {
    if (!fs.existsSync(input)) throw new Error(`File not found: ${input}`)
    dataBuffer = fs.readFileSync(input)
  } else {
    dataBuffer = input
  }

  const data = await pdf(dataBuffer)
  const text = data.text.trim()
  const pages = data.numpages || 1

  if (!text) throw new Error("No readable text found in the PDF.")

  // ------------------------------
  // 🧠 Language Detection
  // ------------------------------
  const langCode = franc(text)
  let detectedLanguage = "unknown"
  try {
    const langMap: Record<string, string> = {
      por: "Portuguese",
      eng: "English",
      spa: "Spanish",
      fra: "French",
      deu: "German",
      ces: "Czech",
      ita: "Italian",
      rus: "Russian",
      jpn: "Japanese",
      zho: "Chinese",
    }
    detectedLanguage = langMap[langCode] || langCode
  } catch {
    detectedLanguage = "unknown"
  }

  // ------------------------------
  // 🧩 Text Analysis
  // ------------------------------
  const doc = nlp(text)
  const sentences = doc.sentences().out("array")
  const words = doc.terms().out("array")
  const avgSentenceLength = (words.length / (sentences.length || 1)).toFixed(2)

  // Keyword extraction
  const tokenizer = new natural.WordTokenizer()
  const tokens = tokenizer.tokenize(text.toLowerCase())
  const frequency: Record<string, number> = {}

  tokens.forEach((t) => {
    if (t.length > 3 && /^[a-záéíóúãõüçàèù]+$/i.test(t)) {
      frequency[t] = (frequency[t] || 0) + 1
    }
  })

  const keywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  // ------------------------------
  // 🧾 Summary Generation
  // ------------------------------
  const summarySentences = sentences.slice(0, 5)
  let summary =
    summarySentences.join(" ").trim() ||
    text.slice(0, 400) + (text.length > 400 ? "..." : "")

  // ------------------------------
  // 🌍 Translate to English
  // ------------------------------
  let translatedSummary = summary
  if (detectedLanguage !== "English" && detectedLanguage !== "unknown") {
    try {
      const translation = await translate(summary, { to: "en" })
      translatedSummary = translation.text
    } catch {
      translatedSummary = "(Translation failed — returning original summary.) " + summary
    }
  }

  // ------------------------------
  // 📊 Result Object
  // ------------------------------
  return {
    detectedLanguage,
    summary: translatedSummary,
    metadata: {
      pages,
      totalWords: words.length,
      totalSentences: sentences.length,
      avgSentenceLength,
      keywords,
    },
  }
}

// ------------------------------
// 🧰 Tool Definition
// ------------------------------
export const pdfInterpreterTool = tool({
  description:
    "Advanced multilingual PDF interpreter that extracts, analyzes, and summarizes PDFs — auto-translating summaries to English.",
  args: {
    filePath: tool.schema
      .string()
      .optional()
      .describe("Path to a PDF file (optional if using buffer)."),
    buffer: tool.schema
      .any()
      .optional()
      .describe("Raw PDF data buffer (optional if using file path)."),
  },
  async execute(args, context) {
    try {
      const result = await interpretPDF(args.buffer || args.filePath)
      return result
    } catch (error: any) {
      return { error: error.message }
    }
  },
})

// ------------------------------
// 📦 Default Export
// ------------------------------
export default pdfInterpreterTool
