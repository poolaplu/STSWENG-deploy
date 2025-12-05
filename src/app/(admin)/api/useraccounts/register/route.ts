import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import UserAccount, { UserAccountType } from "@/lib/models/useraccounts/user";
import dbConnect from "@/lib/mongoose";

export async function POST(req: NextRequest) {
    const { username, password, role, passphrase } = await req.json();

    if (!username || !password || !role || !passphrase) {
        return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const registrationSecretHash = process.env.REGISTRATION_SECRET_HASH;

    if (!registrationSecretHash) {
        return NextResponse.json(
            { error: "Server misconfiguration. Registration hash missing." },
            { status: 500 }
        );
    }

    console.log(">>> Passphrase received:", JSON.stringify(passphrase));
    console.log(">>> REGISTRATION_SECRET_HASH:", JSON.stringify(process.env.REGISTRATION_SECRET_HASH));


    const isPassphraseValid = await bcrypt.compare(passphrase, registrationSecretHash);
    if (!isPassphraseValid) {
        return NextResponse.json({ error: "Invalid registration passphrase." }, { status: 403 });
    }

    await dbConnect();

    const existing = await UserAccount.findOne({ username });
    if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserAccount.create({
        username,
        password: hashedPassword,
        role: role as UserAccountType,
    });

    return NextResponse.json(
        {
            _id: user._id,
            username: user.username,
            role: user.role,
        },
        { status: 201 }
    );
}
