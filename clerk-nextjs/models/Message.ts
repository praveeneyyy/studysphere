import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IMessage extends Document {
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    roomId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = models.Message || model<IMessage>("Message", MessageSchema);

export default Message;
