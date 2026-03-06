# Technology Decisions

This document captures the rationale behind each major technology choice in the Radiology Copilot system. Decisions are grouped by service and cross-cutting concerns.

---

## Backend

### Why Express over Fastify

Express was chosen as the backend framework for several reasons:

- **Mature ecosystem.** Express has the largest middleware ecosystem in Node.js. Libraries like `multer` (file upload), `cors`, and `helmet` are battle-tested and well-documented.
- **Team familiarity.** Express is the most widely known Node.js framework, reducing onboarding friction for contributors.
- **Stability for medical systems.** In healthcare-adjacent applications, proven stability outweighs raw performance. Express has a decade-long track record in production systems.
- **Middleware model.** The linear middleware pipeline maps cleanly to the request lifecycle of upload, parse, validate, forward, respond.

Fastify offers better throughput benchmarks, but the performance difference is negligible for a system where the bottleneck is GPU inference (seconds), not HTTP routing (microseconds).

### Why MongoDB

- **Flexible schema.** Radiology analysis results are deeply nested (findings arrays, model metadata, triage objects). MongoDB's document model stores these naturally without JOINs or schema migrations.
- **Evolving data model.** As the AI model improves and new fields are added to analysis results, a schemaless store adapts without downtime.
- **Easy nested queries.** Querying by `analysis.findings.condition` or `triage.priorityLevel` is straightforward in MongoDB.
- **Optional by design.** The system degrades gracefully without MongoDB, making it easy to develop locally without running a database.

### Why BullMQ with Redis

- **Async processing.** DICOM analysis can take seconds. BullMQ moves this to a background job, freeing the HTTP response cycle.
- **Retry and failure handling.** BullMQ provides automatic retries with backoff, which is important when the Analyzer service may be temporarily unavailable.
- **Optional dependency.** When Redis is not available, the backend falls back to synchronous processing, keeping the system functional for local development.

### Why Winston for Logging

- **Structured logging.** Winston outputs JSON-formatted logs that are compatible with log aggregation systems (ELK, CloudWatch).
- **Multiple transports.** Console output for development, file output for production, easily extensible.
- **Log levels.** Granular control over verbosity (error, warn, info, debug) is essential for debugging medical data pipelines.

### Why Zod for Validation

- **TypeScript-first.** Zod schemas double as type definitions, reducing duplication.
- **Runtime safety.** Validates incoming request payloads at the API boundary, catching malformed data before it reaches DICOM parsing or AI inference.
- **Composable.** Schemas can be composed and reused across routes.

---

## Frontend

### Why React + Vite over Next.js

- **SPA is appropriate.** A radiology workstation is a single-page application by nature. Radiologists open it and work within it for extended periods. Server-side rendering provides no benefit here.
- **Vite HMR.** Vite's hot module replacement is nearly instant, which accelerates development of complex viewer interactions.
- **Simpler deployment.** A static SPA build can be served from any CDN or static file server, without requiring a Node.js runtime in production.
- **No routing complexity.** The application has only two routes (Viewer and Worklist). Next.js's file-based routing and server components add unnecessary abstraction.

### Why cornerstone3D

- **Industry standard.** cornerstone3D is the rendering engine behind OHIF Viewer, which is used in production at hospitals and imaging centers worldwide.
- **Full modality support.** Handles CR, CT, MR, US, and other DICOM modalities with correct photometric interpretation and pixel spacing.
- **Built-in tools.** Window/Level, Zoom, Pan, and measurement tools (Length, Angle, etc.) are provided out of the box.
- **Windowing presets.** Supports standard radiology windowing (lung, bone, soft tissue) for diagnostic viewing.
- **Active development.** Maintained by the Cornerstone.js community with regular releases and TypeScript support.

### Why Tailwind CSS v4 over CSS-in-JS

- **Utility-first rapid development.** Building a dark-themed radiology UI is fast with utility classes. No context-switching between component files and stylesheets.
- **v4 CSS-first config.** Tailwind v4 uses native CSS for configuration (`@theme`), eliminating the JavaScript config file and improving IDE integration.
- **Dark theme customization.** Custom color tokens (slate-based dark palette) match radiology reading room aesthetics without fighting a component library's defaults.
- **No runtime CSS cost.** Unlike styled-components or Emotion, Tailwind generates static CSS at build time. Zero JavaScript overhead for styling.

### Why Zustand over Redux

