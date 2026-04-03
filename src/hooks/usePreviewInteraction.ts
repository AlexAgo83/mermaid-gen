import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { RenderState, Viewport } from "@/lib/app-types";
import type { SvgMetrics } from "@/lib/mermaid";

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.4;

function isInteractivePreviewTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest("button, input, textarea, select, a") !== null
  );
}

function clampScale(nextScale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
}

function centerViewport(
  container: HTMLElement,
  metrics: SvgMetrics,
  scale: number,
): Viewport {
  const x = (container.clientWidth - metrics.width * scale) / 2;
  const y = (container.clientHeight - metrics.height * scale) / 2;

  return { scale, x, y };
}

function fitViewport(container: HTMLElement, metrics: SvgMetrics): Viewport {
  const widthScale = container.clientWidth / metrics.width;
  const heightScale = container.clientHeight / metrics.height;
  const scale = clampScale(Math.min(widthScale, heightScale) * 0.92);

  return centerViewport(container, metrics, scale);
}

export function calculateWheelZoomViewport(
  viewport: Viewport,
  cursorX: number,
  cursorY: number,
  deltaY: number,
) {
  const nextScale = clampScale(viewport.scale + (deltaY < 0 ? 0.12 : -0.12));
  const ratio = nextScale / viewport.scale;

  return {
    scale: nextScale,
    x: cursorX - (cursorX - viewport.x) * ratio,
    y: cursorY - (cursorY - viewport.y) * ratio,
  };
}

export function usePreviewInteraction(renderState: RenderState) {
  const [viewport, setViewport] = useState<Viewport>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    const container = previewRef.current;
    const applyFit = () => {
      setViewport(fitViewport(container, renderState.metrics));
    };

    applyFit();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      applyFit();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [renderState]);

  const handlePreviewWheel = useEffectEvent((event: WheelEvent) => {
    if (
      renderState.status !== "ready" ||
      !previewRef.current ||
      !event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    const rect = previewRef.current.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    setViewport((current) =>
      calculateWheelZoomViewport(current, cursorX, cursorY, event.deltaY),
    );
  });

  useEffect(() => {
    const previewElement = previewRef.current;

    if (!previewElement) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      handlePreviewWheel(event);
    };

    previewElement.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      previewElement.removeEventListener("wheel", onWheel);
    };
  }, []);

  const zoomPreview = (delta: number) => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    const nextScale = clampScale(viewport.scale + delta);
    setViewport(
      centerViewport(previewRef.current, renderState.metrics, nextScale),
    );
  };

  const resetPreview = () => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    setViewport(centerViewport(previewRef.current, renderState.metrics, 1));
  };

  const fitPreview = () => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    setViewport(fitViewport(previewRef.current, renderState.metrics));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      renderState.status !== "ready" ||
      isInteractivePreviewTarget(event.target)
    ) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    setViewport((current) => ({
      ...current,
      x: drag.originX + deltaX,
      y: drag.originY + deltaY,
    }));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const previewTransform = useMemo(
    () =>
      `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
    [viewport],
  );

  return {
    previewRef,
    previewTransform,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomPreview,
    resetPreview,
    fitPreview,
  };
}
