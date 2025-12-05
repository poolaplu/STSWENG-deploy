import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import ProgramModel from "@/lib/models/programs/program";

// GET: Fetch Single Program
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const program = await ProgramModel.findById(params.id);
    if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(program);
  } catch (error) {
    return NextResponse.json({ error: "Fetch error" }, { status: 500 });
  }
}

// PUT: Update Program
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const updatedProgram = await ProgramModel.findByIdAndUpdate(
      params.id, 
      body, 
      { new: true }
    );

    if (!updatedProgram) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updatedProgram);
  } catch (error) {
    return NextResponse.json({ error: "Update error" }, { status: 500 });
  }
}

// DELETE: Remove Program
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const deleted = await ProgramModel.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Delete error" }, { status: 500 });
  }
}