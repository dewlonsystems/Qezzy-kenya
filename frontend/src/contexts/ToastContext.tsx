// src/contexts/ToastContext.tsx
import { createContext, useContext, useState, type ReactNode, } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-3 w-full max-w-xs pointer-events-none">
        {toasts.map((toast) => (
          <ToastMessage
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastMessage = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  // Use your brand colors
  const bgColor =
    toast.type === 'success'
      ? 'bg-green-50 border-l-green-500 text-green-800'
      : toast.type === 'error'
      ? 'bg-red-50 border-l-red-500 text-red-800'
      : 'bg-amber-50 border-l-amber-500 text-amber-800';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-sm ${bgColor} animate-fade-in-up`}
      role="alert"
    >
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-current opacity-70 hover:opacity-100 focus:outline-none"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};