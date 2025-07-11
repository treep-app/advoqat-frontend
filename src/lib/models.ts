import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ILawyer extends Document {
  fullName?: string;
  specialty?: string[];
  availability?: Array<{ date: string; slots: string[] }>;
  avatarUrl?: string;
}

const LawyerSchema = new Schema<ILawyer>({
  fullName: { type: String },
  specialty: [{ type: String }],
  availability: [{
    date: { type: String },
    slots: [{ type: String }]
  }],
  avatarUrl: { type: String },
}, { collection: 'lawyers' });

export const LawyerModel: Model<ILawyer> = mongoose.models.Lawyer || mongoose.model<ILawyer>('Lawyer', LawyerSchema);

// --- GeneratedDocument Mongoose Model ---
export interface IGeneratedDocument extends Document {
  userId: string;
  templateId: string;
  formData: Record<string, string>;
  document: string;
  createdAt: Date;
}

const GeneratedDocumentSchema = new Schema<IGeneratedDocument>({
  userId: { type: String, required: true },
  templateId: { type: String, required: true },
  formData: { type: Schema.Types.Mixed, required: true },
  document: { type: String, required: true },
  createdAt: { type: Date, required: true },
}, { collection: 'documents' });

export const GeneratedDocumentModel: Model<IGeneratedDocument> = mongoose.models.GeneratedDocument || mongoose.model<IGeneratedDocument>('GeneratedDocument', GeneratedDocumentSchema);

export interface Consultation extends Document {
  id: string;
  userId: string;
  lawyerId: string;
  scheduledAt: string;
  method: string;
  notes?: string;
  roomUrl?: string;
  status: string;
}

const ConsultationSchema = new Schema<Consultation>({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  lawyerId: { type: String, required: true },
  scheduledAt: { type: String, required: true },
  method: { type: String, required: true },
  notes: { type: String },
  roomUrl: { type: String },
  status: { type: String, required: true },
}, { collection: 'consultations' });

export const ConsultationModel: Model<Consultation> = mongoose.models.Consultation || mongoose.model<Consultation>('Consultation', ConsultationSchema);

export function getConsultationsCollection(db: unknown) {
  // @ts-expect-error: db is from native driver, not typed for Mongoose
  return db.collection('consultations');
}

export interface ConsultationFeedback extends Document {
  consultationId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export function getConsultationFeedbackCollection(db: unknown) {
  // @ts-expect-error: db is from native driver, not typed for Mongoose
  return db.collection('consultation_feedback');
} 