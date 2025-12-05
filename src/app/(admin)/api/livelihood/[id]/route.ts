import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Livelihood from "@/lib/models/business/livelihood";
import Transaction from "@/lib/models/business/transaction";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;

        const livelihood = await Livelihood.findById(id);

        if (!livelihood) return new NextResponse(null, { status: 404 });

        await Livelihood.findByIdAndDelete(id);
        return NextResponse.json({ message: "Livelihood deleted successfully" });
    } catch (error) {
        console.error("Error deleting livelihood:", error);
        return NextResponse.error();
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const data = await req.json();
        const update: Record<string, any> = { ...data };

        let livelihood = await Livelihood.findById(id);
        if (!livelihood) return new NextResponse(null, { status: 404 });

        // If name will change, check if name is unique
        if (data.name !== livelihood.name) {
            const existingLivelihood = await Livelihood.findOne({ name: data.name });
            if (existingLivelihood) {
                return NextResponse.json({ error: "Livelihood name already taken." }, { status: 400 });
            }
        }

        livelihood = await Livelihood.findByIdAndUpdate(id, update, { new: true });
        return NextResponse.json(livelihood, { status: 200 });
    } catch (error) {
        console.error("Error updating livelihood:", error);
        return NextResponse.error();
    }
}
