import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import BlogModel from "@/lib/models/blogs/blog";

export async function GET() {
  try {
    await dbConnect();
    const blogs = await BlogModel.find().sort({ date_created: -1 });
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("GET /api/blog error:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body?.title || !body?.content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newBlog = await BlogModel.create({
      ...body,
      date_created: new Date().toISOString(),
    });

    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    console.error("POST /api/blog error:", error);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
