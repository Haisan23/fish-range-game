// MongoDB collections (via Mongoose). A "model" describes the shape of one collection.
import mongoose, { Model, Schema } from "mongoose";

export interface IUser {
  username: string;
  usernameLower: string; // lower-case copy so "Ali" and "ali" count as the same user
  salt: string;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    usernameLower: { type: String, required: true, unique: true },
    salt: { type: String, required: true },
    hash: { type: String, required: true },
  },
  { timestamps: true }
);

export interface IScore {
  username: string;
  score: number;
  level: number;
  accuracy: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScoreSchema = new Schema<IScore>(
  {
    username: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 0 },
    level: { type: Number, required: true, min: 1 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true }
);
ScoreSchema.index({ score: -1 }); // makes "top 10" queries fast

// `mongoose.models.X ??` stops "OverwriteModelError" when Next.js hot-reloads this file.
export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", UserSchema);
export const ScoreModel: Model<IScore> =
  (mongoose.models.Score as Model<IScore> | undefined) ?? mongoose.model<IScore>("Score", ScoreSchema);