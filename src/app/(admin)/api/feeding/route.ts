// api/feeding/

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Feeding_program from "@/lib/models/feeding/feeding_program";
import mongoose from "mongoose";

import "@/lib/models/households/member";

import "@/lib/models/feeding/feeding_child";

export async function GET() {
    try {
        await dbConnect();

        const feeding_programs = await Feeding_program.find().populate({
            path: "beneficiaries",
            populate: {
                path: "idMember",
                select: "first_name last_name",
            },
        });

        return NextResponse.json(feeding_programs, { status: 200 });
    } catch (error: any) {
        console.error("POPULATE ERROR", error); // full error object
        return NextResponse.json({ error: error.stack || error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const newFeedingProgram = new Feeding_program(data);
        if (data.date_ended && data.date_started > data.date_ended) {
            return NextResponse.json({ error: "Start date must be before end date." }, { status: 400 });
        }

        const existingFeedingProgram = await Feeding_program.findOne({ name: data.name }).lean();
        if (existingFeedingProgram) {
            return NextResponse.json({ error: "Program name already taken." }, { status: 400 });
        }

        await newFeedingProgram.save();

        return NextResponse.json(newFeedingProgram.toObject(), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
