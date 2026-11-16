import mongoose, { Schema, Document } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string;
  leadTime?: number; // in days
  rating?: number; // 1-5
  onTimeDeliveryRate?: number; // percentage
  qualityScore?: number; // 1-5
  totalOrders: number;
  totalSpend: number;
  products: string[]; // product categories or IDs they supply
  status: "active" | "inactive";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true
    },
    email: {
      type: String,
      lowercase: true
    },
    phone: String,
    address: String,
    contactPerson: String,
    paymentTerms: {
      type: String,
      default: "Net 30"
    },
    leadTime: {
      type: Number,
      default: 7,
      min: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    onTimeDeliveryRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    qualityScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0
    },
    products: [String],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    notes: String
  },
  {
    timestamps: true
  }
);

// Indexes
SupplierSchema.index({ status: 1 });
SupplierSchema.index({ rating: -1 });

export default mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
