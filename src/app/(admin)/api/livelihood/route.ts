import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Livelihood from "@/lib/models/business/livelihood";
import Transaction from "@/lib/models/business/transaction";

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const livelihoods = await Livelihood.find().lean();
        return NextResponse.json(livelihoods, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        let livelihood = await Livelihood.findOne({ name: data.name });

        // check if name is unique
        if (livelihood) {
            return NextResponse.json({ error: "Livelihood name already taken." }, { status: 400 });
        }

        const newLivelihood = new Livelihood(data);
        await newLivelihood.save();

        return NextResponse.json(newLivelihood, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
