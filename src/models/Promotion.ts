import mongoose, { Schema, Document } from "mongoose";

export interface IPromotion extends Document {
  name: string;
  type: "percentage" | "fixed" | "bogo" | "bundle";
  discountValue: number;
  applicableProducts: string[]; // product IDs or "all"
  applicableCategories: string[];
  startDate: Date;
  endDate: Date;
  status: "active" | "scheduled" | "expired" | "disabled";
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  code?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["percentage", "fixed", "bogo", "bundle"],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    applicableProducts: [String],
    applicableCategories: [String],
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "scheduled", "expired", "disabled"],
      default: "scheduled"
    },
    minimumPurchase: {
      type: Number,
      min: 0
    },
    maximumDiscount: {
      type: Number,
      min: 0
    },
    usageLimit: Number,
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    code: {
      type: String,
      uppercase: true
    },
    description: String
  },
  {
    timestamps: true
  }
);

// Indexes
PromotionSchema.index({ status: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ code: 1 });

export default mongoose.models.Promotion || mongoose.model<IPromotion>("Promotion", PromotionSchema);
