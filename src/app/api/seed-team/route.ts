import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';

// Seed route to initialize team members in the database
export async function POST() {
    await dbConnect();

    try {
        const existingCount = await TeamMember.countDocuments();

        if (existingCount > 0) {
            return NextResponse.json({ message: 'Team members already exist', count: existingCount });
        }

        const defaultTeamMembers = [
            { name: 'זמר', type: 'regular' as const, order: 1, active: true },
            { name: 'שלו', type: 'regular' as const, order: 2, active: true },
            { name: 'שיר', type: 'regular' as const, order: 3, active: true },
            { name: 'רוני', type: 'regular' as const, order: 4, active: true },
            { name: 'נויה', type: 'regular' as const, order: 5, active: true },
            { name: 'תובל', type: 'regular' as const, order: 6, active: true },
            { name: 'רוי', type: 'regular' as const, order: 7, active: true },
            { name: 'כפיר', type: 'regular' as const, order: 8, active: true },
        ];

        await TeamMember.insertMany(defaultTeamMembers);

        return NextResponse.json({
            message: 'Team members seeded successfully',
            count: defaultTeamMembers.length
        });
    } catch (error) {
        console.error('Error seeding team members:', error);
        return NextResponse.json({ error: 'Failed to seed team members' }, { status: 500 });
    }
}
