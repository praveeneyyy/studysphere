import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IStudySession extends Document {
  userId: string;
  roomId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: String, required: true },
    roomId: { type: String, required: true },
    startTime: { type: Date, default: Date.now, required: true },
    endTime: { type: Date },
    duration: { type: Number },
  },
  { timestamps: true }
);

const StudySession =
  models.StudySession ||
  model<IStudySession>("StudySession", StudySessionSchema);

export default StudySession;
