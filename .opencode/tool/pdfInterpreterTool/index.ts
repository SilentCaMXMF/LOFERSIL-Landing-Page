import { tool } from '@opencode-ai/plugin/tool';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import nlp from 'compromise';
import natural from 'natural';
import franc from 'franc';
import translate from '@vitalets/google-translate-api';

// Type definitions
interface PDFInterpretationResult {
  detectedLanguage: string;
  summary: string;
  metadata: {
    pages: number;
    totalWords: number;
    totalSentences: number;
    avgSentenceLength: string;
    keywords: string[];
  };
}

interface PDFToolArgs {
  filePath?: string;
  buffer?: Buffer;
}

// Custom error classes
class PDFInterpreterError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'PDFInterpreterError';
  }
}

class PathTraversalError extends PDFInterpreterError {
  constructor(message: string) {
    super(message, 'PATH_TRAVERSAL');
  }
}

class InvalidInputError extends PDFInterpreterError {
  constructor(message: string) {
    super(message, 'INVALID_INPUT');
  }
}

class FileNotFoundError extends PDFInterpreterError {
  constructor(message: string) {
    super(message, 'FILE_NOT_FOUND');
  }
}

class FileTooLargeError extends PDFInterpreterError {
  constructor(message: string) {
    super(message, 'FILE_TOO_LARGE');
  }
}

class PDFProcessingError extends PDFInterpreterError {
  constructor(message: string) {
    super(message, 'PDF_PROCESSING_ERROR');
  }
}

class TranslationError extends PDFInterpreterError {
  constructor(message: string) {
    super(message, 'TRANSLATION_ERROR');
  }
}

// Configuration
const CONFIG = {
  textAnalysis: {
    minWordLength: 3,
    maxKeywords: 10,
    maxSummarySentences: 5,
    maxSummaryLength: 400,
  },
  file: {
    maxSizeMB: 50,
    maxSizeBytes: 50 * 1024 * 1024,
  },
  rateLimit: {
    maxConcurrentRequests: 5,
  },
};

// Rate limiting state
let activeRequests = 0;

// Structured logging
const logger = {
  info: (message: string) => console.log(`[INFO] ${new Date().toISOString()}: ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${new Date().toISOString()}: ${message}`),
  error: (message: string) => console.error(`[ERROR] ${new Date().toISOString()}: ${message}`),
};

