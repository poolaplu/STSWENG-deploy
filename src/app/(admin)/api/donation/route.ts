import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Donation from "@/lib/models/donations/donation";

export async function GET() {
    await dbConnect();

    try {
        const donations = await Donation.find().sort({ date: -1 }).lean();
        return NextResponse.json(donations);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const newDonation = new Donation(data);

        if (!(typeof newDonation.contact_no === "number")) {
            return NextResponse.json(
                { message: "Invalid contact number" },
                { status: 400 }
            );
        }

        if (data.value < 0) {
            console.warn("Validation failed: donated value cannot be negative");
            return NextResponse.json({ message: "Invalid donation value" }, { status: 400 });
        }

        // ensure the contact number starts with 09 and is followed by 9 digits
        if (typeof data.contact_no === "string") {
            const digits = data.contact_no.replace(/\D/g, "");

            if (/^09\d{9}$/.test(digits)) {
                data.contact_no = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
            } else if (digits.length > 0) {
                console.warn("Validation failed: invalid contact number");
                return NextResponse.json({ message: "Invalid contact number" }, { status: 400 });
            }
        }
        await newDonation.save();

        return NextResponse.json(newDonation, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to create donation: " + error.message }, { status: 500 });
    }
}
