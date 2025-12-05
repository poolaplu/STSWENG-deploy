import Member from "@/lib/models/households/member";
import Household from "@/lib/models/households/household";
import dbConnect from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";

// fetch all
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const members = await Member.find()
            .populate("partner", "first_name last_name")
            .populate("guardians", "first_name last_name")
            .populate("household", "name")
            .lean();

        return new NextResponse(JSON.stringify(members), { status: 200 });
    } catch (error: any) {
        console.error("Error in GET /api/members:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// create one
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const data = await request.json();

        if (!data.first_name || !data.last_name) {
            console.warn("Validation failed: first_name or last_name missing");
            return NextResponse.json({ message: "First name and last name are required" }, { status: 400 });
        }

        if (data.sex === "") {
            console.warn("Validation failed: sex missing");
            return NextResponse.json({ message: "Sex is required" }, { status: 400 });
        }

        if (!data.birthdate) {
            return NextResponse.json({ message: "Birthdate is required" }, { status: 400 });
        }

        if (new Date(data.birthdate) > new Date()) {
            return NextResponse.json({ message: "Birthdate cannot be in the future" }, { status: 400 });
        }

        if (data.weight !== undefined && data.weight !== null && data.weight !== "") {
            data.weight = Number(data.weight);
            if (isNaN(data.weight) || data.weight <= 0) {
                console.warn("Validation failed: weight must be a positive number");
                return NextResponse.json({ message: "Weight must be a positive number" }, { status: 400 });
            }
        }

        if (typeof data.contact_number === "string") {
            const digits = data.contact_number.replace(/\D/g, "");

            if (/^09\d{9}$/.test(digits)) {
                data.contact_number = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
            } else if (digits.length > 0) {
                console.warn("Validation failed: invalid contact number");
                return NextResponse.json({ message: "Invalid contact number" }, { status: 400 });
            }
        }

        if (!data.household) {
            data.household = undefined;
        }

        if (data.guardians.length > 2) {
            console.warn("Validation failed: too many guardians");
            return NextResponse.json(
                { message: "A member can have a maximum of 2 guardians" },
                { status: 400 }
            );
        }

        if (data.marital_status === "") {
            console.warn("Validation failed: Marital status missing");
            return NextResponse.json({ message: "Marital status is required" }, { status: 400 });
        }

        if (data.occupation === "") {
            data.occupation = "Unemployed";
        }

        if (data.partner === "") {
            data.partner = undefined;
        }

        const partnerExists = data.partner ? await Member.findById(data.partner) : null;
        if (partnerExists && partnerExists.partner) {
            console.warn("Validation failed: partner already has a partner");
            return NextResponse.json(
                { message: "The selected partner already has a partner" },
                { status: 400 }
            );
        }

        const newMember = new Member(data);
        await newMember.save();

        if (data.partner) {
            // if partner is provided, update the partner field of the member
            const partner = await Member.findById(data.partner);
            if (!partner) {
                return NextResponse.json({ message: "Partner not found" }, { status: 404 });
            }
            partner.partner = newMember._id;
            await partner.save();
        }

        if (newMember.household) {
            await Household.findByIdAndUpdate(newMember.household, {
                $addToSet: { members: newMember._id },
            });
        }

        return new NextResponse(JSON.stringify(newMember), { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/members:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
