// api/feeding/child

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Feeding_child from "@/lib/models/feeding/feeding_child";
import Feeding_program from "@/lib/models/feeding/feeding_program";
import mongoose from "mongoose";

// Get all feeding_child entries of a feeding program (you must pass the id in search params)
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = request.nextUrl;

        const program_name = searchParams.get("program_name");

        // Better to use idFeedingProgram instead of Program name as unique identifier
        const idFeedingProgram = searchParams.get("idFeedingProgram");

        const lastname = searchParams.get("lastname");
        const firstname = searchParams.get("firstname");

        const pipeline: any[] = [];

        // Determine feeding program filter
        if (idFeedingProgram) {
            const idFeedingProgramObjId = new mongoose.Types.ObjectId(idFeedingProgram);

            pipeline.push({
                $match: { idFeedingProgram: idFeedingProgramObjId },
            });
            console.log(await Feeding_child.aggregate(pipeline));
        } else if (program_name) {
            const feeding_program = await Feeding_program.findOne({ name: program_name });
            if (!feeding_program) {
                return NextResponse.json({ error: "Feeding program not found." }, { status: 404 });
            }
            pipeline.push({
                $match: { idFeedingProgram: feeding_program._id },
            });
        }

        // Join with Member collection to access names
        pipeline.push({
            $lookup: {
                from: "members",
                localField: "idProfile",
                foreignField: "_id",
                as: "member",
            },
        });

        pipeline.push({
            $unwind: "$member",
        });

        // Filter by first name and/or last name
        if (firstname || lastname) {
            const nameMatch: any = {};

            if (firstname) {
                nameMatch["member.first_name"] = { $regex: firstname, $options: "i" };
            }
            if (lastname) {
                nameMatch["member.last_name"] = { $regex: lastname, $options: "i" };
            }

            pipeline.push({ $match: nameMatch });
        }

        // Sort by last name then first name
        pipeline.push({
            $sort: {
                "member.last_name": 1,
                "member.first_name": 1,
            },
        });

        const feeding_children = await Feeding_child.aggregate(pipeline);

        return NextResponse.json(feeding_children, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();

        const { idFeedingProgram, ...childData } = body;

        // Ensure idFeedingProgram is provided
        if (!idFeedingProgram) {
            return NextResponse.json({ error: "Missing feeding program ID" }, { status: 400 });
        }

        // Create the new feeding child
        const newChild = new Feeding_child({ ...childData, idFeedingProgram });
        await newChild.save();

        // Update the Feeding Program to include the new child in beneficiaries
        await Feeding_program.findByIdAndUpdate(
            idFeedingProgram,
            { $addToSet: { beneficiaries: newChild._id } },
            { new: true }
        );

        return NextResponse.json(newChild, { status: 201 });
    } catch (err) {
        console.error("Error adding feeding child:", err);
        return NextResponse.json({ error: "Failed to add beneficiary" }, { status: 500 });
    }
}
