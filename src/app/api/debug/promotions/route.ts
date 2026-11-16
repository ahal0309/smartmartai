import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Promotion from "@/models/Promotion";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const now = new Date();
    
    // Get ALL promotions
    const allPromotions = await Promotion.find({});
    
    // Get only active promotions
    const activePromotions = await Promotion.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    return NextResponse.json({
      currentDate: now,
      totalPromotions: allPromotions.length,
      activePromotions: activePromotions.length,
      allPromotions: allPromotions.map(p => ({
        _id: p._id,
        name: p.name,
        status: p.status,
        type: p.type,
        discountValue: p.discountValue,
        startDate: p.startDate,
        endDate: p.endDate,
        applicableProducts: p.applicableProducts?.length || 0,
        applicableCategories: p.applicableCategories?.length || 0,
        isActive: p.status === 'active' && p.startDate <= now && p.endDate >= now
      })),
      activePromotionsList: activePromotions.map(p => ({
        _id: p._id,
        name: p.name,
        type: p.type,
        discountValue: p.discountValue,
        applicableProducts: p.applicableProducts,
        applicableCategories: p.applicableCategories
      }))
    });
  } catch (error: any) {
    console.error("Debug promotions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
