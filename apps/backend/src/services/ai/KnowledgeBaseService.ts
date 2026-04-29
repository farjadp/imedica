import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
// @ts-ignore: pdf-parse types are not properly exposed for ESM
import pdfParse from 'pdf-parse';
import Papa from 'papaparse';
import { prisma } from '../../db/clients.js';
import { env } from 'process';

const openai = new OpenAI({
  apiKey: env['OPENAI_API_KEY'] || '',
});

export type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

export class KnowledgeBaseService {
  /**
   * Processes an uploaded file (PDF, TXT, CSV), extracts text, chunks it,
   * generates embeddings, and saves it to the database.
   */
  async processFileUpload(file: UploadedFile, title: string, description?: string, uploadedById?: string) {
    let extractedText = '';
    let documentType: 'PDF' | 'TEXT' | 'CSV' = 'TEXT';

    if (file.mimetype === 'application/pdf') {
      documentType = 'PDF';
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
    } else if (file.mimetype === 'text/csv') {
      documentType = 'CSV';
      const parsed = Papa.parse(file.buffer.toString('utf-8'), { header: true });
      extractedText = parsed.data.map((row: any) => JSON.stringify(row)).join('\n');
    } else {
      // Treat as plain text
      extractedText = file.buffer.toString('utf-8');
    }

    return this.createAndEmbedDocument(title, documentType, extractedText, description, uploadedById);
  }

  /**
   * Fetches data from a HuggingFace URL (or raw URL), extracts text, chunks it,
   * generates embeddings, and saves it.
   */
  async processHuggingFaceUrl(url: string, title: string, description?: string, uploadedById?: string) {
    // For MVP, we assume the URL points to a raw JSON, CSV, or text dataset.
    // In a real scenario, we might use the HF Datasets API.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch HuggingFace dataset from URL: ${url}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    let extractedText = '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      extractedText = typeof data === 'string' ? data : JSON.stringify(data);
    } else if (contentType.includes('text/csv')) {
      const csv = await response.text();
      const parsed = Papa.parse(csv, { header: true });
      extractedText = parsed.data.map((row: any) => JSON.stringify(row)).join('\n');
    } else {
      extractedText = await response.text();
    }

    return this.createAndEmbedDocument(title, 'HF_DATASET', extractedText, description, uploadedById, url);
  }

  /**
   * Core logic to chunk text, call OpenAI for embeddings, and save to DB
   */
  private async createAndEmbedDocument(
    title: string,
    type: 'PDF' | 'TEXT' | 'CSV' | 'HF_DATASET',
    fullText: string,
    description?: string,
    uploadedById?: string,
    url?: string
  ) {
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text could be extracted from the file or URL.');
    }

    // 1. Create the Document record
    const document = await prisma.aiDocument.create({
      data: {
        title,
        description: description || null,
        type,
        url: url || null,
        uploadedById: uploadedById || null,
        status: 'PROCESSING',
      },
    });

    try {
      // 2. Chunk the text
      const chunks = this.chunkText(fullText, 1000, 200);

      // 3. Generate embeddings (Batch in smaller chunks to avoid rate limits if needed)
      // OpenAI handles up to 2048 inputs per batch for text-embedding-3-small
      const embeddingsResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunks,
      });

      // 4. Save chunks and embeddings to database using raw SQL
      // Prisma Unsupported('vector') fields must be inserted via $executeRaw
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const embedding = embeddingsResponse.data[i]?.embedding;
        if (!embedding) continue;
        const vectorString = `[${embedding.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO "content"."ai_document_chunks" ("document_id", "content", "embedding", "created_at")
          VALUES (${document.id}::uuid, ${chunkText}, ${vectorString}::vector, NOW())
        `;
      }

      // 5. Update document status to READY
      await prisma.aiDocument.update({
        where: { id: document.id },
        data: { status: 'READY' },
      });

      return document;
    } catch (error) {
      // Log error and mark as ERROR
      console.error('Error processing document embeddings:', error);
      await prisma.aiDocument.update({
        where: { id: document.id },
        data: { 
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error during embedding'
        },
      });
      throw error;
    }
  }

  /**
   * Simple chunking strategy: split by characters, preserving word boundaries.
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      let end = i + chunkSize;
      if (end < text.length) {
        // Find nearest space to avoid breaking words
        const nextSpace = text.lastIndexOf(' ', end);
        if (nextSpace > i) {
          end = nextSpace;
        }
      }
      chunks.push(text.substring(i, end).trim());
      i = end - overlap;
    }
    return chunks;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
