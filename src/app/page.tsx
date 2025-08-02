"use client";
import { useEffect, useRef, useState } from "react";
import { getPixels } from "@/actions/canvasActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PixelInfo = {
  color: string;
  owner: string;
  lastChanged: Date;
};

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 100;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixels, setPixels] = useState<Map<string, PixelInfo>>(new Map());
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastChanged, setLastChanged] = useState<{
    x: number;
    y: number;
    color: string;
    owner: string;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: 1200,
    height: 400,
  });

  const updateViewportSize = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setViewportSize({ width, height });
    }
  };

  useEffect(() => {
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  const BASE_PIXEL_SIZE = viewportSize.width / CANVAS_WIDTH;
  const MIN_ZOOM = 1; // Can't zoom out below fit-to-container

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pixelSize = BASE_PIXEL_SIZE * zoom;

    // Draw Pixels
    pixels.forEach((info, key) => {
      const [x, y] = key.split(",").map(Number);
      ctx.fillStyle = info.color;
      ctx.fillRect(
        x * pixelSize - offset.x,
        y * pixelSize - offset.y,
        pixelSize,
        pixelSize
      );
    });

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i++) {
      const gx = i * pixelSize - offset.x;
      if (gx >= 0 && gx <= viewportSize.width) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, viewportSize.height);
        ctx.stroke();
      }
    }
    for (let j = 0; j <= CANVAS_HEIGHT; j++) {
      const gy = j * pixelSize - offset.y;
      if (gy >= 0 && gy <= viewportSize.height) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(viewportSize.width, gy);
        ctx.stroke();
      }
    }

    // Highlight Hovered Pixel
    if (hovered) {
      ctx.save();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 8;
      ctx.strokeRect(
        hovered.x * pixelSize - offset.x,
        hovered.y * pixelSize - offset.y,
        pixelSize,
        pixelSize
      );
      ctx.restore();
    }
  }, [pixels, hovered, zoom, offset, viewportSize]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const pixelSize = BASE_PIXEL_SIZE * zoom;
    const x = Math.floor((e.clientX - rect.left + offset.x) / pixelSize);
    const y = Math.floor((e.clientY - rect.top + offset.y) / pixelSize);

    if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
      setHovered({ x, y });
    } else {
      setHovered(null);
    }

    if (isDragging) {
      const gridPxW = CANVAS_WIDTH * pixelSize;
      const gridPxH = CANVAS_HEIGHT * pixelSize;
      setOffset((prev) => ({
        x: clamp(
          prev.x - e.movementX,
          0,
          Math.max(gridPxW - viewportSize.width, 0)
        ),
        y: clamp(
          prev.y - e.movementY,
          0,
          Math.max(gridPxH - viewportSize.height, 0)
        ),
      }));
    }
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setIsDragging(false);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;

    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 10);
    } else {
      newZoom = Math.max(zoom / zoomFactor, MIN_ZOOM);
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const prevPixelSize = BASE_PIXEL_SIZE * zoom;
    const nextPixelSize = BASE_PIXEL_SIZE * newZoom;

    const gridPxW = CANVAS_WIDTH * nextPixelSize;
    const gridPxH = CANVAS_HEIGHT * nextPixelSize;

    let centerX = offset.x + mouseX;
    let centerY = offset.y + mouseY;

    setZoom(newZoom);
    setOffset({
      x: clamp(
        centerX * (nextPixelSize / prevPixelSize) - mouseX,
        0,
        Math.max(gridPxW - viewportSize.width, 0)
      ),
      y: clamp(
        centerY * (nextPixelSize / prevPixelSize) - mouseY,
        0,
        Math.max(gridPxH - viewportSize.height, 0)
      ),
    });
  };

  const handleCanvasClick = () => {
    if (!hovered) return;
    const key = `${hovered.x},${hovered.y}`;
    const color = "#3498db";
    const owner = "0x123...abc";
    const info: PixelInfo = {
      color,
      owner,
      lastChanged: new Date(),
    };
    setPixels((prev) => new Map(prev).set(key, info));
    setLastChanged({
      x: hovered.x,
      y: hovered.y,
      color,
      owner,
    });
  };

  async function fetchPixelsData() {
    try {
      const res = await getPixels();
      if (res.success) {
        const pixelMap = new Map<string, PixelInfo>();
        res.pixels?.forEach((p) => {
          pixelMap.set(`${p.x},${p.y}`, {
            color: p.color,
            owner: "fetched",
            lastChanged: new Date(),
          });
        });
        setPixels(pixelMap);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Error fetching pixels:", err);
    }
  }

  useEffect(() => {
    fetchPixelsData();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  p-4">
      <Card>
        <div
          ref={containerRef}
          className="w-full max-w-[1200px] aspect-[3/1] border-2 border-gray-300 bg-white shadow-md overflow-hidden relative"
        >
          <canvas
            ref={canvasRef}
            width={viewportSize.width}
            height={viewportSize.height}
            className={`w-full h-full ${
              isDragging ? "cursor-grabbing" : "cursor-pointer"
            }`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
          />
        </div>
      </Card>

      <div className="mt-6 flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        <div className="flex-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
          <h3 className="text-lg font-semibold mb-2">Last Changed Pixel</h3>
          {lastChanged ? (
            <div>
              <strong>
                ({lastChanged.x}, {lastChanged.y})
              </strong>{" "}
              colored{" "}
              <span className="font-bold" style={{ color: lastChanged.color }}>
                {lastChanged.color}
              </span>{" "}
              by <span className="text-gray-600">{lastChanged.owner}</span>
            </div>
          ) : (
            <div className="text-gray-500">No pixel changed yet.</div>
          )}
        </div>

        <div className="flex-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
          <h3 className="text-lg font-semibold mb-2">Active Pixel</h3>
          {hovered ? (
            <div>
              <strong>
                ({hovered.x}, {hovered.y})
              </strong>
            </div>
          ) : (
            <div className="text-gray-500">No active pixel</div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={fetchPixelsData}>Refresh Pixels</Button>
      </div>
    </div>
  );
}
