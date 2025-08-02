"use client";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { pay } from "@reown/appkit-pay";

import { getPixels, changePixelColor } from "@/actions/canvasActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useAppKitAccount } from "@reown/appkit/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const [recentEdits, setRecentEdits] = useState<
    { x: number; y: number; color: string; walletAddress: string; time: Date }[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<
    { walletAddress: string; count: number }[]
  >([]);

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState("#3498db");
  const { address, isConnected } = useAppKitAccount();

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

  const handleColorChange = async () => {
    if (!selectedPixel) return;
    if (!isConnected) {
      toast.error("Wallet Should be connected to change pixel color");
      return;
    }
    const key = `${selectedPixel.x},${selectedPixel.y}`;

    const result = await pay({
      recipient: process.env.NEXT_PUBLIC_FAT_WALLLET_ADDRESS!,
      amount: 0.1,
      paymentAsset: {
        network: "eip155:10143",
        asset: "native",
        metadata: {
          name: "Monad",
          symbol: "MON",
          decimals: 18,
        },
      },
    });
    if (result.success) {
      const info: PixelInfo = {
        color: selectedColor,
        walletAddress: address || "unknown",
        lastUpdated: new Date(),
      };

      setPixels((prev) => new Map(prev).set(key, info));
      setLastChanged({
        x: selectedPixel.x,
        y: selectedPixel.y,
        color: selectedColor,
        walletAddress: address || "unknown",
      });
      console.log(lastChanged);
      const res = await changePixelColor(
        selectedPixel.x,
        selectedPixel.y,
        selectedColor,
        address || "unknown"
      );
      if (res.success) {
        toast.success("Pixel color changed successfully!");
      } else {
        toast.error("Failed to change pixel color, please try again later.");
      }

      setDialogOpen(false);
      setSelectedPixel(null);
    } else {
      toast.error("Failed transaction,please try again later");
    }
  };

  async function fetchPixelsData() {
    try {
      const res = await getPixels();
      if (res.success) {
        const pixelMap = new Map<string, PixelInfo>();
        const walletPixelCount: Record<string, number> = {};
        const editList: {
          x: number;
          y: number;
          color: string;
          walletAddress: string;
          time: Date;
        }[] = [];

        res.pixels?.forEach((p) => {
          const key = `${p.x},${p.y}`;
          const updatedDate = new Date(p.lastUpdated || Date.now());

          pixelMap.set(key, {
            color: p.color,
            walletAddress: p.walletAddress || "unknown",
            lastUpdated: updatedDate,
          });

          const addr = p.walletAddress || "unknown";
          walletPixelCount[addr] = (walletPixelCount[addr] || 0) + 1;

          editList.push({
            x: p.x,
            y: p.y,
            color: p.color,
            walletAddress: addr,
            time: updatedDate,
          });
        });

        editList.sort((a, b) => b.time.getTime() - a.time.getTime());

        const leaderboardArray = Object.entries(walletPixelCount)
          .map(([walletAddress, count]) => ({ walletAddress, count }))
          .sort((a, b) => b.count - a.count);

        setPixels(pixelMap);
        setRecentEdits(editList.slice(0, 10));
        setLeaderboard(leaderboardArray);
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

  const ownerCount: Record<string, number> = {};
  pixels.forEach((info) => {
    ownerCount[info.walletAddress] = (ownerCount[info.walletAddress] || 0) + 1;
  });
  const topOwner = Object.entries(ownerCount).sort((a, b) => b[1] - a[1])[0];
  console.log(topOwner);

  const selectedPixelInfo = selectedPixel
    ? pixels.get(`${selectedPixel.x},${selectedPixel.y}`)
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {hovered && (
        <Card className="fixed bottom-8 right-8 w-64 p-4 shadow-lg z-50 space-y-3">
          <h4 className="text-base font-semibold">Hovered Pixel</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Coordinates:</span>
            <span className="font-mono">
              ({hovered.x}, {hovered.y})
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Color:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded border shadow-inner"
                style={{
                  backgroundColor:
                    pixels.get(`${hovered.x},${hovered.y}`)?.color || "#ffffff",
                }}
              />
              <span className="font-mono text-xs">
                {pixels.get(`${hovered.x},${hovered.y}`)?.color || "#ffffff"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Owner:</span>
            <span className="font-mono text-xs truncate max-w-[140px]">
              {pixels.get(`${hovered.x},${hovered.y}`)?.walletAddress || "—"}
            </span>
          </div>
        </Card>
      )}

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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="p-6 space-y-4 shadow-sm">
          <h3 className="text-xl font-semibold tracking-tight">Recent Edits</h3>
          <div className="space-y-3">
            {recentEdits.length === 0 ? (
              <div className="text-muted-foreground text-sm">No edits yet.</div>
            ) : (
              recentEdits.map((edit, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded border shadow-inner"
                      style={{ backgroundColor: edit.color }}
                    />
                    <span className="font-medium">
                      ({edit.x},{edit.y})
                    </span>
                  </div>
                  <div className="font-mono text-xs truncate max-w-[120px] text-right">
                    {edit.walletAddress}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4 shadow-sm">
          <h3 className="text-xl font-semibold tracking-tight">Leaderboard</h3>
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No entries yet.
              </div>
            ) : (
              leaderboard.slice(0, 10).map((entry, idx) => (
                <div
                  key={entry.walletAddress}
                  className="flex justify-between items-center text-sm border rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{idx + 1}.</span>
                    <span className="font-mono text-xs truncate max-w-[120px]">
                      {entry.walletAddress}
                    </span>
                  </div>
                  <span className="font-semibold">{entry.count} px</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Pixel{" "}
              {selectedPixel && `(${selectedPixel.x}, ${selectedPixel.y})`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
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
                  <div className="text-sm">Selected Color:</div>
                  <div className="font-mono text-sm">{selectedColor}</div>
                </div>
              </div>
            </div>
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