- **Minimal boilerplate.** Zustand stores are plain functions. No action types, reducers, or dispatch ceremony.
- **Component-scoped state.** Viewer tool state (active tool, viewport settings) is naturally scoped. Zustand's lightweight stores match this pattern.
- **No provider wrapping.** Zustand does not require a `<Provider>` component, simplifying the component tree.
- **Small bundle.** Zustand adds approximately 1 KB to the bundle, compared to Redux Toolkit's larger footprint.

### Why TanStack React Query

- **Server state management.** Study data and analysis results are server state, not client state. React Query is purpose-built for fetching, caching, and synchronizing server data.
- **Automatic retries.** If the backend is temporarily unreachable, React Query retries with exponential backoff.
- **Background refetching.** The worklist automatically refreshes when the user returns to the tab, keeping study statuses current.
- **Cache invalidation.** After a new analysis completes, the studies cache is invalidated and refetched without manual intervention.

### Why Socket.IO

- **Real-time progress.** Analysis can take several seconds. Socket.IO pushes progress updates (uploading, parsing, analyzing, complete) to the frontend in real time.
- **Bidirectional communication.** Future phases may support PACS push notifications, where the server initiates communication to the client.
- **Automatic reconnection.** Socket.IO handles disconnection and reconnection transparently, which is important for long-running workstation sessions.
- **Fallback transports.** Starts with WebSocket and falls back to HTTP long-polling in restricted network environments.

---

## Analyzer

### Why FastAPI for the Analyzer Service

- **Native async.** FastAPI is built on ASGI, supporting async endpoints that can handle concurrent inference requests without blocking.
- **Automatic OpenAPI docs.** FastAPI generates Swagger UI at `/docs` and ReDoc at `/redoc`, providing interactive API documentation with zero additional effort.
- **Pydantic validation.** Request and response models are validated automatically, catching malformed payloads before they reach PyTorch.
- **Python ML ecosystem.** PyTorch, pydicom, NumPy, and scikit-image are all Python-native. Running inference in Python avoids cross-language serialization overhead.

### Why DenseNet-121 (CheXNet)

- **Proven architecture.** CheXNet (Rajpurkar et al., 2017) demonstrated radiologist-level performance on the ChestX-ray14 dataset for 14 thoracic pathologies.
- **Well-documented.** Extensive literature and open-source implementations make it straightforward to reproduce and validate.
- **Good accuracy.** Strong AUC scores across all 14 conditions, particularly for Cardiomegaly, Effusion, and Mass detection.
- **Grad-CAM compatible.** DenseNet's architecture produces meaningful gradient-weighted class activation maps, enabling visual explanations of predictions.
- **Lightweight.** DenseNet-121 has approximately 8 million parameters, making it feasible to run on consumer GPUs and even CPU for development.

### Why Grad-CAM for Explainability

- **Visual explanations.** Grad-CAM heatmaps highlight the image regions that most influenced each prediction, building clinician trust.
- **No architecture changes.** Grad-CAM works as a post-hoc technique on any CNN without modifying the model architecture or retraining.
- **Clinical relevance.** Highlighting the region of a suspected effusion or mass helps radiologists quickly validate or dismiss AI findings.

---

## Phase Roadmap

The technology choices are designed to support incremental capability expansion:

| Phase | Scope | Key Technologies |
|---|---|---|
| **Phase 1** (current) | Chest X-ray analysis | DenseNet-121 CheXNet, 14 pathology classification, Grad-CAM heatmaps |
| **Phase 2** | CT volume analysis | MONAI framework, 3D segmentation models, multi-slice viewer, volume rendering |
| **Phase 3** | Multimodal + integration | Multi-modality AI models, FHIR interoperability, HL7 messaging, PACS integration |

### Phase 2 — MONAI + CT

- **MONAI** (Medical Open Network for AI) extends PyTorch with medical imaging primitives (transforms, losses, metrics) and pretrained models for 3D segmentation.
- The Analyzer service architecture (FastAPI + PyTorch) is designed to accommodate MONAI models without structural changes.
- cornerstone3D already supports CT volume rendering and multi-planar reconstruction (MPR).

### Phase 3 — Multimodal + FHIR

- **FHIR** (Fast Healthcare Interoperability Resources) integration will enable structured reporting and EHR connectivity.
- Socket.IO's bidirectional architecture supports PACS push workflows where new studies are automatically routed to the workstation.
- MongoDB's flexible schema accommodates FHIR resource documents alongside analysis results.
