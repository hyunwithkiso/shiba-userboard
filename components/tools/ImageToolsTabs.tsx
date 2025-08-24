"use client";

import React, { useState } from "react";
import GifToWebpConverter from "@/components/tools/GifToWebpConverter";
import { Button } from "@/components/ui/button";

export default function ImageToolsTabs() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="default">GIF → WEBP</Button>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <GifToWebpConverter />
      </div>
    </div>
  );
}
