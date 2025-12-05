import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Household from "@/lib/models/households/household";
import Member from "@/lib/models/households/member";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const data = await req.json();
        // make head null of blank was given
        if (data.head === "") {
            data.head = null;
        }

        console.log(data);
        const update: Record<string, any> = { ...data };

        if (data.cluster === "") {
            return NextResponse.json({ error: " Cluster is a required field." }, { status: 400 });
        }
        if (data.name === "") {
            return NextResponse.json({ error: " Household name is a required field." }, { status: 400 });
        }
        if (data.hoa_status === "") {
            return NextResponse.json({ error: " Household status is a required field." }, { status: 400 });
        }
        if (data.ownership === "") {
            return NextResponse.json({ error: " Ownership status is a required field." }, { status: 400 });
        }

        let household = await Household.findById(id);

        if (!household) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // date must be given
        if (!data.hoa_last_reached_out)
            return NextResponse.json(
                { error: "Date last reached out cannot be left blank." },
                { status: 400 }
            );

        // date must be given and cannot be in the future
        if (
            data.hoa_last_reached_out &&
            new Date(data.hoa_last_reached_out).toISOString().slice(0, 10) >
                new Date().toISOString().slice(0, 10)
        ) {
            return NextResponse.json(
                { error: "Date last reached out cannot be in the future." },
                { status: 400 }
            );
        }

        // if name will change, check if name is unique
        if (data.name != household.name) {
            // if another household of the same name already exists, give an error
            const household_2 = await Household.findOne({ name: data.name });
            if (household_2)
                return NextResponse.json({ error: " Household name already taken." }, { status: 400 });
        }

        await Member.findByIdAndUpdate(data.head, { household: data._id });

        household = await Household.findByIdAndUpdate(id, update, { new: true });

        return NextResponse.json(household, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// delete a household - it only works when it has no more members
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        // const data = await req.json();

        const { id } = await params;

        const household = await Household.findById(id);

        if (!household) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // household can only be deleted if there are no more members
        if (household.members.length === 0) {
            await Household.findByIdAndDelete(id);
            return NextResponse.json(household, { status: 200 });
        } else {
            return NextResponse.json(
                { error: "Cannot delete household with existing members" },
                { status: 409 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to delete household", detail: (error as Error).message },
            { status: 500 }
        );
    }
}
