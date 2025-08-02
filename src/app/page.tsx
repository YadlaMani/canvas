"use client";
// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from "next/image";
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
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    <div className={"pages"}>
      <canvas
        ref={canvasRef}
        width={canvasSize * pixelSize}
        height={canvasSize * pixelSize}
        className="border"
      />
    </div>
  );
}
