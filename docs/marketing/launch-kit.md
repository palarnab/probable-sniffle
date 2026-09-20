# Launch & Growth Kit

Everything needed to take Radiology Copilot public. Copy blocks are written to be pasted directly, then adjusted to taste.

---

## 1. Positioning

**One-liner**
> Open-source AI radiology workstation — drop in a DICOM, get explainable findings, heatmaps, and 3D rendering in the browser.

**Elevator pitch (30 seconds)**
> Most medical-imaging AI projects stop at a notebook and an accuracy number. Radiology Copilot is the whole loop: a real cornerstone3D DICOM viewer, a CheXNet model scoring 14 chest pathologies, Grad-CAM heatmaps showing which pixels drove each call, automatic triage, and a browser-based 3D volume renderer. Three swappable services — React, Node, Python — so you can replace the model without touching the UI. MIT licensed, `docker compose up`, research use only.

**What makes it different**

| Most repos | Radiology Copilot |
|---|---|
| Notebook + accuracy metric | Full workstation UI a radiologist recognises |
| Black-box probability | Grad-CAM overlay on the source image |
| Model hardcoded into the app | Swappable inference service behind a stable contract |
| PNG/JPEG inputs | Real DICOM parsing, metadata, and 3D series |
| "Not for clinical use" in fine print | Limitations documented prominently and honestly |

**Audiences**

1. **Imaging engineers / PACS developers** — want a reference architecture. Lead with the three-service design and DICOM handling.
2. **ML engineers & researchers** — want a deployable harness around a model. Lead with swappable backends and Grad-CAM.
3. **Radiologists & informaticists** — want to see AI in a real workflow. Lead with the viewer, triage, and worklist.
4. **Self-hosters** — want something impressive to run. Lead with `docker compose up`.

---

## 2. Repository setup checklist

Do these before any launch post. They take fifteen minutes and drive a large share of conversion.

- [ ] **Rename the repo.** `probable-sniffle` is a GitHub auto-generated name and actively hurts discovery. Rename to `radiology-copilot`. GitHub redirects the old URL automatically.
- [ ] **Set the description**: `Open-source AI radiology workstation — DICOM viewer, CheXNet findings, Grad-CAM explainability, and 3D volume rendering. Research use only.`
- [ ] **Add topics**: `medical-imaging` `dicom` `radiology` `deep-learning` `pytorch` `explainable-ai` `grad-cam` `chexnet` `cornerstone3d` `healthcare` `react` `fastapi` `computer-vision` `medical-ai` `self-hosted`
- [ ] **Upload a social preview image** (Settings → Social preview, 1280×640). This is what renders on X, LinkedIn, and Slack. Without it, links look dead.
- [ ] **Enable Discussions** for Q&A so issues stay actionable.
- [ ] **Add a demo GIF to the README** — the single highest-leverage asset. See §3.
- [ ] **Pin a "Welcome / Roadmap" discussion.**
- [ ] **Label ~5 issues `good first issue`.** Tests are an obvious set.
- [ ] **Enable Dependabot** (Settings → Code security) — the badge signals maintenance.

---

## 3. Visual assets to capture

Ranked by impact. **Use only de-identified studies** — public NIH ChestX-ray14 data is ideal.

| # | Asset | Spec | Where it's used |
|---|---|---|---|
| 1 | **Hero GIF** — drag DICOM → findings + heatmap appear | ≤10 s, ≤5 MB, 1280px wide | README top, every social post |
| 2 | **Social preview card** | 1280×640 PNG, product name + one-liner + screenshot | GitHub, all link unfurls |
| 3 | Grad-CAM before/after | Side-by-side still | The "explainability" argument |
| 4 | 3D volume render clip | ≤8 s rotating volume | The "wait, in the browser?" moment |
| 5 | Worklist with triage badges | Full-window still | Shows real workflow |
| 6 | Architecture diagram | Rendered Mermaid from README | Talks, blog posts |

Recording tips: dark theme, hide browser chrome, 1280×720, and keep the hero GIF under 10 seconds — it must loop before attention breaks.

Store these in `docs/assets/` and reference them from the README.

---

## 4. Launch copy

### Hacker News (Show HN)

> **Title:** Show HN: Radiology Copilot – Open-source AI radiology workstation with explainable findings

