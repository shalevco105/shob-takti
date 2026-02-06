import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamMember extends Document {
    name: string;
    type: 'regular' | 'mliluim'; // regular = counted in justice table, mliluim = only for dropdown
    order: number; // for sorting
    active: boolean;
}

const TeamMemberSchema = new Schema<ITeamMember>({
    name: { type: String, required: true },
    type: { type: String, enum: ['regular', 'mliluim'], default: 'regular' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
