"use client";
import { useEffect, useState } from "react";

export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 2000); // auto-hide after 2s
    return () => clearTimeout(t);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg text-sm transition-opacity duration-300"
    >
      {message}
    </div>
  );
}