> I've spent my career building enterprise medical imaging systems, and I kept noticing the same gap: imaging-AI projects ship a notebook and an AUC number, but nothing that resembles how a radiologist actually works.
>
> Radiology Copilot is my attempt at the full loop. You drag a DICOM into a real cornerstone3D viewport, a CheXNet (DenseNet-121) model scores 14 chest pathologies, and Grad-CAM heatmaps overlay the pixels that drove each prediction. Findings roll up into a triage priority, and there's a browser-based 3D volume renderer for full CT/MR series.
>
> The architecture is three services — React workstation, Node orchestrator, Python inference — specifically so the model is swappable behind a stable contract. Deep learning belongs in Python, DICOM I/O and orchestration in Node, the viewer in the browser.
>
> Things I'd call out honestly: this is research software, not a medical device, and not cleared by anyone. CheXNet's training labels were NLP-mined from reports and are noisy, so the numbers don't transfer to your population. It ships with no auth and no de-identification, so de-identified data only. Those limits are documented in the README rather than buried.
>
> MIT licensed, `docker compose up` to run it. I'd especially like feedback from people who work in imaging on what's missing from the workflow.
>
> https://github.com/palarnab/probable-sniffle

*Post Tue–Thu, ~8–10am ET. Stay in the thread for the first three hours — engagement in that window determines whether it moves.*

### Reddit

**r/selfhosted** — *"I built an open-source AI radiology workstation you can run with docker compose"*
Lead with the GIF and the one-command setup. This crowd cares about self-hosting, not model architecture.

**r/MachineLearning** — *"[P] Radiology Copilot: production-shaped harness around CheXNet with Grad-CAM explainability"*
Lead with the architecture and the swappable model contract. Be upfront about ChestX-ray14 label noise — this audience will raise it, so raise it first.

**r/radiology** — *"I'm a software architect in medical imaging — built an open-source AI viewer, would love a radiologist's critique"*
Ask, don't pitch. Emphasise clearly that it's not diagnostic. Genuine questions about workflow gaps land far better than a feature list.

*Read each subreddit's self-promotion rules first, and space posts several days apart.*

### LinkedIn

> I've spent years building enterprise medical imaging software. One pattern kept bothering me: radiology AI demos almost never show the radiologist's actual workflow. They show a model output.
>
> So I built the loop end to end and open-sourced it.
>
> Radiology Copilot lets you drop a DICOM into a real diagnostic-style viewer and get back:
> → findings across 14 chest pathologies
> → Grad-CAM heatmaps showing which pixels drove each prediction
> → an automatic triage priority
> → browser-based 3D volume rendering for full CT/MR series
>
> The part I care most about is explainability. A probability score tells a radiologist nothing actionable. A heatmap over the pixels that drove the score starts a conversation.
>
> Important: this is research software. Not a medical device, not cleared by any regulator, not for clinical use. Those limitations are documented openly in the repo.
>
> MIT licensed and runs with a single docker compose command. If you work in imaging, I'd genuinely value your critique.
>
> [link] #MedicalImaging #HealthTech #OpenSource #AI #Radiology

### X / Bluesky thread

