import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import OnCallSchedule from '@/models/OnCallSchedule';
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
        // Fetch documents within the range
        // We look for dates >= start AND <= end
        const schedules = await OnCallSchedule.find({
            date: {
                $gte: new Date(start),
                $lte: new Date(end),
            },
        }).sort({ date: 1 });

        return NextResponse.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { date, shifts } = body;

        console.log('Received POST payload:', { date, shifts });

        // Normalize date to start of day (UTC) to ensure consistency
        // When the frontend sends a date, we want to store it as the "Day" entry.
        const normalizedDate = startOfDay(new Date(date));

        const schedule = await OnCallSchedule.findOneAndUpdate(
            { date: normalizedDate },
            {
                date: normalizedDate,
                shifts
            },
            { upsert: true, new: true }
        );

        console.log('Saved schedule:', JSON.stringify(schedule, null, 2));

        return NextResponse.json(schedule);
    } catch (error) {
        console.error('Error saving schedule:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}
