import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Constraints from '@/models/Constraints';
import { startOfDay } from 'date-fns';

export async function GET(request: Request) {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
        return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
    }

    try {
        const constraints = await Constraints.find({
            date: {
                $gte: new Date(start),
                $lte: new Date(end),
            },
        }).sort({ date: 1 });

        return NextResponse.json(constraints);
    } catch (error) {
        console.error('Error fetching constraints:', error);
        return NextResponse.json({ error: 'Failed to fetch constraints' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { date, name, constraints: userConstraints } = body;

        console.log('Received constraints request:', { date, name, userConstraints });

        const normalizedDate = startOfDay(new Date(date));

        // Find or create document for this date
        let existing = await Constraints.findOne({ date: normalizedDate });

        if (existing) {
            // Use Map.set() to properly set the value
            if (!existing.constraints) {
                existing.constraints = new Map();
            }
            existing.constraints.set(name, userConstraints);
            existing.markModified('constraints');
            await existing.save();

            const result = existing.toObject();
            console.log('Updated existing constraint:', result);
            return NextResponse.json(result);
        } else {
            // Create new document with constraints Map
            const doc = new Constraints({
                date: normalizedDate,
                constraints: new Map([[name, userConstraints]])
            });
            await doc.save();

            const result = doc.toObject();
            console.log('Created new constraint:', result);
            return NextResponse.json(result);
        }
    } catch (error) {
        console.error('Error saving constraints:', error);
        return NextResponse.json({ error: 'Failed to save constraints' }, { status: 500 });
    }
}
