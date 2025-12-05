import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import BlogModel from "@/lib/models/blogs/blog";

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const blog = await BlogModel.findById(params.id);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("GET /api/blogs/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const body = await req.json();

    const updatedBlog = await BlogModel.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );

    if (!updatedBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error("PUT /api/blog/[id] error:", error);
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const deleted = await BlogModel.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/blog/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
