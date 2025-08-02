"use server";
import Pixel from "@/models/pixelModel";
import dbConnect from "@/utils/dbConnect";
type getResponse = {
  success: boolean;
  pixels?: Array<{
    x: number;
    y: number;
    color: string;
    walletAddress: string;
    lastUpdated: Date;
  }>;
  error?: string;
};
export async function getPixels(): Promise<getResponse> {
  await dbConnect();
  try {
    const pixels = await Pixel.find({});
    return {
      success: true,
      pixels: pixels,
    };
  } catch (err) {
    return {
      success: false,
      error: "Failed to fetch pixels",
    };
  }
}

export async function changePixelColor(
  x: number,
  y: number,
  color: string,
  walletAddress: string
): Promise<getResponse> {
  await dbConnect();
  try {
    const pixel = await Pixel.findOneAndUpdate(
      { x, y },
      { color, walletAddress, lastUpdated: new Date() },
      { new: true, upsert: true }
    ).lean(); // Optional: makes returned object a plain JS object

    return {
      success: true,
    };
  } catch (err) {
    console.error("Error updating pixel:", err);
    return {
      success: false,
      error: "Failed to change pixel color",
    };
  }
}
