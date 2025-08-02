"use client";
// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixel, setPixel] = useState<Map<string, string>>(new Map());
  const canvasSize = 1000;
  const pixelSize = 3;

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
