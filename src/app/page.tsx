"use client";
import { useEffect, useRef, useState } from "react";
import { getPixels } from "@/actions/canvasActions";
import { NextResponse } from "next/server";

type getResponse = {
  succcess: boolean;
  pixels?: Array<{
    x: number;
    y: number;
    color: string;
  }>;
  error?: string;
};

type PixelInfo = {
  color: string;
  owner: string;
  lastChanged: Date;
};

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 1000;
const BASE_PIXEL_SIZE = 2;
const VIEWPORT_WIDTH = 600;
const VIEWPORT_HEIGHT = 600;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function Home() {
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

  useEffect(() => {
    const pixelSize = BASE_PIXEL_SIZE * zoom;
    const gridPxW = CANVAS_WIDTH * pixelSize;
    const gridPxH = CANVAS_HEIGHT * pixelSize;
    const offsetX = clamp((gridPxW - VIEWPORT_WIDTH) / 2, 0, gridPxW - VIEWPORT_WIDTH);
    const offsetY = clamp((gridPxH - VIEWPORT_HEIGHT) / 2, 0, gridPxH - VIEWPORT_HEIGHT);
    setOffset({ x: offsetX, y: offsetY });
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelSize = BASE_PIXEL_SIZE * zoom;

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

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i++) {
      const gx = i * pixelSize - offset.x;
      if (gx >= 0 && gx <= VIEWPORT_WIDTH) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, VIEWPORT_HEIGHT);
        ctx.stroke();
      }
    }
    for (let j = 0; j <= CANVAS_HEIGHT; j++) {
      const gy = j * pixelSize - offset.y;
      if (gy >= 0 && gy <= VIEWPORT_HEIGHT) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(VIEWPORT_WIDTH, gy);
        ctx.stroke();
      }
    }

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
  }, [pixels, hovered, zoom, offset]);

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
      setOffset(prev => {
        let newX = clamp(prev.x - e.movementX, 0, Math.max(gridPxW - VIEWPORT_WIDTH, 0));
        let newY = clamp(prev.y - e.movementY, 0, Math.max(gridPxH - VIEWPORT_HEIGHT, 0));
        return { x: newX, y: newY };
      });
    }
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setIsDragging(false);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 10);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.2);
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
    let newOffsetX = clamp(centerX * (nextPixelSize / prevPixelSize) - mouseX, 0, Math.max(gridPxW - VIEWPORT_WIDTH, 0));
    let newOffsetY = clamp(centerY * (nextPixelSize / prevPixelSize) - mouseY, 0, Math.max(gridPxH - VIEWPORT_HEIGHT, 0));
    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
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

  const [pixel, setPixel] = useState<Map<string, string>>(new Map());
  const canvasSize = 1000;
  const pixelSize = 3;
  async function fetchPixelsData() {
    try {
      const res = await getPixels();
      if (res.success) {
        const pixels = res.pixels || [];
        const pixelMap = new Map<string, string>();
        pixels.forEach((p) => {
          pixelMap.set(`${p.x},${p.y}`, p.color);
        });
        setPixel(pixelMap);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.log("Error fetching pixels:", err);
    }
  }
  useEffect(() => {
    fetchPixelsData();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="w-[1200px] h-[600px] border-2 border-gray-300 bg-white shadow-md overflow-hidden relative">
        <canvas
          ref={canvasRef}
          height={CANVAS_HEIGHT}
          width={CANVAS_WIDTH}
          className={`block ${isDragging ? "cursor-grabbing" : "cursor-pointer"}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        />
      </div>

      {/* Info panels */}
      <div className="mt-6 flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        <div className="flex-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
          <h3 className="text-lg font-semibold mb-2">Last Changed Pixel</h3>
          {lastChanged ? (
            <div>
              <strong>
                ({lastChanged.x}, {lastChanged.y})
              </strong>{" "}
              colored <span className="font-bold" style={{ color: lastChanged.color }}>{lastChanged.color}</span>{" "}
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
    </div>
  );
}
