import mongoose, { Schema, Document } from 'mongoose';

export interface ICart extends Document {
  userId: string;
  items: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    discount?: number;
  }[];
  totalAmount: number;
  appliedPromotion?: {
    promotionId: mongoose.Types.ObjectId;
    code: string;
    discount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    imageUrl: String,
    discount: {
      type: Number,
      default: 0
    }
  }],
  totalAmount: {
    type: Number,
    default: 0
  },
  appliedPromotion: {
    promotionId: Schema.Types.ObjectId,
    code: String,
    discount: Number
  }
}, {
  timestamps: true
});

// Calculate total before saving
CartSchema.pre('save', function(next) {
  let subtotal = 0;
  this.items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    const discountAmount = (itemTotal * (item.discount || 0)) / 100;
    subtotal += itemTotal - discountAmount;
  });
  
  const promotionDiscount = this.appliedPromotion?.discount || 0;
  this.totalAmount = subtotal - promotionDiscount;
  
  next();
});

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
