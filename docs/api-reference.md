# API Reference

This document covers every endpoint exposed by the Express backend (port 4001) and the Python Analyzer service (port 4000), including request/response formats and curl examples.

---

## Express Backend (Port 4001)

Base URL: `http://localhost:4001`

### GET /api/health

Returns the health status of the backend and its downstream dependencies.

**Request:**

```bash
curl http://localhost:4001/api/health
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "uptime": 142.34,
  "timestamp": "2026-03-06T10:00:00.000Z",
  "services": {
    "database": "disconnected",
    "aiService": "unknown"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"ok"` if the backend is running |
| `uptime` | number | Server uptime in seconds |
| `timestamp` | string | ISO 8601 timestamp of the response |
| `services.database` | string | `"connected"` or `"disconnected"` depending on MongoDB availability |
| `services.aiService` | string | `"connected"`, `"disconnected"`, or `"unknown"` depending on Analyzer reachability |

---

### POST /api/analyze

Upload a DICOM file for AI analysis. The backend parses DICOM metadata, forwards the image to the Analyzer service for inference, computes a triage priority, and returns the complete result.

**Request:**

- Content-Type: `multipart/form-data`
- Field name: `file`
- Accepted formats: `.dcm` (DICOM), other image formats processed with limited metadata

```bash
curl -X POST http://localhost:4001/api/analyze \
  -F "file=@/path/to/chest_xray.dcm"
```

**Response (200 OK):**

```json
{
  "studyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "study": {
    "patientName": "DOE^JOHN",
    "patientId": "PAT001",
    "modality": "CR",
    "bodyPart": "CHEST",
    "studyDate": "20260217",
    "studyInstanceUID": "1.2.840.113619.2.55.3.604..."
  },
  "analysis": {
    "model": {
      "name": "DenseNet121-CheXNet",
      "version": "1.0.0",
      "confidenceThreshold": 0.3
    },
    "findings": [
      {
        "condition": "Cardiomegaly",
        "probability": 0.72,
        "confidenceLevel": "High",
        "abnormal": true
      },
      {
        "condition": "Pleural Effusion",
        "probability": 0.45,
        "confidenceLevel": "Moderate",
        "abnormal": true
      },
      {
        "condition": "Atelectasis",
        "probability": 0.18,
        "confidenceLevel": "Low",
        "abnormal": false
      }
    ],
    "normalProbability": 0.28
  },
  "triage": {
    "priorityLevel": "Urgent",
    "recommendedAction": "Expedited radiologist review recommended"
  },
  "audit": {
    "processingTimeMs": 1243,
    "timestamp": "2026-03-06T10:00:01.243Z"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `studyId` | string | Unique identifier for this analysis (UUID or MongoDB ObjectId) |
| `study` | object | DICOM metadata extracted from the file |
| `study.patientName` | string | Patient name in DICOM format (`LAST^FIRST`) |
| `study.patientId` | string | Patient identifier |
| `study.modality` | string | DICOM modality code (e.g., `CR`, `DX`, `CT`) |
| `study.bodyPart` | string | Body part examined |
| `study.studyDate` | string | Study date in `YYYYMMDD` format |
| `study.studyInstanceUID` | string | DICOM Study Instance UID |
| `analysis.model` | object | Model identification and configuration |
| `analysis.findings` | array | Per-condition predictions |
| `analysis.findings[].condition` | string | Pathology name |
| `analysis.findings[].probability` | number | Prediction probability (0.0 - 1.0) |
| `analysis.findings[].confidenceLevel` | string | `"High"` (>0.7), `"Moderate"` (>0.4), or `"Low"` |
| `analysis.findings[].abnormal` | boolean | `true` if probability exceeds the confidence threshold (0.3) |
| `analysis.normalProbability` | number | Probability that the image is normal |
| `triage.priorityLevel` | string | Computed priority: `Critical`, `Urgent`, `Routine`, or `Low` |
| `triage.recommendedAction` | string | Human-readable recommendation |
| `audit.processingTimeMs` | number | Total processing time in milliseconds |
| `audit.timestamp` | string | ISO 8601 completion timestamp |

**Non-DICOM File Upload:**

Non-DICOM files (e.g., PNG, JPEG) are accepted but DICOM metadata extraction will fail gracefully. Metadata fields will show as `"Unknown"`.

```bash
curl -X POST http://localhost:4001/api/analyze \
  -F "file=@/path/to/image.png"
```

The `study` object in the response will contain:

```json
{
  "study": {
    "patientName": "Unknown",
    "patientId": "Unknown",
    "modality": "Unknown",
    "bodyPart": "Unknown",
    "studyDate": "Unknown",
    "studyInstanceUID": "Unknown"
  }
}
```

**Error Responses:**

| Status | Condition | Body |
|---|---|---|
| 400 | No file provided in the request | `{ "error": "No file uploaded" }` |
| 500 | Internal server error during processing | `{ "error": "Analysis failed", "message": "<details>" }` |

---

### GET /api/studies

Retrieve all analyzed studies. Requires MongoDB to be connected.

**Request:**

```bash
curl http://localhost:4001/api/studies
```

**Response (200 OK):**

```json
[
  {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "patientName": "DOE^JOHN",
    "patientId": "PAT001",
    "modality": "CR",
    "bodyPart": "CHEST",
    "studyDate": "20260217",
    "status": "completed",
    "priority": "Urgent",
    "analysis": { ... },
    "createdAt": "2026-03-06T10:00:01.243Z"
  }
]
```

Returns an empty array `[]` if MongoDB is not connected or no studies have been analyzed.

---

### GET /api/studies/:id

Retrieve a specific study by its MongoDB ObjectId.

**Request:**

```bash
curl http://localhost:4001/api/studies/65f1a2b3c4d5e6f7a8b9c0d1
```

**Response (200 OK):**

Returns the full study document including analysis results, triage information, and audit data.

**Error Responses:**

| Status | Condition | Body |
|---|---|---|
| 404 | Study not found | `{ "error": "Study not found" }` |
| 500 | Database error | `{ "error": "Failed to retrieve study" }` |

---

## Python Analyzer Service (Port 4000)

Base URL: `http://localhost:4000`

