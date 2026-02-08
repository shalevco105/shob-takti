import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import OnCallSchedule from '@/models/OnCallSchedule';
import TeamMember from '@/models/TeamMember';
import { getDay } from 'date-fns';

export async function GET() {
    await dbConnect();

    try {
        // Fetch regular team members (excluding reserves)
        const teamMembers = await TeamMember.find({ active: true, type: 'regular' }).sort({ order: 1, name: 1 });
        const regularMemberNames = teamMembers.map(m => m.name);

        // In a larger app we might limit this, but for this scale all is fine.
        const schedules = await OnCallSchedule.find({});

        const scores: Record<string, {
            score: number;
            breakdown: { weekend: number; partial: number; midweek: number; }
        }> = {};

        // Initialize scores only for regular members
        regularMemberNames.forEach(name => {
            scores[name] = {
                score: 0,
                breakdown: { weekend: 0, partial: 0, midweek: 0 }
            };
        });

        schedules.forEach(doc => {
            const date = new Date(doc.date);
            const dayOfWeek = getDay(date); // 0 = Sun, 4 = Thu, 5 = Fri, 6 = Sat

            const processShift = (shift: any, type: 'day' | 'night') => {
                if (!shift || !shift.names || !Array.isArray(shift.names)) return;

                // Process each person in the shift
                shift.names.forEach((personName: string) => {
                    if (!regularMemberNames.includes(personName)) return;

                    // Rule: Phone does NOT count. Only Offices or Kirya.
                    if (shift.mode !== 'offices' && shift.mode !== 'kirya') return;

                    let points = 1;
                    let category: 'weekend' | 'partial' | 'midweek' = 'midweek';

                    // Holidays are treated like weekends (2 points for day shifts, 1.5 for night)
                    // Holidays (marked specifically on the shift)
                    if (shift.isHoliday) {
                        points = 2;
                        category = 'weekend';
                    }
                    // Friday (5)
                    else if (dayOfWeek === 5) {
                        // Friday Main or Night = 2 points, "Weekend" category
                        points = 2;
                        category = 'weekend';
                    }
                    // Saturday (6)
                    else if (dayOfWeek === 6) {
                        if (type === 'day') {
                            // Saturday Day = 2 points, "Weekend" category
                            points = 2;
                            category = 'weekend';
                        } else if (type === 'night') {
                            // Saturday Night = 1.5 points, "Partial Weekend" category
                            points = 1.5;
                            category = 'partial';
                        }
                    }
                    // Thursday (4)
                    else if (dayOfWeek === 4) {
                        if (type === 'night') {
                            // Thursday Night = 1.5 points, "Partial Weekend" category  
                            points = 1.5;
                            category = 'partial';
                        } else {
                            // Thursday Day is normal midweek
                            category = 'midweek';
                        }
                    }
                    else {
                        // Sun, Mon, Tue, Wed are midweek
                        category = 'midweek';
                    }

                    scores[personName].score += points;
                    scores[personName].breakdown[category]++;
                });
            };

            // Second shift (formerly morning) does NOT count ("צל לא נחשב בניקוד")
            // processShift(doc.shifts.second, 'second'); 

            processShift(doc.shifts.day, 'day');
            processShift(doc.shifts.night, 'night');
        });

        // Convert to array for sorting
        const sortedScores = Object.entries(scores)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.score - a.score);

        return NextResponse.json(sortedScores);
    } catch (error) {
        console.error('Error calculating scores:', error);
        return NextResponse.json({ error: 'Failed to calculate scores' }, { status: 500 });
    }
}
