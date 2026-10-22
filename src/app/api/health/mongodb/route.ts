
import { NextResponse } from "next/server";
import { connectDB } from "../../../../../database/mongodb";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully",
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed. Check your terminal.",
      },
      { status: 500 },
    );
  }
}
