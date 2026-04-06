import { useEffect, useRef, useCallback, useState } from 'react';
import { Box, AlertTriangle } from 'lucide-react';
import {
  initCornerstone,
  RenderingEngine,
  Enums,
  cornerstoneTools,
  dicomImageLoader,
  volumeLoader,
  imageLoader,
  metaData,
} from '@/lib/cornerstone';
import useVolumeStore from '@/stores/volumeStore';

const ENGINE_ID = 'volumeRenderingEngine';
const VOLUME_ID_PREFIX = 'cornerstoneStreamingImageVolume:vol_';
const TOOLGROUP_ID = 'volumeToolGroup';

const {
  WindowLevelTool,
  ZoomTool,
  PanTool,
  CrosshairsTool,
  StackScrollTool,
  ToolGroupManager,
  Enums: ToolEnums,
} = cornerstoneTools;

const TOOL_MAP = {
  windowLevel: WindowLevelTool.toolName,
  zoom: ZoomTool.toolName,
  pan: PanTool.toolName,
  crosshairs: CrosshairsTool?.toolName,
  scroll: StackScrollTool?.toolName,
};

const MPR_VIEWS = [
  { id: 'axial', label: 'Axial', orientation: Enums.OrientationAxis.AXIAL },
  { id: 'sagittal', label: 'Sagittal', orientation: Enums.OrientationAxis.SAGITTAL },
  { id: 'coronal', label: 'Coronal', orientation: Enums.OrientationAxis.CORONAL },
];

let volumeCounter = 0;

