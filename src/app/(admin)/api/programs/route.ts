import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import ProgramModel from "@/lib/models/programs/program";

// GET: Fetch all programs (Newest first)
export async function GET() {
  try {
    await dbConnect();
    const programs = await ProgramModel.find().sort({ date_created: -1 });
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

// POST: Create a new program
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const newProgram = await ProgramModel.create({
      ...body,
      date_created: new Date().toISOString() 
    });
    
    return NextResponse.json(newProgram, { status: 201 });
  } catch (error) {
    console.error("Create error:", error);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}