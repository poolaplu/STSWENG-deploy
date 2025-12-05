import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Intervention from "@/lib/models/interventions/intervention";

export async function GET() {
    try {
        await dbConnect();
        const interventions = await Intervention.find().lean();

        return NextResponse.json(interventions, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        if (data.type === "") {
            return NextResponse.json({ error: "No intervention type selected." }, { status: 400 });
        }

        const existing = await Intervention.findOne({ name: data.name }).lean();
        if (existing) {
            return NextResponse.json({ error: "Intervention name already exists." }, { status: 400 });
        }

        const newIntervention = new Intervention(data);
        await newIntervention.save();

        return NextResponse.json(newIntervention.toObject(), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
