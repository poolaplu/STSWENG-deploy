import dbConnect from "@/lib/mongoose";
import Household from "@/lib/models/households/household";
import { NextRequest, NextResponse } from "next/server";
import { Member } from "@/types/members";
import MemberModel from "@/lib/models/households/member";
import Feeding_child from "@/lib/models/feeding/feeding_child";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const data = await req.json();

        // Basic Validations
        if (!data.first_name || !data.last_name) {
            return NextResponse.json({ message: "First name and last name are required" }, { status: 400 });
        }

        if (data.sex === "") {
            return NextResponse.json({ message: "Sex is required" }, { status: 400 });
        }

        if (!data.birthdate) {
            return NextResponse.json({ message: "Birthdate is required" }, { status: 400 });
        }

        if (new Date(data.birthdate) > new Date()) {
            return NextResponse.json({ message: "Birthdate cannot be in the future" }, { status: 400 });
        }

        if (data.weight !== undefined && data.weight !== null && data.weight !== "") {
            const weight = Number(data.weight);
            if (isNaN(weight) || weight <= 0) {
                return NextResponse.json({ message: "Weight must be a positive number" }, { status: 400 });
            }
            data.weight = weight;
        }

        // Format contact number if valid
        if (typeof data.contact_number === "string") {
            const digits = data.contact_number.replace(/\D/g, "");
            if (/^09\d{9}$/.test(digits)) {
                data.contact_number = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
            } else if (digits.length > 0) {
                return NextResponse.json({ message: "Invalid contact number" }, { status: 400 });
            }
        }

        if (data.guardians.length > 2) {
            return NextResponse.json(
                { message: "A member can have a maximum of 2 guardians" },
                { status: 400 }
            );
        }

        if (data.marital_status === "") {
            return NextResponse.json({ message: "Marital status is required" }, { status: 400 });
        }

        // Normalize occupation
        if (data.occupation === "") {
            data.occupation = "Unemployed";
        }

        // Normalize partner field
        if (data.partner === "") {
            data.partner = undefined;
        } else if (typeof data.partner === "object" && data.partner !== null) {
            data.partner = data.partner._id;
        }

        // Get original member
        const original_member = await MemberModel.findById(id);
        if (!original_member) {
            return NextResponse.json({ message: "Member not found." }, { status: 404 });
        }

        // Partner validation
        const partnerMember = data.partner ? await MemberModel.findById(data.partner) : null;
        if (
            partnerMember &&
            partnerMember.partner &&
            (!original_member.partner || !partnerMember.partner.equals(original_member.partner))
        ) {
            return NextResponse.json(
                { message: "The selected partner already has a partner" },
                { status: 400 }
            );
        }

        // Normalize household
        let newHouseholdId = undefined;
        if (data.household) {
            newHouseholdId = typeof data.household === "string" ? data.household : data.household._id;
        }

        const householdChanged = String(original_member.household ?? "") !== String(newHouseholdId ?? "");
        data.household = newHouseholdId;

        // Update query with $unset if household is removed
        const updateQuery =
            data.household === undefined ? { ...data, $unset: { household: "" } } : { ...data };

        const updated_member = await MemberModel.findByIdAndUpdate(id, updateQuery, { new: true });
        if (!updated_member) {
            return NextResponse.json({ message: "Member update failed." }, { status: 404 });
        }

        if (householdChanged) {
            // Remove head if member was the head of old household
            if (
                original_member.household &&
                original_member._id.equals((await Household.findById(original_member.household))?.head)
            ) {
                await Household.findByIdAndUpdate(original_member.household, {
                    $unset: { head: "" },
                });
            }

            // Remove from old household
            if (original_member.household) {
                await Household.findByIdAndUpdate(original_member.household, {
                    $pull: { members: original_member._id },
                });
            }

            // Add to new household
            if (newHouseholdId) {
                await Household.findByIdAndUpdate(newHouseholdId, {
                    $addToSet: { members: original_member._id },
                });
            }
        }

        return new Response(JSON.stringify(updated_member), { status: 200 });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        console.error("PATCH error:", errorMessage);
        return new Response(JSON.stringify({ message: errorMessage }), { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;

        const member = await MemberModel.findById(id).populate("household");

        if (!member) {
            return NextResponse.json({ message: "Member not found." }, { status: 404 });
        }

        const household = member.household as any;

        // Remove from household.members[] and clear head if applicable
        if (household) {
            household.members = household.members.filter((m: any) => m.toString() !== member._id.toString());

            if (household.head?.toString() === member._id.toString()) {
                household.head = undefined;
            }

            await household.save();
        }

        // Clear partner's reference to this member
        if (member.partner) {
            const partner = await MemberModel.findById(member.partner);
            if (partner?.partner?.toString() === member._id.toString()) {
                partner.partner = undefined;
                await partner.save();
            }
        }

        await Feeding_child.findOneAndDelete({ idMember: id }); // deleting feeding child object if available

        await member.deleteOne();

        return NextResponse.json({ message: "Member deleted successfully." }, { status: 200 });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        console.error("DELETE error:", errorMessage);
        return new Response(JSON.stringify({ message: errorMessage }), { status: 400 });
    }
}
