import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IQuiz extends Document {
  roomId: string;
  question: string;
  options: string[];
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    roomId: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

const Quiz = models.Quiz || model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
