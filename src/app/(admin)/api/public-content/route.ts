import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import PublicSiteContent from "@/lib/models/settings/public_site_content"; 
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await dbConnect();
    let content = await PublicSiteContent.findOne();

    if (!content) {
      content = await PublicSiteContent.create({
        about: { mission: "", vision: "", history: "" },
        impact: { mainTitle: "What We Do", mainDescription: "Our programs..." },
        donate: { gcashNumber: "", bankDetails: "", otherDetails: "" },
        footer: { description: "", email: "", phone: "", address: "" }
      });
    }
    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const updatedContent = await PublicSiteContent.findOneAndUpdate(
      {}, 
      body, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    revalidatePath("/", "layout");
    revalidatePath("/about");
    revalidatePath("/impact");
    revalidatePath("/donate");
    
    return NextResponse.json(updatedContent, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}