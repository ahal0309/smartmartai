import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "pending" | "approved" | "ordered" | "received" | "cancelled";
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  receivedBy?: string;
  notes?: string;
  paymentTerms?: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema: Schema = new Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    supplierId: {
      type: String,
      required: true,
      index: true
    },
    supplierName: {
      type: String,
      required: true
    },
    items: [{
      productId: String,
      productName: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },
      totalPrice: {
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
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "ordered", "received", "cancelled"],
      default: "draft"
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    receivedBy: String,
    notes: String,
    paymentTerms: String,
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid"
    }
  },
  {
    timestamps: true
  }
);

// Indexes
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ orderDate: -1 });

export default mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
