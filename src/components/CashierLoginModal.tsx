"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface CashierLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: (employee: any) => void;
}

export default function CashierLoginModal({ isOpen, onClose }: CashierLoginModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      if (onClose) onClose();
      router.push("/login");
    }
  }, [isOpen, onClose, router]);

  return null;
}
