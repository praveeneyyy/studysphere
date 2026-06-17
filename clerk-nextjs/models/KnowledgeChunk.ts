import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IKnowledgeChunk extends Document {
  roomId: string;
  sourceType: "note" | "chat" | "flashcard" | "quiz";
  sourceId: string;
  content: string;
  embedding: number[];
  embeddingModel: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    roomId: { type: String, required: true, index: true },
    sourceType: { type: String, required: true, enum: ["note", "chat", "flashcard", "quiz"] },
    sourceId: { type: String, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    embeddingModel: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes for cleanup and fast lookup
KnowledgeChunkSchema.index({ roomId: 1, sourceType: 1 });
KnowledgeChunkSchema.index({ sourceType: 1, sourceId: 1 });

const KnowledgeChunk =
  models.KnowledgeChunk || model<IKnowledgeChunk>("KnowledgeChunk", KnowledgeChunkSchema);

export default KnowledgeChunk;
