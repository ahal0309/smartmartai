import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser extends mongoose.Document {
  email: string;
  passwordHash: string;
  name?: string;
  role?: 'customer' | 'owner';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
      name: { type: String },
      role: { type: String, enum: ['customer', 'owner'], default: 'customer' },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>('User', UserSchema);


