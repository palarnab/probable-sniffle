import { useEffect, useRef, useState } from 'react';
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

function waitForElementDimensions(el) {
  return new Promise((resolve) => {
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      resolve();
      return;
    }
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        ro.disconnect();
        resolve();
      }
    });
    ro.observe(el);
  });
}

export default function DicomViewer() {
  const elementRef = useRef(null);
  const engineRef = useRef(null);
  const toolGroupRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const file = useViewerStore((s) => s.currentFile);
  const activeTool = useViewerStore((s) => s.activeTool);
  const setViewportData = useViewerStore((s) => s.setViewportData);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    let cancelled = false;
    let resizeObserver;

    const setup = async () => {
      await initCornerstone();
      if (cancelled) return;

      await waitForElementDimensions(el);
      if (cancelled) return;

      [WindowLevelTool, ZoomTool, PanTool, LengthTool].forEach((Tool) => {
        try { cornerstoneTools.addTool(Tool); } catch { /* already registered */ }
      });

      const engine = new RenderingEngine(RENDERING_ENGINE_ID);
      engineRef.current = engine;

      engine.enableElement({
        viewportId: VIEWPORT_ID,
        type: Enums.ViewportType.STACK,
        element: el,
        defaultOptions: {
          background: [0.059, 0.059, 0.102],
        },
      });

      const toolGroup =
        ToolGroupManager.getToolGroup(TOOLGROUP_ID) ??
        ToolGroupManager.createToolGroup(TOOLGROUP_ID);
      toolGroupRef.current = toolGroup;

      [WindowLevelTool, ZoomTool, PanTool, LengthTool].forEach((Tool) => {
        try { toolGroup.addTool(Tool.toolName); } catch { /* already added */ }
      });

      toolGroup.addViewport(VIEWPORT_ID, RENDERING_ENGINE_ID);

      if (!cancelled) setReady(true);
    };

    resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (width > 0 && height > 0 && engineRef.current) {
        engineRef.current.resize(true);
      }
    });
    resizeObserver.observe(el);

    setup().catch((err) =>
      console.error('[DicomViewer] Setup failed:', err),
    );

    return () => {
      cancelled = true;
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
  }, []);

  useEffect(() => {
    if (!ready || !file || !engineRef.current) return;

    setLoadError(null);
    setImageLoaded(false);
    let cancelled = false;

    const loadImage = async () => {
      try {
        const imageId = dicomImageLoader.wadouri.fileManager.add(file);
        const viewport = engineRef.current?.getViewport(VIEWPORT_ID);
        if (!viewport) throw new Error('Viewport not available');

        const LOAD_TIMEOUT_MS = 60_000;
        const timeout = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(
              'Image decode timed out — the WASM codec may have failed to load.'
            )),
            LOAD_TIMEOUT_MS,
          ),
        );

        await Promise.race([viewport.setStack([imageId]), timeout]);
        if (cancelled) return;

        engineRef.current?.resize(true);
        viewport.render();

        const { columns, rows } = viewport.getImageData?.()?.dimensions ?? {};
        const { windowWidth, windowCenter } = viewport.getProperties?.() ?? {};
        setViewportData({ columns, rows, windowWidth, windowCenter });
        setImageLoaded(true);
      } catch (err) {
        if (cancelled) return;
        const msg = err?.error?.message || err?.message || String(err);
        console.error('[DicomViewer] Failed to load image:', msg, err);
        setLoadError(msg);
      }
    };

    loadImage();
    return () => { cancelled = true; };
  }, [file, ready, setViewportData]);

  useEffect(() => {
    if (!toolGroupRef.current || !ready || !imageLoaded) return;

    const toolGroup = toolGroupRef.current;

    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }],
    });
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
    });

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
  }, [activeTool, ready, imageLoaded]);

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
