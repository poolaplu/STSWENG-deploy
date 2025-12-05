import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Feeding_program from "@/lib/models/feeding/feeding_program";
import Feeding_child from "@/lib/models/feeding/feeding_child";

// GET /api/feeding/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const program = await Feeding_program.findById(id).populate({
            path: "beneficiaries",
            populate: {
                path: "idMember", // this must match your FeedingChild schema field name
                select: "first_name last_name",
            },
        });

        if (!program) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(program, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();

    try {
        const body = await req.json();
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing feeding program ID" }, { status: 400 });
        }

        const existingFeedingProgram = await Feeding_program.findOne({ name: body.name });
        if (existingFeedingProgram && existingFeedingProgram._id.toString() !== id) {
            return NextResponse.json({ error: "Program name already taken." }, { status: 400 });
        }

        const updateData: any = {};

        // Add or remove single beneficiary
        if (body.feedingChildId && body.action === "add") {
            updateData.$addToSet = { beneficiaries: body.feedingChildId };
        } else if (body.feedingChildId && body.action === "remove") {
            updateData.$pull = { beneficiaries: body.feedingChildId };
        }

        // Add multiple beneficiaries
        if (body.feedingChildIds && Array.isArray(body.feedingChildIds)) {
            updateData.$addToSet = {
                beneficiaries: { $each: body.feedingChildIds },
            };
        }

        // Handle editable fields
        const fieldsToUpdate = ["name", "description", "date_started", "date_ended", "status", "pinned"];
        for (const field of fieldsToUpdate) {
            if (body[field] !== undefined) {
                updateData.$set = updateData.$set || {};
                updateData.$set[field] = body[field];
            }
        }

        if (body.date_ended && body.date_started > body.date_ended) {
            return NextResponse.json({ error: "Start date must be before end date." }, { status: 400 });
        }

        updateData.last_update = new Date();

        // Always update last_modified
        updateData.$set = updateData.$set || {};
        updateData.$set.last_modified = new Date().toISOString();

        const updated = await Feeding_program.findByIdAndUpdate(id, updateData, { new: true });

        if (!updated) {
            return NextResponse.json({ error: "Feeding program not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[PATCH] Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;

        const feeding_program = await Feeding_program.findById(id);
        if (!feeding_program) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const count = await Feeding_child.countDocuments({
            idFeedingProgram: feeding_program._id,
        });

        if (count === 0) {
            await Feeding_program.findByIdAndDelete(id);
            return NextResponse.json(feeding_program, { status: 200 });
        } else {
            return NextResponse.json(
                { error: "Cannot delete feeding program with children" },
                { status: 409 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            {
                error: "Failed to delete feeding program",
                detail: error.message,
            },
            { status: 500 }
        );
    }
}
