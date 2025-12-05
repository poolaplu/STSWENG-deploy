import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Household from "@/lib/models/households/household";
import Member from "@/lib/models/households/member";

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const households = await Household.find()
            .populate("members", "first_name last_name sex age")
            .populate("head", "first_name last_name sex age")
            .lean();

        return new NextResponse(JSON.stringify(households), { status: 200 });
    } catch (error: any) {
        console.error("Error in GET /api/household:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const data = await request.json();

        // If head is blank, set it to undefined
        if (data.head === "") {
            data.head = undefined;
        }

        // Validate date
        if (!data.hoa_last_reached_out) {
            console.log("Date last reached out cannot be left blank.")
            return NextResponse.json(
                { error: "Date last reached out cannot be left blank." },
                { status: 400 }
            );
        }

        if (
            data.hoa_last_reached_out &&
            new Date(data.hoa_last_reached_out).toISOString().slice(0, 10) >
            new Date().toISOString().slice(0, 10)
        ) {
            return NextResponse.json(
                { error: 'Date last reached out cannot be in the future.' },
                { status: 400 }
            );
        }

        // Check duplicate name
        const existingHousehold = await Household.findOne({ name: data.name });
        if (existingHousehold) {
            return NextResponse.json({ error: "Household name already taken." }, { status: 400 });
        }
        // Create and save household
        const newHousehold = new Household(data);
        await newHousehold.save();

        // Link head member if provided
        if (data.head) {
            await Member.findByIdAndUpdate(data.head, {
                household: newHousehold._id,
            });
        }

        // Populate head before returning
        const populatedHousehold = await Household.findById(newHousehold._id).populate("head");

        return NextResponse.json(populatedHousehold.toObject(), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
