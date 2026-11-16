import mongoose, { Schema, model, models } from 'mongoose';

export interface ILayoutBlock {
  id: string; // 'A'..'J'
  x: number;  // pixel center X
  y: number;  // pixel center Y
  rotation: number; // degrees: 0|90|180|270
}

export interface IStoreLayout extends mongoose.Document {
  _id: string; // singleton id, e.g., "default"
  aisleX: Record<string, number>; // mapping A..J -> x pixel center
  blocks?: ILayoutBlock[]; // optional new schema for free placement
  updatedAt: Date;
  createdAt: Date;
}

const AisleXSchema = new Schema<Record<string, number>>({}, { _id: false, strict: false });
const BlockSchema = new Schema<ILayoutBlock>({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  rotation: { type: Number, required: true, enum: [0,90,180,270], default: 0 },
}, { _id: false });

const StoreLayoutSchema = new Schema<IStoreLayout>(
  {
    _id: { type: String, default: 'default' },
    aisleX: { type: AisleXSchema, required: true },
    blocks: { type: [BlockSchema], required: false },
  },
  { timestamps: true }
);

export const StoreLayout = models.StoreLayout || model<IStoreLayout>('StoreLayout', StoreLayoutSchema);
