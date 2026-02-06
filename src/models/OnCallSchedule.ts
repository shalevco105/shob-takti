import mongoose, { Document, Schema } from 'mongoose';

interface ShiftDetails {
    names: string[];
    mode: 'phone' | 'offices' | 'kirya' | 'ignore';
    isHoliday: boolean; // Added per-shift holiday
}

export interface IOnCallSchedule extends Document {
    date: Date;
    // isHoliday removed from here
    shifts: {
        morning: ShiftDetails;
        main: ShiftDetails;
        night: ShiftDetails;
    };
}

const ShiftDetailsSchema = new Schema({
    names: { type: [String], default: [] },
    mode: { type: String, enum: ['phone', 'offices', 'kirya', 'ignore'], default: 'phone' },
    isHoliday: { type: Boolean, default: false } // Added to schema
}, { _id: false });

const OnCallScheduleSchema = new Schema<IOnCallSchedule>({
    date: { type: Date, required: true, unique: true },
    // isHoliday removed from here
    shifts: {
        morning: { type: ShiftDetailsSchema, default: () => ({ names: [], mode: 'phone', isHoliday: false }) },
        main: { type: ShiftDetailsSchema, default: () => ({ names: [], mode: 'phone', isHoliday: false }) },
        night: { type: ShiftDetailsSchema, default: () => ({ names: [], mode: 'phone', isHoliday: false }) }
    }
}, {
    timestamps: true
});

// Force model recompilation if schema changed (development only)
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.OnCallSchedule;
}

export default mongoose.models.OnCallSchedule || mongoose.model<IOnCallSchedule>('OnCallSchedule', OnCallScheduleSchema);
