"use client";

import { toast } from "sonner";

export function confirmWithToast(
  message: string,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;

    toast(message, {
      duration: 10000,
      action: {
        label: confirmLabel,
        onClick: () => {
          resolved = true;
          resolve(true);
        },
      },
      cancel: {
        label: cancelLabel,
        onClick: () => {
          resolved = true;
          resolve(false);
        },
      },
      onDismiss: () => {
        if (!resolved) {
          resolve(false);
        }
      },
    });
  });
}
