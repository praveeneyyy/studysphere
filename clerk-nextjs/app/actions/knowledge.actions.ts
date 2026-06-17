"use server";

import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { connectDB } from "@/lib/mongodb";
import KnowledgeChunk from "@/models/KnowledgeChunk";

// Helper to get embedding model dynamically
function getEmbeddingModel() {
  if (process.env.OPENAI_API_KEY) {
    return {
      model: openai.embedding("text-embedding-3-small"),
      name: "text-embedding-3-small",
    };
  } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    if (process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
    }
    return {
      model: google.textEmbeddingModel("text-embedding-004"),
      name: "text-embedding-004",
    };
  } else {
    throw new Error("No AI API key configured for embedding model.");
  }
}

// Helper to clean HTML and split into logical paragraph chunks
function cleanHtmlToParagraphs(html: string): string[] {
  if (!html) return [];
  // Insert newlines for paragraph and break tags
  let text = html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "\n- ");
  // Strip all other HTML tags
  text = text.replace(/<[^>]*>/g, " ");
  // Unescape HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  
  // Split by double newlines, clean white space, filter short chunks
  return text
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 15);
}

// Ingest shared note content
export async function ingestNote(roomId: string, content: string) {
  try {
    await connectDB();
    const chunks = cleanHtmlToParagraphs(content);
    
    // Clear old note chunks for this room
    await KnowledgeChunk.deleteMany({ roomId, sourceType: "note" });
    
    if (chunks.length === 0) {
      console.log(`[RAG Ingestion] Room ${roomId} note is empty. Stored chunks cleared.`);
      return;
    }

    console.log(`[RAG Ingestion] Ingesting note for room ${roomId}: ${chunks.length} chunks.`);

    const { model, name: modelName } = getEmbeddingModel();
    const { embeddings } = await embedMany({
      model,
      values: chunks,
    });

    const chunkDocs = chunks.map((chunk, idx) => ({
      roomId,
      sourceType: "note",
      sourceId: `note-${roomId}-${idx}-${Date.now()}`,
      content: chunk,
      embedding: embeddings[idx],
      embeddingModel: modelName,
    }));

    await KnowledgeChunk.insertMany(chunkDocs);
    console.log(`[RAG Ingestion] Ingested note chunks successfully.`);
  } catch (err: any) {
    console.error("[RAG Ingestion] Error ingesting notes:", err.message);
  }
}

// Ingest generated flashcards
export async function ingestFlashcards(roomId: string, flashcards: any[]) {
  try {
    await connectDB();
    
    // Clear old flashcard chunks for this room
    await KnowledgeChunk.deleteMany({ roomId, sourceType: "flashcard" });

    if (!flashcards || flashcards.length === 0) {
      return;
    }

    console.log(`[RAG Ingestion] Ingesting ${flashcards.length} flashcards for room ${roomId}.`);

    const formattedCards = flashcards.map(
      (fc) => `Flashcard Question: ${fc.question} | Flashcard Answer: ${fc.answer}`
    );

    const { model, name: modelName } = getEmbeddingModel();
    const { embeddings } = await embedMany({
      model,
      values: formattedCards,
    });

    const chunkDocs = flashcards.map((fc, idx) => ({
      roomId,
      sourceType: "flashcard",
      sourceId: fc._id ? fc._id.toString() : `fc-${roomId}-${idx}-${Date.now()}`,
      content: formattedCards[idx],
      embedding: embeddings[idx],
      embeddingModel: modelName,
    }));

    await KnowledgeChunk.insertMany(chunkDocs);
    console.log(`[RAG Ingestion] Ingested flashcard chunks successfully.`);
  } catch (err: any) {
    console.error("[RAG Ingestion] Error ingesting flashcards:", err.message);
  }
}

// Ingest generated quizzes
export async function ingestQuiz(roomId: string, quizzes: any[]) {
  try {
    await connectDB();

    // Clear old quiz chunks for this room
    await KnowledgeChunk.deleteMany({ roomId, sourceType: "quiz" });

    if (!quizzes || quizzes.length === 0) {
      return;
    }

    console.log(`[RAG Ingestion] Ingesting ${quizzes.length} quiz questions for room ${roomId}.`);

    const formattedQuizzes = quizzes.map(
      (q) => `Quiz Question: ${q.question} | Options: ${q.options?.join(", ") || ""} | Correct Answer: ${q.answer}`
    );

    const { model, name: modelName } = getEmbeddingModel();
    const { embeddings } = await embedMany({
      model,
      values: formattedQuizzes,
    });

    const chunkDocs = quizzes.map((q, idx) => ({
      roomId,
      sourceType: "quiz",
      sourceId: q._id ? q._id.toString() : `q-${roomId}-${idx}-${Date.now()}`,
      content: formattedQuizzes[idx],
      embedding: embeddings[idx],
      embeddingModel: modelName,
    }));

    await KnowledgeChunk.insertMany(chunkDocs);
    console.log(`[RAG Ingestion] Ingested quiz chunks successfully.`);
  } catch (err: any) {
    console.error("[RAG Ingestion] Error ingesting quizzes:", err.message);
  }
}

// Cosine similarity calculations
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(a: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * a[i];
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// Search knowledge chunks for a room
export async function searchKnowledge(roomId: string, query: string, threshold = 0.70) {
  try {
    await connectDB();
    const { model, name: modelName } = getEmbeddingModel();
    
    // Generate query embedding
    const { embedding } = await embed({
      model,
      value: query,
    });

    // Retrieve all chunks for the room that share the same embedding model type
    const chunks = await KnowledgeChunk.find({ roomId, embeddingModel: modelName }).lean();
    if (chunks.length === 0) {
      return [];
    }

    // Calculate score for each chunk
    const results = chunks.map((chunk: any) => {
      const score = cosineSimilarity(embedding, chunk.embedding);
      return {
        content: chunk.content,
        sourceType: chunk.sourceType,
        score,
      };
    });

    // Filter by similarity threshold, sort descending, and return top 5
    const filteredResults = results
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return filteredResults;
  } catch (err: any) {
    console.error("[RAG Retrieval] Error searching knowledge base:", err.message);
    return [];
  }
}