// Retry helper
async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      logger.warn(
        `Attempt ${i + 1} failed, retrying in ${delay}ms: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}

// ------------------------------
// 🔍 Core PDF Interpretation Logic
// ------------------------------
export async function interpretPDF(input: string | Buffer): Promise<PDFInterpretationResult> {
  // Rate limiting check
  if (activeRequests >= CONFIG.rateLimit.maxConcurrentRequests) {
    throw new PDFInterpreterError(
      'Rate limit exceeded: Too many concurrent requests',
      'RATE_LIMIT'
    );
  }
  activeRequests++;
  try {
    let data;

    // Input validation
    if (typeof input === 'string') {
      if (!input.trim()) throw new InvalidInputError('File path cannot be empty');
      // Path traversal protection: normalize path and prevent directory traversal
      const normalizedPath = path.normalize(input);
      if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
        throw new PathTraversalError(
          'Access denied: Invalid path - directory traversal not allowed'
        );
      }
      const resolvedPath = path.resolve(normalizedPath);
      if (!resolvedPath.startsWith(process.cwd())) {
        throw new PathTraversalError('Access denied: Path outside allowed directory');
      }
      try {
        await fsPromises.access(resolvedPath);
      } catch {
        throw new FileNotFoundError(`File not found: ${input}`);
      }
      // File size check
      const stat = await fsPromises.stat(resolvedPath);
      if (stat.size > CONFIG.file.maxSizeBytes) {
        throw new FileTooLargeError(
          `File too large: ${stat.size} bytes exceeds ${CONFIG.file.maxSizeMB}MB limit`
        );
      }
      logger.info('Reading PDF file...');
      // Use streaming for memory efficiency
      const stream = fs.createReadStream(resolvedPath);
      data = await pdf(stream);
    } else {
      // Buffer validation
      if (!Buffer.isBuffer(input)) {
        throw new InvalidInputError('Invalid input: Expected string path or Buffer');
      }
      if (input.length > CONFIG.file.maxSizeBytes) {
        throw new FileTooLargeError(
          `Buffer too large: ${input.length} bytes exceeds ${CONFIG.file.maxSizeMB}MB limit`
        );
      }
      // PDF format validation
      if (!input.toString('ascii', 0, 5).startsWith('%PDF-')) {
        throw new InvalidInputError('Invalid buffer: Not a valid PDF file');
      }
      logger.info('Processing PDF buffer...');
      data = await pdf(input);
    }
    const text = data.text.trim();
    const pages = data.numpages || 1;

    if (!text) throw new PDFProcessingError('No readable text found in the PDF.');

    // ------------------------------
    // 🧠 Language Detection
    // ------------------------------
    let detectedLanguage = 'unknown';
    logger.info('Detecting language...');
    try {
      if (text.length < 10) {
        detectedLanguage = 'unknown';
      } else {
        const langCode = franc(text);
        if (langCode === 'und') {
          detectedLanguage = 'unknown';
        } else {
          const langMap: Record<string, string> = {
            por: 'Portuguese',
            eng: 'English',
            spa: 'Spanish',
            fra: 'French',
            deu: 'German',
            ces: 'Czech',
            ita: 'Italian',
            rus: 'Russian',
            jpn: 'Japanese',
            zho: 'Chinese',
            ara: 'Arabic',
            hin: 'Hindi',
            kor: 'Korean',
            nld: 'Dutch',
            swe: 'Swedish',
            tur: 'Turkish',
            pol: 'Polish',
            dan: 'Danish',
            fin: 'Finnish',
            nor: 'Norwegian',
          };
          detectedLanguage = langMap[langCode] || langCode;
        }
      }
    } catch (error) {
      logger.warn(
        'Language detection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
      detectedLanguage = 'unknown';
    }

    // ------------------------------
    // 🧩 Text Analysis
    // ------------------------------
    logger.info('Analyzing text...');
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const words = doc.terms().out('array');
    const avgSentenceLength = (words.length / (sentences.length || 1)).toFixed(2);

    // Keyword extraction
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
    const frequency: Record<string, number> = {};

    tokens.forEach(t => {
      if (t.length > CONFIG.textAnalysis.minWordLength && /^[a-záéíóúãõüçàèù]+$/i.test(t)) {
        frequency[t] = (frequency[t] || 0) + 1;
      }
    });

    const keywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, CONFIG.textAnalysis.maxKeywords)
      .map(([word]) => word);

    // ------------------------------
    // 🧾 Summary Generation
    // ------------------------------
    logger.info('Generating summary...');
    const summarySentences = sentences.slice(0, CONFIG.textAnalysis.maxSummarySentences);
    let summary =
      summarySentences.join(' ').trim() ||
      text.slice(0, CONFIG.textAnalysis.maxSummaryLength) +
        (text.length > CONFIG.textAnalysis.maxSummaryLength ? '...' : '');

    // ------------------------------
    // 🌍 Translate to English
    // ------------------------------
    logger.info('Translating summary...');
    let translatedSummary = summary;
    if (detectedLanguage !== 'English' && detectedLanguage !== 'unknown') {
      try {
        const translation = (await retry(() => translate(summary, { to: 'en' }), 3, 2000)) as {
          text: string;
        };
        translatedSummary = translation.text;
      } catch (error) {
        logger.warn(
          'Translation failed after retries: ' +
            (error instanceof Error ? error.message : 'Unknown error')
        );
        // Fallback to original summary
        translatedSummary = summary;
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
    };
  } finally {
    activeRequests--;
  }
}

// ------------------------------
// 🧰 Tool Definition
// ------------------------------
export const pdfInterpreterTool = tool({
  description:
    'Advanced multilingual PDF interpreter that extracts, analyzes, and summarizes PDFs — auto-translating summaries to English.',
  args: {
    filePath: tool.schema
      .string()
      .optional()
      .describe('Path to a PDF file (optional if using buffer).'),
    buffer: tool.schema
      .any()
      .optional()
      .describe('Raw PDF data buffer (optional if using file path).'),
  },
  async execute(args: PDFToolArgs, context) {
    try {
      // Input validation: ensure exactly one of filePath or buffer is provided
      const hasFilePath = args.filePath !== undefined && args.filePath.trim() !== '';
      const hasBuffer = args.buffer !== undefined;
      if ((hasFilePath && hasBuffer) || (!hasFilePath && !hasBuffer)) {
        throw new InvalidInputError('Provide exactly one of filePath or buffer');
      }
      const input = hasBuffer ? args.buffer! : args.filePath!;
      const result = await interpretPDF(input);
      return JSON.stringify(result);
    } catch (error: unknown) {
      logger.error(
        'PDF interpretation failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
      const message = error instanceof Error ? error.message : 'Unknown error';
      return JSON.stringify({ error: message });
    }
  },
});

// ------------------------------
// 📦 Default Export
// ------------------------------
export default pdfInterpreterTool;