The Analyzer is an internal service called by the backend. It is not intended to be called directly by end users, but the API is documented here for development and debugging purposes.

### GET /health

Returns the health status of the Analyzer service, including GPU availability and model load state.

**Request:**

```bash
curl http://localhost:4000/health
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "device": "cuda",
  "modelLoaded": true
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `status` | string | `"ok"` if the service is running |
| `device` | string | `"cuda"` if GPU is available, `"cpu"` otherwise |
| `modelLoaded` | boolean | `true` if the DenseNet-121 model is loaded and ready for inference |

---

### POST /analyze

Accepts a base64-encoded DICOM image and returns AI inference results including per-condition probabilities and an optional Grad-CAM heatmap.

**Request:**

- Content-Type: `application/json`
- Body: JSON with `image` (base64-encoded file) and `modality` (DICOM modality code)

```bash
curl -X POST http://localhost:4000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$(base64 -w0 /path/to/chest_xray.dcm)\", \"modality\": \"CR\"}"
```

**Request Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | string | Yes | Base64-encoded DICOM file content |
| `modality` | string | No | DICOM modality code (e.g., `CR`, `DX`). Defaults to `"CR"` |

**Response (200 OK):**

```json
{
  "model": {
    "name": "DenseNet121-CheXNet",
    "version": "1.0.0",
    "confidenceThreshold": 0.3
  },
  "findings": [
    {
      "condition": "Cardiomegaly",
      "probability": 0.72,
      "confidenceLevel": "High",
      "abnormal": true
    },
    {
      "condition": "Pleural Effusion",
      "probability": 0.45,
      "confidenceLevel": "Moderate",
      "abnormal": true
    },
    {
      "condition": "Atelectasis",
      "probability": 0.18,
      "confidenceLevel": "Low",
      "abnormal": false
    }
  ],
  "normalProbability": 0.28,
  "heatmapAvailable": true,
  "heatmapBase64": "iVBORw0KGgoAAAA..."
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `model` | object | Model identification |
| `model.name` | string | Model architecture name |
| `model.version` | string | Model version |
| `model.confidenceThreshold` | number | Threshold above which a finding is considered abnormal |
| `findings` | array | Per-condition inference results |
| `findings[].condition` | string | Pathology name (one of the 14 CheXNet conditions) |
| `findings[].probability` | number | Predicted probability (0.0 - 1.0) |
| `findings[].confidenceLevel` | string | `"High"` (>0.7), `"Moderate"` (>0.4), or `"Low"` |
| `findings[].abnormal` | boolean | `true` if probability > confidenceThreshold |
| `normalProbability` | number | Probability that the study is normal |
| `heatmapAvailable` | boolean | Whether a Grad-CAM heatmap was generated |
| `heatmapBase64` | string | Base64-encoded PNG of the Grad-CAM heatmap (present only if `heatmapAvailable` is `true`) |

**CheXNet Conditions:**

The model evaluates the following 14 thoracic pathologies:

| # | Condition |
|---|---|
| 1 | Atelectasis |
| 2 | Cardiomegaly |
| 3 | Consolidation |
| 4 | Edema |
| 5 | Effusion |
| 6 | Emphysema |
| 7 | Fibrosis |
| 8 | Hernia |
| 9 | Infiltration |
| 10 | Mass |
| 11 | Nodule |
| 12 | Pleural Thickening |
| 13 | Pneumonia |
| 14 | Pneumothorax |

---

## Triage Priority Logic

The backend computes a triage priority based on the maximum probability across all findings. This logic runs after receiving results from the Analyzer and before returning the response to the frontend.

| Max Probability | Priority Level | Recommended Action |
|---|---|---|
| > 0.8 | **Critical** | Immediate radiologist review required |
| > 0.5 | **Urgent** | Expedited radiologist review recommended |
| > 0.3 | **Routine** | Standard radiologist review |
| <= 0.3 | **Low** | Normal findings — routine follow-up |

The priority level determines the color of the triage badge displayed in the frontend:

| Priority | Badge Color |
|---|---|
| Critical | Red |
| Urgent | Orange |
| Routine | Blue |
| Low | Green |

---

## Socket.IO Events

The backend emits real-time events over Socket.IO during analysis processing.

| Event | Direction | Payload | Description |
|---|---|---|---|
| `analysis:progress` | Server -> Client | `{ "status": "uploading" \| "parsing" \| "analyzing" \| "complete", "studyId": "..." }` | Progress updates during analysis |
| `analysis:complete` | Server -> Client | `{ "studyId": "...", "result": { ... } }` | Full analysis result when processing finishes |
| `analysis:error` | Server -> Client | `{ "studyId": "...", "error": "..." }` | Error notification if analysis fails |

**Connection Example (JavaScript):**

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4001");

socket.on("analysis:progress", (data) => {
  console.log(`Status: ${data.status}`);
});

socket.on("analysis:complete", (data) => {
  console.log("Results:", data.result);
});
```
