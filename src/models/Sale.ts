import mongoose, { Schema, Document } from "mongoose";

export interface ISale extends Document {
  customerId?: string;
  customerName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "upi" | "wallet";
  status: "completed" | "pending" | "cancelled";
  employeeId?: string;
  employeeName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema: Schema = new Schema(
  {
    customerId: {
      type: String,
      index: true
    },
    customerName: String,
    items: [{
      productId: {
        type: String,
        required: true
      },
      productName: String,
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      default: "cash"
    },
    status: {
      type: String,
      enum: ["completed", "pending", "cancelled"],
      default: "completed"
    },
    employeeId: String,
    employeeName: String,
    notes: String
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ customerId: 1, createdAt: -1 });

export default mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
