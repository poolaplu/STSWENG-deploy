import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD!,
  api_key: process.env.CLOUDINARY_KEY!,
  api_secret: process.env.CLOUDINARY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "blog_images" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({ url: (uploadResult as any).secure_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
