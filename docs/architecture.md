# System Architecture

## Overview

Radiology Copilot is a three-service architecture for AI-assisted radiology image analysis. A React-based radiology workstation sends DICOM images to an Express orchestrator, which delegates inference to a Python-based AI service running a CheXNet model, then returns structured findings to the UI.

## High-Level Architecture

```
                          Radiology Copilot — System Architecture

  +---------------------+         +-------------------------+         +-------------------------+
  |                     |  HTTP   |                         |  HTTP   |                         |
  |   Frontend          |-------->|   Backend               |-------->|   Analyzer              |
  |   React / Vite      |  :4000  |   Express API           |  :8000  |   FastAPI + PyTorch     |
  |   Port 5173         |<--------|   Port 4000             |<--------|   Port 8000             |
  |                     |  JSON   |                         |  JSON   |                         |
  +---------------------+         +-------+---------+-------+         +-------------------------+
        |                                 |         |                         |
        | WebSocket (Socket.IO)           |         |                         |
        |<--------------------------------+         |                         |
        |  Real-time progress updates               |                         |
                                                    |                         |
                                           +--------+--------+       +-------+-------+
                                           |                 |       |               |
                                           |   MongoDB       |       |   CheXNet     |
                                           |   Port 27017    |       |   DenseNet121 |
                                           |   (optional)    |       |   CUDA / CPU  |
                                           |                 |       |               |
                                           +-----------------+       +---------------+
                                           |                 |
                                           |   Redis         |
                                           |   Port 6379     |
                                           |   (optional)    |
                                           |                 |
                                           +-----------------+
```

## Request Flow

A DICOM upload follows this end-to-end path:

```
 User                Frontend              Backend               Analyzer
  |                     |                     |                     |
  |  1. Upload .dcm     |                     |                     |
  +----- drag & drop -->|                     |                     |
  |                     |  2. POST /api/      |                     |
  |                     |     analyze         |                     |
  |                     +------ multipart --->|                     |
  |                     |                     |  3. Parse DICOM     |
  |                     |                     |     (dicom-parser)  |
  |                     |                     |                     |
  |                     |                     |  4. POST /analyze   |
  |                     |                     +--- base64 image --->|
  |                     |                     |                     |
  |                     |                     |                5. Preprocess
  |                     |                     |                   (pydicom)
  |                     |                     |                6. Inference
  |                     |                     |                   (DenseNet121)
  |                     |                     |                7. Grad-CAM
  |                     |                     |                   heatmap
  |                     |                     |                     |
  |                     |                     |  8. Findings JSON   |
  |                     |                     |<--- probabilities --|
  |                     |                     |                     |
  |                     |                     |  9. Compute triage  |
  |                     |                     |     priority        |
  |                     |                     |                     |
  |                     |                     | 10. Save to MongoDB |
  |                     |                     |     (if connected)  |
  |                     |                     |                     |
  |                     | 11. Full response   |                     |
  |                     |<--- JSON findings --|                     |
  |                     |                     |                     |
  | 12. Display results |                     |                     |
  |<-- findings + triage|                     |                     |
  |    in right panel   |                     |                     |
```

## Component Breakdown

### Frontend — React / Vite (Port 5173)

| Concern | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 6 |
| DICOM viewer | cornerstone3D |
| Styling | Tailwind CSS v4, dark radiology theme |
| State management | Zustand (viewer tools, UI state) |
| Server state | TanStack React Query (studies, analysis) |
| Real-time | Socket.IO client |

Key UI areas:

- **DICOM Viewer** — cornerstone3D viewport with Window/Level, Zoom, Pan, Length measurement tools
- **Upload Panel** — drag-and-drop zone, triggers analysis on upload
- **Findings Panel** — triage badge, probability bars, distribution chart, model metadata
- **Worklist** — table of historical studies (requires MongoDB)

### Backend — Express API (Port 4000)

| Concern | Technology |
|---|---|
| Framework | Express 4 |
| DICOM parsing | dicom-parser |
| File upload | multer (multipart/form-data) |
| Real-time | Socket.IO |
| Job queue | BullMQ (requires Redis) |
| Database | MongoDB via Mongoose |
| Logging | Winston |
| Validation | Zod |

Responsibilities:

- Accept DICOM uploads from the frontend
- Parse DICOM metadata (patient name, ID, modality, body part, study date, UIDs)
- Forward image data to the Analyzer service
- Compute triage priority from findings
- Persist studies to MongoDB (when available)
- Emit real-time progress events over Socket.IO
- Return mock AI results when the Analyzer is unreachable

### Analyzer — FastAPI + PyTorch (Port 8000)

| Concern | Technology |
|---|---|
| Framework | FastAPI |
| Deep learning | PyTorch, DenseNet-121 (CheXNet) |
| DICOM preprocessing | pydicom |
| Explainability | Grad-CAM heatmaps |
| Compute | CUDA GPU or CPU fallback |

Responsibilities:

- Receive base64-encoded DICOM images from the backend
- Preprocess pixel data to 224x224 normalized tensors
- Run CheXNet inference for 14 chest X-ray pathologies
- Generate Grad-CAM heatmaps highlighting regions of interest
- Return structured findings with per-condition probabilities

## Data Flow — DICOM Upload to Display

```
+------------------+     +-----------------+     +------------------+     +------------------+
| 1. DICOM Upload  |     | 2. DICOM Parse  |     | 3. AI Inference  |     | 4. Results       |
|                  |     |                 |     |                  |     |    Display       |
| User drops .dcm  |---->| Extract patient |---->| DenseNet-121     |---->| Triage badge     |
| file in upload   |     | metadata via    |     | forward pass     |     | Findings list    |
| zone             |     | dicom-parser    |     | on preprocessed  |     | Probability bars |
|                  |     |                 |     | 224x224 tensor   |     | Grad-CAM overlay |
+------------------+     +-----------------+     +------------------+     +------------------+
                                                        |
                                                        v
                                                 +------------------+
                                                 | 3a. Grad-CAM     |
                                                 | Compute class    |
                                                 | activation map   |
                                                 | for top finding  |
                                                 +------------------+
```

## Port Mapping

| Service | Port | Protocol | Description |
|---|---|---|---|
| Frontend | 5173 | HTTP | Vite dev server, React SPA |
| Backend | 4000 | HTTP + WS | Express API + Socket.IO |
| Analyzer | 8000 | HTTP | FastAPI inference service |
| MongoDB | 27017 | TCP | Document database (optional) |
| Redis | 6379 | TCP | BullMQ job queue (optional) |

## Graceful Degradation

The system is designed to function at reduced capability when optional dependencies are unavailable.

| Dependency | Status | Behavior |
|---|---|---|
| MongoDB | Disconnected | Analysis works end-to-end. Studies are not persisted. Worklist page is empty. Health endpoint reports `database: "disconnected"`. |
| Redis | Unavailable | Analysis is processed synchronously instead of through the BullMQ job queue. No background job scheduling. |
| Analyzer | Unreachable | Backend generates mock AI findings with representative pathology data. The frontend displays results with a "Mock Data" indicator badge. |
| GPU (CUDA) | Not available | Analyzer falls back to CPU inference. Processing is slower but produces identical results. |

This layered resilience ensures that developers can run the system locally with minimal infrastructure while the full production stack leverages all services for persistence, queuing, and GPU-accelerated inference.
