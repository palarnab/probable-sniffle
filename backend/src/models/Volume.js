import mongoose from 'mongoose';

const volumeSchema = new mongoose.Schema(
  {
    seriesInstanceUID: { type: String, index: true },
    studyInstanceUID: String,
    patientName: String,
    patientId: String,
    modality: String,
    bodyPart: String,
    studyDate: String,
    seriesDescription: String,
    institutionName: String,
    sliceCount: Number,
    sliceThickness: Number,
    dimensions: {
      rows: Number,
      columns: Number,
    },
    storagePath: { type: String, required: true },
    fileNames: [String],
    status: {
      type: String,
      enum: ['uploading', 'ready', 'error'],
      default: 'ready',
    },
  },
  { timestamps: true },
);

export const Volume = mongoose.model('Volume', volumeSchema);
