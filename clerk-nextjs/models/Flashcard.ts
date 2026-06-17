import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IFlashcard extends Document {
  userId: string;
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    userId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

const Flashcard = models.Flashcard || model<IFlashcard>("Flashcard", FlashcardSchema);

export default Flashcard;
