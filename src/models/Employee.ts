import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  role: "manager" | "cashier" | "stocker" | "security";
  status: "active" | "inactive";
  hireDate: Date;
  salary?: number;
  shifts: Array<{
    date: Date;
    startTime: string;
    endTime: string;
    hoursWorked: number;
  }>;
  performance: {
    salesCount?: number;
    totalSales?: number;
    customerRating?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    employeeId: {
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
      required: true,
      unique: true,
      lowercase: true
    },
    phone: String,
    role: {
      type: String,
      enum: ["manager", "cashier", "stocker", "security"],
      required: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    hireDate: {
      type: Date,
      default: Date.now
    },
    salary: {
      type: Number,
      min: 0
    },
    shifts: [{
      date: Date,
      startTime: String,
      endTime: String,
      hoursWorked: {
        type: Number,
        default: 0
      }
    }],
    performance: {
      salesCount: {
        type: Number,
        default: 0
      },
      totalSales: {
        type: Number,
        default: 0
      },
      customerRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
EmployeeSchema.index({ role: 1, status: 1 });

export default mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);
