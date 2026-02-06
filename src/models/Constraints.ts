import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConstraints extends Document {
    date: Date;
    constraints: Map<string, {
        day: boolean;
        night: boolean;
    }>;
}

const ConstraintsSchema: Schema = new Schema({
    date: { type: Date, required: true, unique: true },
    constraints: {
        type: Map,
        of: new Schema({
            day: { type: Boolean, default: false },
            night: { type: Boolean, default: false }
        }, { _id: false }),
        default: {}
    },
});

const Constraints: Model<IConstraints> = mongoose.models.Constraints || mongoose.model<IConstraints>('Constraints', ConstraintsSchema);

export default Constraints;
