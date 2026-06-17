import mongoose, { Schema, Document, model, models } from "mongoose";

export interface INote extends Document {
  roomId: string;
  content: string;
  lastEditedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true, // A room has exactly one shared note document
    },
    content: {
      type: String,
      default: "",
    },
    lastEditedBy: String,
  },
  {
    timestamps: true,
  }
);

const Note = models.Note || model<INote>("Note", NoteSchema);

export default Note;
