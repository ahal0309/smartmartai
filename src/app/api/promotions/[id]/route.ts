import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Promotion from "@/models/Promotion";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const promotion = await Promotion.findById(params.id);

    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    return NextResponse.json({ promotion });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch promotion", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const promotion = await Promotion.findByIdAndUpdate(
      params.id,
      data,
      { new: true }
    );

    if (!promotion) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update promotion", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    await Promotion.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete promotion", details: error.message },
      { status: 500 }
    );
  }
}
