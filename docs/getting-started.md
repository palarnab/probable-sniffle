# Getting Started

This guide walks through setting up and running the Radiology Copilot project for local development.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | >= 20 | Required for backend and frontend |
| Python | >= 3.10 | Required for the analyzer service |
| MongoDB | any | Optional — enables study persistence and worklist |
| Redis | any | Optional — enables BullMQ job queue |
| NVIDIA GPU + CUDA | CUDA 11.8+ | Optional — accelerates AI inference |

---

## Project Structure

```
radiology-copilot/
├── backend/          # Node.js Express API (port 4000)
├── frontend/         # React + Vite application (port 5173)
├── analyzer/         # Python FastAPI AI service (port 8000)
└── docs/             # Documentation
```

---

## Setup

### 1. Backend (Express API)

```bash
cd backend
npm install
npm run dev
```

The backend starts on **port 4000**. You should see log output confirming the server is running.

### 2. Analyzer (FastAPI + PyTorch)

Open a separate terminal:

```bash
cd analyzer
python -m venv venv
```

Activate the virtual environment:

```bash
# Linux / macOS
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\activate

# Windows (Command Prompt)
venv\Scripts\activate.bat
```

Install dependencies and start the service:

```bash
pip install -r requirements.txt
python run.py
```

The analyzer starts on **port 8000**. On first run, it will download the DenseNet-121 pretrained weights if they are not already cached.

### 3. Frontend (React + Vite)

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **port 5173**. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Configuration

Each service includes a `.env` file pre-configured for local development. Default values work out of the box with no changes required.

| Service | Env File | Key Variables |
|---|---|---|
| Backend | `backend/.env` | `PORT`, `MONGODB_URI`, `REDIS_URL`, `AI_SERVICE_URL` |
| Analyzer | `analyzer/.env` | `PORT`, `MODEL_PATH`, `DEVICE` |
| Frontend | `frontend/.env` | `VITE_API_URL` |

---

## Verifying the Setup

Once all three services are running, verify the pipeline with these commands:

### 1. Check Backend Health

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "uptime": 12.5,
  "timestamp": "2026-03-06T10:00:00.000Z",
  "services": {
    "database": "disconnected",
    "aiService": "unknown"
  }
}
```

The `database` field will show `"connected"` if MongoDB is running. The `aiService` field reflects the Analyzer status.

### 2. Check Analyzer Health

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "device": "cuda",
  "modelLoaded": true
}
```

The `device` field will show `"cpu"` if no GPU is available.

### 3. Analyze a DICOM File

```bash
curl -X POST http://localhost:4000/api/analyze -F "file=@sample.dcm"
```

Replace `sample.dcm` with the path to any chest X-ray DICOM file. The response will include patient metadata, AI findings, triage priority, and processing time.

### 4. Open the Frontend

Navigate to [http://localhost:5173](http://localhost:5173). You should see:

- The Radiology Copilot interface with a dark theme
- A green health indicator dot (if backend is running)
- An upload zone in the right panel ready to accept DICOM files

---

## Running Without Optional Dependencies

The system is designed to work with minimal infrastructure. Here is what happens when optional services are unavailable:

### Without MongoDB

- Studies are **not persisted** between server restarts.
- The **Worklist page** will be empty.
- DICOM upload and AI analysis work normally.
- The health endpoint reports `database: "disconnected"`.

### Without Redis

- The BullMQ job queue is **unavailable**.
- Analysis requests are processed **synchronously** instead of being queued.
- No impact on analysis accuracy or results.

### Without the Analyzer Service

- The backend returns **mock AI findings** with representative pathology data.
- The frontend displays results with a **"Mock Data"** indicator badge.
- This is useful for frontend development without running the Python service.

### Without a GPU

- The Analyzer runs inference on **CPU**.
- Processing is **slower** (several seconds instead of sub-second) but produces identical results.
- The health endpoint reports `device: "cpu"`.

---

## Common Issues

| Issue | Solution |
|---|---|
| `npm install` fails | Ensure Node.js >= 20 is installed. Run `node --version` to check. |
| `pip install` fails on PyTorch | Install PyTorch separately following [pytorch.org](https://pytorch.org/get-started/locally/) for your platform. |
| Port already in use | Another process is using the port. Stop it or change the port in the `.env` file. |
| CORS errors in browser | Ensure the backend is running and the `VITE_API_URL` in `frontend/.env` matches the backend URL. |
| Analyzer can't find model weights | On first run, the model downloads automatically. Ensure internet connectivity. |
| MongoDB connection refused | Start MongoDB or accept that persistence is unavailable. The system works without it. |

---

## Next Steps

- Read the [Architecture](architecture.md) document for a system overview.
- See the [API Reference](api-reference.md) for all endpoints and curl examples.
- Review the [Frontend Guide](frontend-guide.md) for how to use the workstation UI.
- Understand [Technology Decisions](technology-decisions.md) for the reasoning behind each choice.
