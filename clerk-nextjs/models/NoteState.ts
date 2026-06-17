import mongoose, { Schema, Document, model, models } from "mongoose";

export interface INoteState extends Document {
  roomId: string;
  state: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const NoteStateSchema = new Schema<INoteState>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    state: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const NoteState = models.NoteState || model<INoteState>("NoteState", NoteStateSchema);

export default NoteState;
