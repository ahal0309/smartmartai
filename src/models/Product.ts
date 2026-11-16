import mongoose from 'mongoose';

export interface IProduct {
  name: string;
  sku?: string;
  aisle?: string;
  category: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  inStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  lastScraped?: Date;
  source?: string; // 'manual', 'scraped', 'api'
  externalUrl?: string;
  barcode?: string;
  brand?: string;
  tags?: string[];
  stockHistory?: Array<{
    date: Date;
    oldQuantity: number;
    newQuantity: number;
    adjustment: number;
    reason: string;
  }>;
  // Advanced inventory fields
  batchNumber?: string;
  expirationDate?: Date;
  serialNumbers?: string[];
  costPrice?: number;
  supplierIds?: string[];
  reorderPoint?: number;
  reorderQuantity?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: { type: String, required: true, unique: true, index: true },
    sku: { type: String, unique: true, sparse: true },
    aisle: { type: String },
    category: { type: String, required: true, index: true },
    description: { type: String },
    price: { type: Number, min: 0, default: 0 },
    imageUrl: { type: String },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    lastScraped: { type: Date },
    source: { type: String, enum: ['manual', 'scraped', 'api'], default: 'manual' },
    externalUrl: { type: String },
    barcode: { type: String, unique: true, sparse: true },
    brand: { type: String },
    tags: [{ type: String }],
    stockHistory: [{
      date: { type: Date, default: Date.now },
      oldQuantity: Number,
      newQuantity: Number,
      adjustment: Number,
      reason: String,
    }],
    // Advanced fields
    batchNumber: { type: String },
    expirationDate: { type: Date },
    serialNumbers: [{ type: String }],
    costPrice: { type: Number, min: 0 },
    supplierIds: [{ type: String }],
    reorderPoint: { type: Number, min: 0 },
    reorderQuantity: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
  },
  { timestamps: true }
);

// Create indexes for efficient searching
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' });
ProductSchema.index({ category: 1, inStock: 1 });
ProductSchema.index({ stockQuantity: 1, lowStockThreshold: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
