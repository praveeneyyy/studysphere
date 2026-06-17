import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
