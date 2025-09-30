import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Limpa qualquer timer existente para o toast anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const id = Date.now().toString();
    setCurrentToast({ id, message, type });
    
    // Define um novo timer para remover o toast após 3 segundos
    timeoutRef.current = setTimeout(() => {
      setCurrentToast(null);
      timeoutRef.current = null;
    }, 3000);
  };

  const removeToast = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCurrentToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {currentToast && (
          <div
            key={currentToast.id}
            className={`px-4 py-3 rounded-md shadow-lg border max-w-sm ${
              currentToast.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : currentToast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm">{currentToast.message}</p>
              <button
                onClick={removeToast}
                className="ml-3 text-sm hover:opacity-70"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}