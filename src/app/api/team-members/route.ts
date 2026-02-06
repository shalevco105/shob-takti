import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';

export async function GET() {
    await dbConnect();

    try {
        const members = await TeamMember.find({ active: true }).sort({ order: 1, name: 1 });
        return NextResponse.json(members);
    } catch (error) {
        console.error('Error fetching team members:', error);
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { _id, name, type, order, active } = body;

        if (_id) {
            // Update existing member
            const updated = await TeamMember.findByIdAndUpdate(
                _id,
                { name, type, order, active },
                { new: true, runValidators: true }
            );
            return NextResponse.json(updated);
        } else {
            // Create new member
            const member = await TeamMember.create({ name, type, order, active });
            return NextResponse.json(member);
        }
    } catch (error) {
        console.error('Error saving team member:', error);
        return NextResponse.json({ error: 'Failed to save team member' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
        }

        // Soft delete by setting active to false
        await TeamMember.findByIdAndUpdate(id, { active: false });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting team member:', error);
        return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
    }
}
