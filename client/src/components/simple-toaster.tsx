import React from "react";

// Simple toast system without external dependencies
interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36);
  const newToast = { id, ...props };
  
  toasts.push(newToast);
  notify();
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      notify();
    }
  }, 5000);
  
  return {
    id,
    dismiss: () => {
      const index = toasts.findIndex(t => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        notify();
      }
    }
  };
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = React.useState<Toast[]>([]);
  
  React.useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);
  
  return {
    toasts: currentToasts,
    toast
  };
}

export function SimpleToaster() {
  const { toasts } = useToast();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full p-4 rounded-lg shadow-lg border
            ${toast.variant === "destructive" 
              ? "bg-red-50 border-red-200 text-red-800" 
              : "bg-white border-gray-200 text-gray-900"
            }
          `}
        >
          {toast.title && (
            <div className="font-semibold text-sm mb-1">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-xs opacity-90">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}