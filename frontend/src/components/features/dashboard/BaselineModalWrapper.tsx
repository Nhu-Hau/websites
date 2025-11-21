"use client";

import React, { useState, useEffect } from "react";
import BaselineModal from "./BaselineModal";

export default function BaselineModalWrapper() {
  const [open, setOpen] = useState(false);
  const [baselineData, setBaselineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBaseline = async () => {
      try {
        const res = await fetch("/api/profile/assessment-baseline", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setBaselineData(data);
          // Hiển thị modal nếu chưa khai báo
          if (data.currentToeicSource === "unknown") {
            setOpen(true);
          }
        }
      } catch (e) {
        console.error("Failed to fetch baseline", e);
      } finally {
        setLoading(false);
      }
    };

    checkBaseline();
  }, []);

  if (loading) return null;

  return (
    <BaselineModal
      open={open}
      onClose={() => setOpen(false)}
      initialData={baselineData}
    />
  );
}

