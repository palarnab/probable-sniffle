# Contributing to Radiology Copilot

Thanks for considering a contribution. This project sits at the intersection of medical imaging, deep learning, and web engineering — contributions from any of those angles are valuable.

---

## Ground rules for a medical imaging project

These are non-negotiable and exist to protect patients and contributors:

1. **Never commit patient data.** No DICOM files, no screenshots containing patient identifiers, no exported reports. `.gitignore` blocks common imaging extensions, but the final check is yours.
2. **De-identify everything in issues and PRs.** Blur or crop patient name, MRN, accession number, institution, and burned-in annotations before attaching any image.
3. **Never weaken the medical disclaimer.** Changes that present the model as clinically usable, diagnostic, or validated will be declined.
4. **Don't commit model weights.** They are downloaded at runtime. Large binaries bloat the repo permanently.

---

## Getting set up

See [Quick Start](README.md#-quick-start). The fastest path is `docker compose up --build`; the native path is better for iterating on a single service.

Services and ports:

| Service | Port | Dev command |
|---|---|---|
| Analyzer | 4000 | `cd analyzer && python run.py` |
| Backend | 4001 | `cd backend && npm run dev` |
| Frontend | 4002 | `cd frontend && npm run dev` |

---

## Workflow

1. **Open an issue first** for anything beyond a small fix. It saves you from building something that duplicates in-flight work.
2. **Fork and branch.** Use a descriptive branch name: `feat/dicom-sr-export`, `fix/gradcam-colormap`.
3. **Make the change.** Match the surrounding style — the codebase uses ES modules and 2-space indent in JS, and type hints in Python.
4. **Verify it runs.** Build the frontend (`npm run build`), start the affected services, and exercise the path you changed end to end with a de-identified study.
5. **Write a clear PR description.** What changed, why, and how you verified it. Screenshots help enormously for UI work.

### Commit messages

Conventional Commits are preferred but not enforced:

```
feat(analyzer): add TorchXRayVision model backend
fix(viewer): correct window/level reset on series switch
docs(readme): clarify GPU requirements
```

---

## Where help is most needed

| Area | Examples |
|---|---|
| 🧪 **Tests** | The repo currently has none. Vitest for the Node services, pytest for the analyzer. This is the highest-impact place to start. |
| 🧠 **Models** | Additional backends — RadImageNet, MONAI, TorchXRayVision. Keep the analyzer's response contract stable. |
| 🖼 **Modalities** | Body-part and modality detection so non-chest studies are routed correctly instead of silently scored. |
| 🔗 **Interoperability** | DICOM SR export, FHIR `ImagingStudy`, DICOMweb (WADO-RS / QIDO-RS) ingestion. |
| 🛠 **Viewer** | Annotations, ROI statistics, MPR, segmentation overlays. |
| ♿ **Accessibility** | Keyboard navigation and screen-reader support for the workstation UI. |
| 📚 **Docs** | Deployment guides, model-swap tutorials, architecture explainers. |

---

## Adding a model backend

The analyzer is designed so that model swaps don't ripple outward. To add one:

1. Add the model under `analyzer/app/models/`.
2. Expose a loader and a predict function matching the shape used by `chexnet.py`.
3. Select it via an environment variable (`MODEL_NAME`) rather than hardcoding.
4. Keep the `/analyze` response contract identical so the backend and frontend need no changes.
5. Document the model's training data, intended modality, and known limitations in your PR — this is required, not optional.

---

## Reporting bugs

Use the [bug report template](https://github.com/palarnab/probable-sniffle/issues/new?template=bug_report.yml). Include the service that failed, relevant logs, and — critically — describe the input study **without** attaching identifiable data.

## Security issues

Do not open a public issue. Follow [SECURITY.md](SECURITY.md).

---

## Code of Conduct

Participation is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
