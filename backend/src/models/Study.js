import mongoose from 'mongoose';

const studySchema = new mongoose.Schema(
  {
    patientName: String,
    patientId: String,
    modality: String,
    bodyPart: String,
    studyDate: String,
    studyInstanceUID: { type: String, unique: true, sparse: true },
    studyDescription: String,
    institutionName: String,
    imageSize: {
      rows: Number,
      columns: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending',
    },
    analysis: mongoose.Schema.Types.Mixed,
    triage: {
      priorityLevel: String,
      recommendedAction: String,
    },
    processingTimeMs: Number,
  },
  { timestamps: true },
);

export const Study = mongoose.model('Study', studySchema);
