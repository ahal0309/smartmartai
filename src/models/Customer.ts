import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  totalSpent: number;
  segment: "vip" | "regular" | "new";
  lastVisit?: Date;
  averageOrderValue: number;
  preferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      lowercase: true
    },
    phone: String,
    address: String,
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    segment: {
      type: String,
      enum: ["vip", "regular", "new"],
      default: "new"
    },
    lastVisit: Date,
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    preferences: [String]
  },
  {
    timestamps: true
  }
);

// Indexes
CustomerSchema.index({ segment: 1 });
CustomerSchema.index({ lastVisit: -1 });
CustomerSchema.index({ totalSpent: -1 });

export default mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
