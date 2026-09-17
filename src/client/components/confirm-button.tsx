import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * A destructive button that asks inline before acting. Native confirm() is
 * blocked when the app runs inside an embedded workspace frame, where it
 * silently returns false and the delete never happens.
 */
export function ConfirmButton({
  prompt,
  confirmLabel = "Delete",
  onConfirm,
  children,
  ...button
}: Omit<ButtonProps, "onClick"> & {
  prompt: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const [asking, setAsking] = useState(false);
  if (asking) {
    return (
      <span role="group" aria-label={prompt} className="mr-auto inline-flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{prompt}</span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => {
            setAsking(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAsking(false)}>
          Cancel
        </Button>
      </span>
    );
  }
  return (
    <Button type="button" {...button} onClick={() => setAsking(true)}>
      {children}
    </Button>
  );
}
