"use client";
import { useEffect, useRef, useState } from "react";
import type React from "react";

import { getPixels } from "@/actions/canvasActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type PixelInfo = {
  color: string;
  walletAddress: string;
  lastUpdated: Date;
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
    walletAddress: string;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: 1200,
    height: 400,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState("#c43e00ff");

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
  const MIN_ZOOM = 1;

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

    const centerX = offset.x + mouseX;
    const centerY = offset.y + mouseY;

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
    if (!hovered || isDragging) return;

    const key = `${hovered.x},${hovered.y}`;
    const currentPixel = pixels.get(key);

    setSelectedPixel(hovered);
    setSelectedColor(currentPixel?.color || "#ffffff");
    setDialogOpen(true);
  };

  const handleColorChange = () => {
    if (!selectedPixel) return;

    const key = `${selectedPixel.x},${selectedPixel.y}`;
    const walletAddress = "0x123...abc"; // This should come from your wallet connection

    const info: PixelInfo = {
      color: selectedColor,
      walletAddress,
      lastUpdated: new Date(),
    };

    setPixels((prev) => new Map(prev).set(key, info));
    setLastChanged({
      x: selectedPixel.x,
      y: selectedPixel.y,
      color: selectedColor,
      walletAddress,
    });

    setDialogOpen(false);
    setSelectedPixel(null);
  };

  async function fetchPixelsData() {
    try {
      const res = await getPixels();
      if (res.success) {
        const pixelMap = new Map<string, PixelInfo>();
        res.pixels?.forEach((p) => {
          pixelMap.set(`${p.x},${p.y}`, {
            color: p.color,
            walletAddress: p.walletAddress || "unknown",
            lastUpdated: new Date(p.lastUpdated || Date.now()),
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

  // Calculate top owner
  const ownerCount: Record<string, number> = {};
  pixels.forEach((info) => {
    ownerCount[info.walletAddress] = (ownerCount[info.walletAddress] || 0) + 1;
  });
  const topOwner = Object.entries(ownerCount).sort((a, b) => b[1] - a[1])[0];

  const selectedPixelInfo = selectedPixel
    ? pixels.get(`${selectedPixel.x},${selectedPixel.y}`)
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card>
        <div
          ref={containerRef}
          className="w-full max-w-[1200px] aspect-[3/1] border-2 border-gray-300 bg-white shadow-md overflow-hidden relative"
        >
          <canvas
            ref={canvasRef}
            width={viewportSize.width}
            height={viewportSize.height}
            className="w-full h-full"
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
        {/* Last Changed Pixel Card */}
        <Card className="flex-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
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
              by{" "}
              <span className="text-gray-600">{lastChanged.walletAddress}</span>
            </div>
          ) : (
            <div className="text-gray-500">No pixel changed yet.</div>
          )}
        </Card>
        {/* Active Pixel Card */}
        <Card className="flex-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
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
        </Card>
        {/* Top Owner Card */}
        <Card className="flex-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
          <h3 className="text-lg font-semibold mb-2">Top Owner</h3>
          {topOwner ? (
            <div>
              <span className="font-mono">{topOwner[0]}</span>
              <div className="text-sm text-gray-600">
                Pixels owned: <span className="font-bold">{topOwner[1]}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No owners yet.</div>
          )}
        </Card>
      </div>

      {/* Pixel Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Pixel{" "}
              {selectedPixel && `(${selectedPixel.x}, ${selectedPixel.y})`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Pixel Info */}
            {selectedPixelInfo && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">
                  Current Pixel Info
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-mono">
                      {selectedPixelInfo.walletAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span>
                      {selectedPixelInfo.lastUpdated.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Color:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: selectedPixelInfo.color }}
                      />
                      <span className="font-mono text-xs">
                        {selectedPixelInfo.color}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Color Picker */}
            <div className="space-y-3">
              <Label htmlFor="color-picker" className="text-sm font-medium">
                Choose New Color
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="color-picker"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-16 h-16 rounded-lg border border-gray-300 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Selected Color:</div>
                  <div className="font-mono text-sm">{selectedColor}</div>
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Colors</Label>
              <div className="grid grid-cols-8 gap-2">
                {[
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FFFF00",
                  "#FF00FF",
                  "#00FFFF",
                  "#FFA500",
                  "#800080",
                  "#FFC0CB",
                  "#A52A2A",
                  "#808080",
                  "#000000",
                  "#FFFFFF",
                  "#90EE90",
                  "#FFB6C1",
                  "#87CEEB",
                ].map((color) => (
                  <Button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      selectedColor === color
                        ? "border-gray-800 scale-110"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleColorChange}>Update Pixel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