> **1/** Most radiology AI demos show you a model output.
> None of them show you the radiologist's actual workflow.
> So I built the whole loop and open-sourced it. 🧵

> **2/** Drag in a DICOM. Real cornerstone3D viewport — window/level, zoom, pan, measurements. Not a PNG in an `<img>` tag. [GIF]

> **3/** A CheXNet DenseNet-121 scores 14 chest pathologies in seconds.

> **4/** Here's the part I care about: Grad-CAM heatmaps over the source pixels. A probability is a black box. A heatmap starts a conversation. [before/after image]

> **5/** Full CT/MR series? Volume-rendered in the browser. Up to 2000 slices. [clip]

> **6/** Three services — React workstation, Node orchestrator, Python inference — so the model swaps out without touching the UI. [architecture diagram]

> **7/** Honestly: research software. Not a medical device, not FDA-cleared, not for clinical use. Training labels are noisy. All documented in the README, not buried.

> **8/** MIT licensed. `docker compose up`. ⭐ if useful — and if you work in imaging, tell me what's missing. [link]

### Product Hunt

- **Tagline:** Open-source AI radiology workstation with explainable findings
- **Description:** Drop in a DICOM and get AI findings across 14 chest pathologies, Grad-CAM heatmaps showing exactly which pixels drove each prediction, automatic triage priority, and browser-based 3D volume rendering. Three swappable services, MIT licensed, one command to run. Research use only — not a medical device.
- **First comment:** Open with why you built it (the workflow gap), what you'd like feedback on, and the disclaimer.

---

## 5. Blog / article angles

Strong long-form beats one launch post. Publish on dev.to, Medium, or a personal site, then cross-link.

1. **"Why your medical AI model belongs in a separate service"** — the three-service argument, with the model-swap contract as the payoff. Strongest architectural angle.
2. **"Grad-CAM in production: making a chest X-ray model explain itself"** — the layer choice, the colormap, overlaying on DICOM pixel data.
3. **"Parsing DICOM in Node.js without losing your mind"** — transfer syntaxes, tag extraction, multi-slice series assembly. Very searchable, very underserved.
4. **"Rendering a 2000-slice CT volume in the browser"** — cornerstone3D, WASM codecs, memory pressure.
5. **"What ChestX-ray14 labels actually mean"** — honest post on NLP-mined label noise. Builds credibility fast with the research crowd.

---

## 6. Where to submit

- [Awesome Open Source in Healthcare](https://github.com/wfhio/awesome-healthcare)
- Awesome lists for medical imaging, DICOM, and explainable AI
- [r/selfhosted](https://reddit.com/r/selfhosted), [r/MachineLearning](https://reddit.com/r/MachineLearning), [r/radiology](https://reddit.com/r/radiology), [r/healthIT](https://reddit.com/r/healthIT)
- Hacker News (Show HN)
- Lobste.rs (needs an invite; tag `ml`, `healthcare`)
- Cornerstone / OHIF community channels — adjacent users, high relevance
- Medical imaging informatics groups (SIIM, RSNA informatics communities)
- Newsletters: Console.dev, Changelog News, TLDR, Hacker Newsletter

---

## 7. First 90 days

**Week 1 — Foundation**
Rename repo, set description/topics, record hero GIF, upload social preview, enable Discussions, label good-first-issues.

**Week 2 — Soft launch**
Post to LinkedIn and one subreddit. Fix whatever early feedback surfaces. Get the README airtight before the big push.

**Week 3 — Main launch**
Show HN + X thread + r/selfhosted, same day. Clear your calendar to respond for the first six hours.

**Weeks 4–8 — Sustain**
Publish one article from §5 every two weeks. Respond to every issue within 48 hours. Ship a visible feature (tests, DICOM SR export) and announce it.

**Weeks 9–12 — Compound**
Submit to awesome lists and newsletters. Write the retrospective post. Recognise contributors by name.

**Signals worth tracking:** stars are vanity; issues opened by strangers, forks that produce PRs, and unprompted mentions are the real signal.

---

## 8. Handling the hard questions

You will get these. Prepared, honest answers build far more credibility than deflection.

**"Is this safe to use on patients?"**
> No, and it isn't intended to be. It's research software with no regulatory clearance. Clinical deployment would need FDA/CE clearance, clinical validation, auth, audit logging, and encryption — none of which this has.

**"CheXNet's labels are unreliable."**
> Agreed, and that's why it's documented in the README. ChestX-ray14 labels were NLP-mined from reports and carry real noise. The point of the project is the architecture around the model — which is exactly why the model is swappable.

**"Why not just do everything in Python?"**
> You could. I split it because DICOM orchestration, file I/O, and real-time transport are pleasant in Node and the viewer ecosystem is JavaScript, while the model belongs in PyTorch. The split also lets inference scale on GPU nodes independently of the API.

**"Isn't this just a cornerstone3D demo?"**
> cornerstone3D is the viewport. The project is the end-to-end pipeline around it — DICOM parsing, orchestration, inference, explainability, triage, persistence, and real-time progress.

**"Are you allowed to publish this?"**
> Confirm your employer's IP and open-source policy before launch, and keep personal attribution separate from any employer affiliation. See the note in the demo script.

---

## 9. Asset inventory

- [ ] Hero GIF (`docs/assets/hero.gif`)
- [ ] Social preview card (`docs/assets/social-preview.png`)
- [ ] Grad-CAM before/after (`docs/assets/gradcam.png`)
- [ ] 3D volume clip (`docs/assets/volume-render.gif`)
- [ ] Worklist screenshot (`docs/assets/worklist.png`)
- [ ] Demo video (see [demo-video-script.md](demo-video-script.md))
