import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getStaffCollection, getStaffPhotoBucket, isStaffCategory, serializeStaff, validId } from "@/lib/staff";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid staff ID." }, { status: 400 });
    const body = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
      update.name = body.name.trim();
    }
    if (body.designation !== undefined) {
      if (typeof body.designation !== "string" || !body.designation.trim()) return NextResponse.json({ error: "Designation is required." }, { status: 400 });
      update.designation = body.designation.trim();
    }
    if (body.subject !== undefined) update.subject = typeof body.subject === "string" ? body.subject.trim() : "";
    if (body.category !== undefined) {
      if (!isStaffCategory(body.category)) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
      update.category = body.category;
    }
    if (body.photoId !== undefined) {
      if (body.photoId && !validId(String(body.photoId))) return NextResponse.json({ error: "Invalid photo ID." }, { status: 400 });
      update.photoId = body.photoId || null;
    }
    if (body.published !== undefined) update.published = body.published === true;
    if (body.sortOrder !== undefined) {
      const order = Number(body.sortOrder);
      if (!Number.isFinite(order)) return NextResponse.json({ error: "Sort order must be a number." }, { status: 400 });
      update.sortOrder = order;
    }

    const collection = await getStaffCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" },
    );
    if (!result) return NextResponse.json({ error: "Staff record not found." }, { status: 404 });
    const doc = (result as any).value ?? result;
    if (!doc?._id) return NextResponse.json({ error: "Staff record not found." }, { status: 404 });
    return NextResponse.json({ staff: serializeStaff(doc as Record<string, unknown>) });
  } catch (error) {
    console.error("PATCH /api/staff/[id]:", error);
    return NextResponse.json({ error: "Unable to update staff record." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid staff ID." }, { status: 400 });

    const collection = await getStaffCollection();
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Staff record not found." }, { status: 404 });

    await collection.deleteOne({ _id: new ObjectId(id) });

    if (existing.photoId) {
      const photoId = existing.photoId instanceof ObjectId ? existing.photoId : new ObjectId(String(existing.photoId));
      const stillUsed = await collection.countDocuments({ photoId });
      if (stillUsed === 0) {
        try {
          const bucket = await getStaffPhotoBucket();
          await bucket.delete(photoId);
        } catch (error) {
          console.warn("Could not delete unused staff photo from GridFS:", error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/staff/[id]:", error);
    return NextResponse.json({ error: "Unable to delete staff record." }, { status: 500 });
  }
}
