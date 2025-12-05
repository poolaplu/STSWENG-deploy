import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Intervention from "@/lib/models/interventions/intervention";
import Transaction from "@/lib/models/business/transaction";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();

    const { id } = await params;
    try {
        const intervention = await Intervention.findById(id).lean();
        if (!intervention) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json(intervention);
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();

    try {
        const body = await req.json();
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing intervention ID" }, { status: 400 });
        }

        const existing = await Intervention.findOne({ name: body.name });
        if (existing && existing._id.toString() !== id) {
            return NextResponse.json({ error: "Intervention name already exists." }, { status: 400 });
        }

        const updateData: any = {};

        // ✅ Create and link a transaction (if present)
        if (body.transaction) {
            if (body.transaction.price < 0) {
                return NextResponse.json({ error: "Price cannot be negative." }, { status: 400 });
            }

            if (body.transaction.quantity < 0) {
                return NextResponse.json({ error: "Quantity cannot be negative." }, { status: 400 });
            }

            const newTransaction = new Transaction(body.transaction);
            await newTransaction.save();

            updateData.$push = { expenditures: newTransaction._id };
        }

        // ✅ Add beneficiaries: member, household, or cluster
        if (body.addMemberId) {
            updateData.$addToSet = {
                ...(updateData.$addToSet || {}),
                beneficiaries_member: body.addMemberId,
            };
        }

        if (body.addHouseholdId) {
            updateData.$addToSet = {
                ...(updateData.$addToSet || {}),
                beneficiaries_household: body.addHouseholdId,
            };
        }

        if (body.addClusterId) {
            updateData.$addToSet = {
                ...(updateData.$addToSet || {}),
                beneficiaries_cluster: body.addClusterId,
            };
        }

        // ✅ Remove beneficiaries: member, household, or cluster
        if (body.removeMemberId) {
            updateData.$pull = {
                ...(updateData.$pull || {}),
                beneficiaries_member: body.removeMemberId,
            };
        }

        if (body.removeHouseholdId) {
            updateData.$pull = {
                ...(updateData.$pull || {}),
                beneficiaries_household: body.removeHouseholdId,
            };
        }

        if (body.removeClusterName) {
            updateData.$pull = {
                ...(updateData.$pull || {}),
                beneficiaries_cluster: body.removeClusterName,
            };
        }

        // ✅ Handle editable fields
        const editableFields = ["name", "description", "date", "type", "pinned", "sensitive"];
        for (const field of editableFields) {
            if (body[field] !== undefined) {
                updateData.$set = updateData.$set || {};
                updateData.$set[field] = body[field];
            }
        }

        // ✅ Always update last_modified
        updateData.$set = updateData.$set || {};
        updateData.$set.last_modified = new Date().toISOString();

        const updated = await Intervention.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).lean();

        if (!updated) {
            return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[PATCH] Error updating intervention:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE an intervention by ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const { id } = await params;
        const deleted = await Intervention.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("DELETE /api/intervention/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete intervention" }, { status: 500 });
    }
}
