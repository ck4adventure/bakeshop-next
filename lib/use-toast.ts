import { useState } from 'react';

const TOAST_DURATION = 2800;

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), TOAST_DURATION);
  };
  return { toast, showToast };
}
