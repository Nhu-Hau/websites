"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import BaselineModal from "./BaselineModal";

export default function BaselineModalWrapper() {
  const [open, setOpen] = useState(false);
  const [baselineData, setBaselineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const lastPathnameRef = useRef<string | null>(null);

  const checkBaseline = async () => {
    try {
      const res = await fetch("/api/profile/assessment-baseline", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        console.log("[BaselineModalWrapper] Baseline data:", data);
        setBaselineData(data);
        // Hiển thị modal nếu chưa khai báo (null hoặc undefined)
        // Lưu ý: "unknown" được coi là đã điền (user đã chọn và lưu)
        // Users hiện có có "unknown" từ default cũ sẽ không thấy modal
        // Để fix, cần migration script hoặc để user tự reset
        const shouldShow = data.currentToeicSource === null || data.currentToeicSource === undefined;
        console.log("[BaselineModalWrapper] Should show modal:", shouldShow, "currentToeicSource:", data.currentToeicSource);
        setOpen(shouldShow);
      }
    } catch (e) {
      console.error("Failed to fetch baseline", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBaseline();
  }, []);

  // Check lại mỗi khi vào dashboard
  useEffect(() => {
    const isDashboard = pathname?.includes("/dashboard");
    console.log("[BaselineModalWrapper] Pathname changed:", pathname, "isDashboard:", isDashboard);
    
    // Nếu đang ở dashboard, check lại baseline
    if (isDashboard) {
      console.log("[BaselineModalWrapper] On dashboard, checking baseline...");
      checkBaseline();
    }
    
    lastPathnameRef.current = pathname || null;
  }, [pathname]);

  const handleClose = () => {
    // Không cho phép đóng nếu chưa lưu - chỉ đóng khi đã lưu thành công
    // Function này chỉ được gọi sau khi onSave đã chạy
    setOpen(false);
  };

  const handleSave = async () => {
    // Refresh data sau khi lưu để đảm bảo modal không hiện lại
    try {
      const res = await fetch("/api/profile/assessment-baseline", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setBaselineData(data);
        // Modal sẽ tự đóng thông qua onClose() sau khi lưu thành công
      }
    } catch (e) {
      console.error("Failed to refresh baseline", e);
    }
  };

  return (
    <BaselineModal
      open={open}
      onClose={handleClose}
      onSave={handleSave}
      initialData={baselineData}
    />
  );
}

