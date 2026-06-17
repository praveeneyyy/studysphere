import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IQuizAttempt extends Document {
  userId: string;
  roomId: string;
  score: number;
  totalQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: String, required: true },
    roomId: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
  },
  { timestamps: true }
);

const QuizAttempt =
  models.QuizAttempt ||
  model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);

export default QuizAttempt;