export default function VolumeViewer() {
  const axialRef = useRef(null);
  const sagittalRef = useRef(null);
  const coronalRef = useRef(null);
  const engineRef = useRef(null);
  const toolGroupRef = useRef(null);
  const volumeIdRef = useRef(null);
  const spatialProviderRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [viewLabel, setViewLabel] = useState({});
  const [loadError, setLoadError] = useState(null);

  const files = useVolumeStore((s) => s.files);
  const activeTool = useVolumeStore((s) => s.activeTool);
  const setLoading = useVolumeStore((s) => s.setLoading);
  const setLoadProgress = useVolumeStore((s) => s.setLoadProgress);

  const setup = useCallback(async () => {
    await initCornerstone();

    [WindowLevelTool, ZoomTool, PanTool, StackScrollTool, CrosshairsTool].forEach((Tool) => {
      if (Tool) {
        try { cornerstoneTools.addTool(Tool); } catch { /* already registered */ }
      }
    });

    const engine = new RenderingEngine(ENGINE_ID);
    engineRef.current = engine;

    const viewportInputs = [
      {
        viewportId: 'axial',
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element: axialRef.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.AXIAL,
          background: [0.059, 0.059, 0.102],
        },
      },
      {
        viewportId: 'sagittal',
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element: sagittalRef.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.SAGITTAL,
          background: [0.059, 0.059, 0.102],
        },
      },
      {
        viewportId: 'coronal',
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element: coronalRef.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.CORONAL,
          background: [0.059, 0.059, 0.102],
        },
      },
    ];

    engine.setViewports(viewportInputs);

    const toolGroup =
      ToolGroupManager.getToolGroup(TOOLGROUP_ID) ??
      ToolGroupManager.createToolGroup(TOOLGROUP_ID);
    toolGroupRef.current = toolGroup;

    [WindowLevelTool, ZoomTool, PanTool, StackScrollTool, CrosshairsTool].forEach((Tool) => {
      if (Tool) {
        try { toolGroup.addTool(Tool.toolName); } catch { /* already added */ }
      }
    });

    toolGroup.addViewport('axial', ENGINE_ID);
    toolGroup.addViewport('sagittal', ENGINE_ID);
    toolGroup.addViewport('coronal', ENGINE_ID);

    toolGroup.setToolActive(WindowLevelTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
    });
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }],
    });
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
    });
    if (StackScrollTool) {
      toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }],
      });
    }

    setReady(true);
  }, []);

  useEffect(() => {
    setup().catch((err) => console.error('[VolumeViewer] Setup failed:', err));

    const els = [axialRef.current, sagittalRef.current, coronalRef.current];
    const observers = els.map((el) => {
      if (!el) return null;
      const obs = new ResizeObserver(() => {
        engineRef.current?.resize(true);
      });
      obs.observe(el);
      return obs;
    });

    return () => {
      observers.forEach((obs) => obs?.disconnect());
      if (spatialProviderRef.current) {
        metaData.removeProvider(spatialProviderRef.current);
        spatialProviderRef.current = null;
      }
      if (toolGroupRef.current) {
        try { ToolGroupManager.destroyToolGroup(TOOLGROUP_ID); } catch { /* ignore */ }
        toolGroupRef.current = null;
      }
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [setup]);

  useEffect(() => {
    if (!ready || !files || files.length === 0 || !engineRef.current) return;

    const loadVolume = async () => {
      setLoading(true);
      setLoadProgress(0);
      setLoadError(null);

      try {
        const candidateIds = [];
        for (const file of files) {
          const imageId = dicomImageLoader.wadouri.fileManager.add(file);
          candidateIds.push(imageId);
        }

        // Parse every DICOM file so the metadata cache is populated.
        // Files without pixel data (DICOMDIR, SR, PR, etc.) are
        // silently skipped instead of aborting the whole volume load.
        let prefetched = 0;
        const total = candidateIds.length;
        const results = await Promise.allSettled(
          candidateIds.map((id) =>
            imageLoader.loadAndCacheImage(id).then(() => {
              prefetched += 1;
              setLoadProgress(Math.round((prefetched / total) * 50));
              return id;
            }),
          ),
        );

        const imageIds = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);

        const skipped = total - imageIds.length;
        if (skipped > 0) {
          console.warn(
            `[VolumeViewer] Skipped ${skipped}/${total} file(s) without pixel data`,
          );
        }

        if (imageIds.length === 0) {
          throw new Error(
            'None of the uploaded files contain displayable pixel data. ' +
            'Ensure the series contains actual image slices (CT/MRI/etc.).',
          );
        }

        // Remove any previous fallback provider from an earlier load.
        if (spatialProviderRef.current) {
          metaData.removeProvider(spatialProviderRef.current);
          spatialProviderRef.current = null;
        }

        // Some DICOM files (secondary captures, certain US/CR, older exports)
        // lack Image Orientation Patient / Image Position Patient tags.
        // The volume loader crashes on undefined, so we supply sensible
        // defaults: axial orientation, 1 mm spacing, sequential z positions
        // ordered by DICOM instance number.
        const firstPlane = metaData.get('imagePlaneModule', imageIds[0]);
        const needsSpatialFallback =
          !firstPlane?.imageOrientationPatient || !firstPlane?.imagePositionPatient;

        if (needsSpatialFallback) {
          const instances = imageIds.map((id) => ({
            id,
            instanceNumber:
              metaData.get('generalImageModule', id)?.instanceNumber ?? 0,
          }));
          instances.sort((a, b) => a.instanceNumber - b.instanceNumber);
          imageIds.length = 0;
          imageIds.push(...instances.map((i) => i.id));

          const enriched = new Map();
          const pixelSpacing = firstPlane?.pixelSpacing ?? [1, 1];

          imageIds.forEach((id, idx) => {
            const existing = metaData.get('imagePlaneModule', id) || {};
            enriched.set(id, {
              ...existing,
              imageOrientationPatient:
                existing.imageOrientationPatient ?? [1, 0, 0, 0, 1, 0],
              rowCosines: existing.rowCosines ?? [1, 0, 0],
              columnCosines: existing.columnCosines ?? [0, 1, 0],
              imagePositionPatient:
                existing.imagePositionPatient ?? [0, 0, idx],
              pixelSpacing: existing.pixelSpacing ?? pixelSpacing,
              rowPixelSpacing: existing.rowPixelSpacing ?? pixelSpacing[0],
              columnPixelSpacing: existing.columnPixelSpacing ?? pixelSpacing[1],
              sliceThickness: existing.sliceThickness ?? 1,
              sliceLocation: existing.sliceLocation ?? idx,
              frameOfReferenceUID:
                existing.frameOfReferenceUID ?? '1.2.826.0.1.3680043.8.1055.1',
            });
          });

          const fallback = (type, imageId) => {
            if (type === 'imagePlaneModule' && enriched.has(imageId)) {
              return enriched.get(imageId);
            }
          };
          metaData.addProvider(fallback, 20000);
          spatialProviderRef.current = fallback;
        }

        volumeCounter += 1;
        const volumeId = `${VOLUME_ID_PREFIX}${volumeCounter}`;
        volumeIdRef.current = volumeId;

        const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });

        let loaded = 0;
        volume.load((evt) => {
          loaded += 1;
          setLoadProgress(50 + Math.round((loaded / imageIds.length) * 50));
        });

        const engine = engineRef.current;
        await Promise.all(
          ['axial', 'sagittal', 'coronal'].map(async (vpId) => {
            const viewport = engine.getViewport(vpId);
            await viewport.setVolumes([{ volumeId }]);
            viewport.render();
          }),
        );

        setViewLabel({
          axial: `Axial — ${imageIds.length} slices`,
          sagittal: 'Sagittal',
          coronal: 'Coronal',
        });

        engine.resize(true);
        engine.renderViewports(['axial', 'sagittal', 'coronal']);
      } catch (err) {
        const msg = err?.error?.message || err?.message || String(err);
        console.error('[VolumeViewer] Failed to load volume:', msg, err);
        setLoadError(msg);
      } finally {
        setLoading(false);
        setLoadProgress(100);
      }
    };

    loadVolume();
  }, [files, ready, setLoading, setLoadProgress]);

  useEffect(() => {
    if (!toolGroupRef.current || !ready) return;

    const toolGroup = toolGroupRef.current;
    const cornerstoneName = TOOL_MAP[activeTool];
    if (!cornerstoneName) return;

    Object.values(TOOL_MAP).forEach((name) => {
      if (!name) return;
      try { toolGroup.setToolPassive(name); } catch { /* ignore */ }
    });

    toolGroup.setToolActive(cornerstoneName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
    });
  }, [activeTool, ready]);

  const emptyState = !files || files.length === 0;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="grid grid-cols-2 grid-rows-2 gap-px bg-border w-full h-full">
        {MPR_VIEWS.map(({ id, label }) => (
          <div key={id} className="relative bg-bg overflow-hidden">
            <div
              ref={id === 'axial' ? axialRef : id === 'sagittal' ? sagittalRef : coronalRef}
              className="w-full h-full"
            />
            <div className="absolute top-2 left-2 px-2 py-1 rounded bg-surface/80 text-[11px] font-mono text-text-muted pointer-events-none">
              {viewLabel[id] || label}
            </div>
          </div>
        ))}

        <div className="relative bg-bg overflow-hidden flex items-center justify-center">
          <div className="text-center space-y-2">
            <Box size={32} className="text-primary mx-auto" />
            <p className="text-xs text-text-muted font-medium">3D MPR Viewer</p>
            <p className="text-[11px] text-text-dim">
              Scroll in each panel to navigate slices
            </p>
          </div>
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-surface/80 text-[11px] font-mono text-text-muted pointer-events-none">
            Info
          </div>
        </div>
      </div>

      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none bg-bg/80">
          <div className="w-20 h-20 rounded-2xl bg-red-900/40 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-400" />
          </div>
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 text-sm font-medium">Failed to load volume</p>
            <p className="text-text-dim text-xs mt-1 break-words">{loadError}</p>
          </div>
        </div>
      )}
      {emptyState && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none bg-bg/80">
          <div className="w-20 h-20 rounded-2xl bg-surface/60 flex items-center justify-center">
            <Box size={36} className="text-text-dim" />
          </div>
          <div className="text-center">
            <p className="text-text-muted text-sm font-medium">No volume loaded</p>
            <p className="text-text-dim text-xs mt-1">
              Upload a DICOM series (CT, MRI, etc.) to view in 3D
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
