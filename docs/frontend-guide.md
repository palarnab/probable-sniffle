# Frontend User Guide

This guide explains how to use the Radiology Copilot frontend application for viewing DICOM images and reviewing AI-assisted analysis results.

---

## Getting Started

### Prerequisites

All three services must be running for full functionality:

1. **Backend** (port 4001) — required for analysis
2. **Analyzer** (port 4000) — required for real AI results (mock results available without it)
3. **Frontend** (port 4002) — the application itself

### Opening the Application

Navigate to [http://localhost:4002](http://localhost:4002) in a modern web browser (Chrome, Firefox, or Edge recommended).

---

## Application Layout

```
+---+--------------------------------------------+------------------+
|   |              Toolbar                        |   Health Dot     |
| S |--------------------------------------------+|                  |
| I |                                            ||                  |
| D |                                            ||   Right Panel    |
| E |                                            ||                  |
| B |           DICOM Viewer                     ||   [Upload]       |
| A |           (center viewport)                ||   [Findings]     |
| R |                                            ||                  |
|   |                                            ||                  |
|   |                                            ||                  |
|   |                                            ||                  |
+---+--------------------------------------------+------------------+
```

### Left Sidebar

- Provides navigation between the **Viewer** and **Worklist** pages.
- Displays the "RC" monogram and "Radiology Copilot" branding.
- Can be collapsed by clicking the toggle arrow at the bottom of the sidebar.
- When collapsed, only icons are visible, giving more space to the viewer.

### Health Indicator

Located in the header area:

- **Green dot** — Backend is connected and responding to health checks.
- **Red dot** — Backend is unreachable. Analysis will not function until connectivity is restored.

---

## Viewer Page (/)

The main radiology workstation view. This is the default page when the application loads.

### DICOM Viewer (Center)

The central viewport renders DICOM images using cornerstone3D.

- Dark background matching the aesthetics of a radiology reading room.
- When no image is loaded, a placeholder message prompts the user to upload a DICOM file.
- After upload, the DICOM image is rendered with correct photometric interpretation and pixel spacing.
- Supports standard radiology interactions (windowing, zooming, panning, measurements).

### Toolbar (Top of Viewer)

The toolbar sits above the viewer area and provides imaging tools. All tools operate with left-click mouse interactions.

| Tool | Icon | Behavior |
|---|---|---|
| **Window/Level (W/L)** | Brightness/contrast icon | Click and drag on the image to adjust window width (horizontal) and window center (vertical). Controls brightness and contrast for diagnostic viewing. |
| **Zoom** | Magnifying glass | Scroll the mouse wheel or click-drag vertically to zoom in and out. |
| **Pan** | Move arrows | Click and drag to reposition the image within the viewport. |
| **Length** | Ruler | Click two points on the image to measure the distance between them. The measurement is displayed in millimeters (when pixel spacing metadata is available). |
| **Reset** | Reset icon | Restores the image to its original view: default window/level, zoom, and position. |

### Right Panel

The right panel contains two tabs: **Upload** and **Findings**.

#### Upload Tab

- **Drag-and-drop zone.** Drop a DICOM file (`.dcm`) anywhere on the upload area.
- **Click to browse.** Click the upload zone to open a file picker dialog.
- **Automatic analysis.** Uploading a file immediately triggers AI analysis. No separate "Analyze" button is needed.
- **Progress indicator.** A spinner is displayed while the analysis is in progress, with status updates (uploading, parsing, analyzing).

#### Findings Tab

After analysis completes, the panel automatically switches to the Findings tab. This tab displays:

**Study Information**

A summary of the DICOM metadata extracted from the uploaded file:

- Patient Name
- Patient ID
- Modality (e.g., CR, DX)
- Body Part (e.g., CHEST)
- Study Date

**Triage Badge**

A color-coded priority badge based on the highest-probability finding:

| Badge | Color | Meaning |
|---|---|---|
| Critical | Red | Immediate radiologist review required |
| Urgent | Orange | Expedited radiologist review recommended |
| Routine | Blue | Standard radiologist review |
| Low | Green | Normal findings — routine follow-up |

**Findings List**

Each detected pathology is displayed as a row with:

- Condition name (e.g., Cardiomegaly, Pleural Effusion)
- Probability bar showing the predicted likelihood (0% to 100%)
- Color coding by severity:
  - Red: probability > 0.7 (High confidence)
  - Orange: probability > 0.4 (Moderate confidence)
  - Default: probability <= 0.4 (Low confidence)

Findings are sorted by probability, highest first.

**Distribution Chart**

A horizontal bar chart visualizing all findings and their probabilities side by side. Provides a quick visual overview of the pathology distribution.

**Model Information**

Displayed at the bottom of the findings panel:

- Model name (DenseNet121-CheXNet)
- Model version
- Processing time in milliseconds

**Mock Data Indicator**

When the Analyzer service is offline, the backend returns mock AI results. These are displayed with a "Mock Data" badge to clearly indicate that the findings are simulated and not from actual model inference.

---

## Worklist Page (/worklist)

The Worklist page displays a table of all previously analyzed studies. This page requires MongoDB to be connected; if MongoDB is unavailable, the table will be empty.

### Table Columns

| Column | Description |
|---|---|
| Patient Name | Patient name from DICOM metadata |
| Patient ID | Patient identifier |
| Modality | Imaging modality code (CR, DX, CT, etc.) |
| Body Part | Anatomical region examined |
| Date | Study date |
| Status | Processing status badge |
| Priority | Triage priority badge |

### Status Badges

| Status | Meaning |
|---|---|
| Pending | Study uploaded, analysis not yet started |
| Analyzing | AI inference currently in progress |
| Completed | Analysis finished successfully |
| Failed | Analysis encountered an error |

### Interacting with the Worklist

- **Click a row** to navigate to the Viewer page with that study loaded, displaying its image and analysis results.
- Studies are listed in reverse chronological order (newest first).

---

## Keyboard and Interaction Reference

| Action | How |
|---|---|
| Upload a DICOM file | Drag onto the upload zone, or click to browse |
| Switch viewer tool | Click the tool button in the toolbar |
| Adjust Window/Level | Select W/L tool, click-drag on image |
| Zoom | Select Zoom tool, scroll wheel or click-drag |
| Pan image | Select Pan tool, click-drag |
| Measure distance | Select Length tool, click two points |
| Reset view | Click the Reset button in toolbar |
| Collapse sidebar | Click the toggle arrow at the bottom of the sidebar |
| Navigate pages | Click Viewer or Worklist in the sidebar |

---

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| Red health dot in header | Backend not running or unreachable | Start the backend with `npm run dev` in the `backend/` directory |
| "Mock Data" badge on findings | Analyzer service not running | Start the analyzer with `python run.py` in the `analyzer/` directory |
| Empty worklist | MongoDB not connected | Start MongoDB on port 27017, or accept that persistence is unavailable |
| DICOM image not rendering | Corrupt or unsupported DICOM file | Try a different DICOM file; check browser console for errors |
| Slow analysis | Running on CPU without GPU | Expected behavior; GPU (CUDA) significantly speeds up inference |
