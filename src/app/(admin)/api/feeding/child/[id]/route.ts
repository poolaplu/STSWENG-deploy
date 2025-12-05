// api/feeding/child/${id}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import FeedingChild from "@/lib/models/feeding/feeding_child";
import Feeding_program from "@/lib/models/feeding/feeding_program";

// edit a feeding program child's details
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();

    try {
        const { id } = await params;
        const childId = id;
        if (!childId) {
            return NextResponse.json({ error: "Missing child ID" }, { status: 400 });
        }

        const body = await req.json();

        // Update the child document
        const updatedChild = await FeedingChild.findByIdAndUpdate(childId, body, {
            new: true,
        });

        if (!updatedChild) {
            return NextResponse.json({ error: "Child not found" }, { status: 404 });
        }

        // Find the program that has this child
        const program = await Feeding_program.findOne({ children: childId });

        if (program) {
            program.last_modified = new Date();
            await program.save();
        }

        return NextResponse.json(updatedChild);
    } catch (err) {
        console.error("Error updating child and program:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    try {
        await FeedingChild.findByIdAndDelete(id);
        return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting feeding child:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
