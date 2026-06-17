import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IRoom extends Document {
  title: string;
  subject: string;
  description?: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: String, required: true },
    members: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Room = models.Room || model<IRoom>("Room", RoomSchema);

export default Room;
