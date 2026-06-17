import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IStudyPlanTask {
  day: string;
  activities: string[];
}

export interface IStudyPlan extends Document {
  userId: string;
  week: string; // e.g. "2026-06-15" (Monday start of the week)
  coachRecommendations: string;
  predictedImprovement: string;
  tasks: IStudyPlanTask[];
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: { type: String, required: true, index: true },
    week: { type: String, required: true },
    coachRecommendations: { type: String, default: "" },
    predictedImprovement: { type: String, default: "" },
    tasks: [
      {
        day: { type: String, required: true },
        activities: { type: [String], required: true },
      },
    ],
  },
  { timestamps: true }
);

// Ensure a user only has one study plan per week
StudyPlanSchema.index({ userId: 1, week: 1 }, { unique: true });

const StudyPlan =
  models.StudyPlan || model<IStudyPlan>("StudyPlan", StudyPlanSchema);

export default StudyPlan;
