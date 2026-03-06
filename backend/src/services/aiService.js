import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

const MOCK_FINDINGS = [
  { condition: 'Cardiomegaly', probability: 0.72, confidenceLevel: 'Moderate', abnormal: true },
  { condition: 'Pleural Effusion', probability: 0.45, confidenceLevel: 'Low', abnormal: true },
  { condition: 'Pneumonia', probability: 0.23, confidenceLevel: 'Low', abnormal: false },
  { condition: 'Atelectasis', probability: 0.18, confidenceLevel: 'Low', abnormal: false },
  { condition: 'Pneumothorax', probability: 0.05, confidenceLevel: 'Very Low', abnormal: false },
  { condition: 'Nodule/Mass', probability: 0.08, confidenceLevel: 'Very Low', abnormal: false },
  { condition: 'Consolidation', probability: 0.12, confidenceLevel: 'Low', abnormal: false },
  { condition: 'Edema', probability: 0.15, confidenceLevel: 'Low', abnormal: false },
];

function buildMockResponse() {
  return {
    model: { name: 'DenseNet121-CheXNet-Mock', version: '0.1.0-dev', confidenceThreshold: 0.3 },
    findings: MOCK_FINDINGS,
    normalProbability: 0.31,
    heatmapAvailable: false,
    mockData: true,
  };
}

export async function analyzeImage(buffer, metadata) {
  try {
    const payload = {
      image: buffer.toString('base64'),
      modality: metadata?.modality || 'Unknown',
    };

    const response = await axios.post(
      `${config.aiServiceUrl}/analyze`,
      payload,
      { timeout: config.aiServiceTimeoutMs },
    );

    logger.info('AI analysis completed via live service');
    return response.data;
  } catch (err) {
    logger.warn(`AI service unavailable (${err.message}), returning mock response`);
    return buildMockResponse();
  }
}
