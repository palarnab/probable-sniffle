# Demo Video Script

A ~3-minute demo for the README, LinkedIn, and conference submissions.

**Format:** 1280×720 screen recording, dark theme, browser chrome hidden.
**Data:** de-identified studies only — public NIH ChestX-ray14 images are ideal.

> **Before publishing:** confirm your employer's open-source and IP policy, and present this as personal work. Slide 1 identifies your role for credibility; it should not imply employer endorsement. Add "Views my own / personal project" to the slide or description.

---

## Slide 1 — Speaker introduction (0:00–0:15)

**On screen**

> ### Arnab Pal
> **Software Architect — Enterprise Imaging, Hyland Software**
> Building large-scale medical imaging systems
>
> <sub>Personal open-source project. Views my own.</sub>

**Narration**

> "Hi, I'm Arnab Pal. I'm a Software Architect at Hyland Software, where I work on Enterprise Imaging — large-scale systems that store, move, and display medical images. Today I want to show you a personal open-source project called Radiology Copilot."

---

## Slide 2 — The problem (0:15–0:40)

**On screen:** split — a Jupyter notebook with an accuracy number on the left, a radiologist's multi-monitor reading setup on the right.

**Narration**

> "Here's a gap I keep running into. Radiology AI projects almost always end at the left-hand side: a notebook, a model, an accuracy score. But the radiologist works on the right — a diagnostic viewer, a worklist, a reading workflow.
>
> Nobody ships the bridge between them. So I built one."

---

## Scene 3 — The workstation (0:40–1:05)

**On screen:** the app at `localhost:4002`. Drag a chest X-ray onto the upload panel. Demonstrate window/level, zoom, pan.

**Narration**

> "This is a real DICOM viewer built on cornerstone3D — the same open-source engine behind many production radiology viewers. Window and level, zoom, pan, measurements. This isn't a PNG in an image tag; it's actual DICOM pixel data with the metadata intact."

---

## Scene 4 — AI findings (1:05–1:35)

**On screen:** findings panel populating in real time. Probability bars. Triage badge.

**Narration**

> "The moment the study lands, the backend parses the DICOM and hands the pixel data to a Python inference service. A CheXNet model — DenseNet-121 — scores fourteen chest pathologies, and the results stream back over a websocket as they're computed.
>
> Those findings roll up into a triage priority, so on a busy worklist the urgent studies surface first."

---

## Scene 5 — Explainability (1:35–2:10) — *the key scene*

**On screen:** toggle the Grad-CAM heatmap on and off, slowly. Let it breathe.

**Narration**

> "This is the part that matters most to me.
>
> A probability score is a black box. If the model says eighty-three percent effusion, a radiologist has no way to interrogate that. So every prediction comes with a Grad-CAM heatmap overlaid on the original pixels, showing the regions that actually drove the score.
>
> Now it's checkable. The radiologist can see whether the model is looking at the right anatomy — or at a pacemaker, a text marker, or the edge of the film. That's the difference between a number and a second opinion."

---

## Scene 6 — 3D volume rendering (2:10–2:30)

**On screen:** upload a CT series, rotate the rendered volume.

**Narration**

> "It also handles full cross-sectional studies. This is a complete CT series volume-rendered entirely in the browser — no plugins, no server-side rendering, up to two thousand slices."

---

## Scene 7 — Architecture (2:30–2:50)

**On screen:** the architecture diagram from the README.

**Narration**

> "Under the hood it's three services. A React workstation in the browser. A Node orchestrator that handles DICOM parsing, triage, persistence, and real-time updates. And a Python service that owns the model.
>
> That separation is deliberate. Deep learning belongs in PyTorch, DICOM I/O and transport are pleasant in Node, and the viewer ecosystem is JavaScript. It also means you can swap the model — or scale inference onto GPU nodes — without touching the UI at all."

---

## Scene 8 — Honest limitations (2:50–3:05)

**On screen:** plain slide, the disclaimer in large text.

**Narration**

> "One thing I want to be completely clear about: this is research software. It is not a medical device, it has no regulatory clearance, and it must not be used for clinical decisions. The training labels behind this model are known to be noisy. All of that is documented up front in the repository, not buried in a footnote."

---

## Scene 9 — Close (3:05–3:20)

**On screen:** repo URL, MIT badge, `docker compose up`.

**Narration**

> "It's MIT licensed and runs with a single docker compose command. If you work in medical imaging, I'd genuinely like to know what's missing from the workflow — open an issue and tell me.
>
> Thanks for watching."

---

## Production notes

- **Cut the hero GIF from Scenes 3–5** — drag, findings, heatmap toggle. Under 10 seconds, no narration, looping.
- **Pace:** do not rush Scene 5. It's the scene that makes the project memorable.
- **Captions:** burn in subtitles. Most LinkedIn and X playback is muted.
- **Thumbnail:** the Grad-CAM overlay with the project name.
- **Cutdowns:** a 60-second version (slides 1, 5, 6, 8) works well for social; the full version belongs in the README and talk submissions.
