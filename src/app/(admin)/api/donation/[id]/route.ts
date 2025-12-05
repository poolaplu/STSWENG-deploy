import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongoose";
import Donation from "@/lib/models/donations/donation";

export async function PATCH(
  request: Request,
  {params}: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const id = (await params).id
    const data = await request.json();

    const requiredFields = ["type", "description", "amount", "date_added", "donor_name"];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const updatedDonation = await Donation.findByIdAndUpdate(id, data, { new: true });

    if (!updatedDonation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDonation.toObject(), { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update donation: " + err.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  {params}: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const id = (await params).id
  try {
    const deleted = await Donation.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Donation deleted" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}