import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { id, message, type }]);
    window.setTimeout(() => remove(id), 4200);
  }, [remove]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => {
          const Icon = item.type === 'error' ? XCircle : item.type === 'info' ? Info : CheckCircle2;
          return <div className={`toast toast-${item.type}`} key={item.id}><Icon size={18}/><span>{item.message}</span><button onClick={() => remove(item.id)} aria-label="Dismiss"><X size={15}/></button></div>;
        })}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
