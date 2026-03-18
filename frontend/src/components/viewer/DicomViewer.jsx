import { useEffect, useRef, useCallback, useState } from 'react';
import { ImageOff, AlertTriangle } from 'lucide-react';
import {
  initCornerstone,
  RenderingEngine,
  Enums,
  cornerstoneTools,
  dicomImageLoader,
} from '@/lib/cornerstone';
import useViewerStore from '@/stores/viewerStore';

const RENDERING_ENGINE_ID = 'radiologyCopilotEngine';
const VIEWPORT_ID = 'mainViewport';
const TOOLGROUP_ID = 'mainToolGroup';

const {
  WindowLevelTool,
  ZoomTool,
  PanTool,
  LengthTool,
  ToolGroupManager,
  Enums: ToolEnums,
} = cornerstoneTools;

const TOOL_MAP = {
  windowLevel: WindowLevelTool.toolName,
  zoom: ZoomTool.toolName,
  pan: PanTool.toolName,
  length: LengthTool.toolName,
};

export default function DicomViewer() {
  const elementRef = useRef(null);
  const engineRef = useRef(null);
  const toolGroupRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const file = useViewerStore((s) => s.currentFile);
  const activeTool = useViewerStore((s) => s.activeTool);
  const setViewportData = useViewerStore((s) => s.setViewportData);

  const setup = useCallback(async () => {
    await initCornerstone();

    cornerstoneTools.addTool(WindowLevelTool);
    cornerstoneTools.addTool(ZoomTool);
    cornerstoneTools.addTool(PanTool);
    cornerstoneTools.addTool(LengthTool);

    const engine = new RenderingEngine(RENDERING_ENGINE_ID);
    engineRef.current = engine;

    engine.enableElement({
      viewportId: VIEWPORT_ID,
      type: Enums.ViewportType.STACK,
      element: elementRef.current,
      defaultOptions: {
        background: [0.059, 0.059, 0.102],
      },
    });

    const toolGroup =
      ToolGroupManager.getToolGroup(TOOLGROUP_ID) ??
      ToolGroupManager.createToolGroup(TOOLGROUP_ID);
    toolGroupRef.current = toolGroup;

    toolGroup.addTool(WindowLevelTool.toolName);
    toolGroup.addTool(ZoomTool.toolName);
    toolGroup.addTool(PanTool.toolName);
    toolGroup.addTool(LengthTool.toolName);

    toolGroup.addViewport(VIEWPORT_ID, RENDERING_ENGINE_ID);

    toolGroup.setToolActive(WindowLevelTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
    });
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }],
    });
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
    });

    setReady(true);
  }, []);

  useEffect(() => {
    setup().catch((err) =>
      console.error('[DicomViewer] Setup failed:', err),
    );

    const el = elementRef.current;
    let resizeObserver;
    if (el) {
      resizeObserver = new ResizeObserver(() => {
        if (engineRef.current) {
          engineRef.current.resize(true);
        }
      });
      resizeObserver.observe(el);
    }

    return () => {
      resizeObserver?.disconnect();
      if (toolGroupRef.current) {
        ToolGroupManager.destroyToolGroup(TOOLGROUP_ID);
        toolGroupRef.current = null;
      }
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [setup]);

  useEffect(() => {
    if (!ready || !file || !engineRef.current) return;

    setLoadError(null);

    const loadImage = async () => {
      try {
        const imageId = dicomImageLoader.wadouri.fileManager.add(file);
        const viewport = engineRef.current.getViewport(VIEWPORT_ID);

        const LOAD_TIMEOUT_MS = 30_000;
        const timeout = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(
              'Image decode timed out — the WASM codec may have failed to load.'
            )),
            LOAD_TIMEOUT_MS,
          ),
        );

        await Promise.race([viewport.setStack([imageId]), timeout]);

        engineRef.current.resize(true);
        viewport.render();

        const { columns, rows } = viewport.getImageData?.()?.dimensions ?? {};
        const { windowWidth, windowCenter } = viewport.getProperties?.() ?? {};
        setViewportData({ columns, rows, windowWidth, windowCenter });
      } catch (err) {
        const msg = err?.error?.message || err?.message || String(err);
        console.error('[DicomViewer] Failed to load image:', msg, err);
        setLoadError(msg);
      }
    };

    loadImage();
  }, [file, ready, setViewportData]);

  useEffect(() => {
    if (!toolGroupRef.current || !ready) return;

    const toolGroup = toolGroupRef.current;
    const cornerstoneName = TOOL_MAP[activeTool];
    if (!cornerstoneName) return;

    Object.values(TOOL_MAP).forEach((name) => {
      try {
        toolGroup.setToolPassive(name);
      } catch { /* tool may already be passive */ }
    });

    toolGroup.setToolActive(cornerstoneName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
    });
  }, [activeTool, ready]);

  return (
    <div className="relative flex-1 min-w-0 min-h-0 bg-bg overflow-hidden">
      <div ref={elementRef} className="w-full h-full" />
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none bg-bg/80">
          <div className="w-20 h-20 rounded-2xl bg-red-900/40 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-400" />
          </div>
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 text-sm font-medium">Failed to render DICOM</p>
            <p className="text-text-dim text-xs mt-1 break-words">{loadError}</p>
          </div>
        </div>
      )}
      {!file && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
          <div className="w-20 h-20 rounded-2xl bg-surface/60 flex items-center justify-center">
            <ImageOff size={36} className="text-text-dim" />
          </div>
          <div className="text-center">
            <p className="text-text-muted text-sm font-medium">No image loaded</p>
            <p className="text-text-dim text-xs mt-1">
              Drop a DICOM file or use the Upload panel
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
