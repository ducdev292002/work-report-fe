import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

const ConfirmContext = createContext(null);

// App-wide replacement for window.confirm(): call `const ok = await confirm({...})`
// from any component and a styled modal (instead of the browser's native
// dialog) opens; the returned promise resolves true/false on Xác nhận/Hủy.
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: opts.title || 'Xác nhận',
        message: opts.message,
        confirmLabel: opts.confirmLabel || 'Xác nhận',
        cancelLabel: opts.cancelLabel || 'Hủy',
        danger: opts.danger ?? false,
      });
    });
  }, []);

  function settle(result) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => settle(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-popover max-w-sm w-full p-5"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  state.danger ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-600'
                }`}
              >
                {state.danger ? <AlertTriangle size={18} /> : <HelpCircle size={18} />}
              </div>
              <div className="min-w-0 pt-1">
                <h3 className="text-sm font-semibold text-gray-800">{state.title}</h3>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{state.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => settle(false)} className="btn-secondary">
                {state.cancelLabel}
              </button>
              <button
                onClick={() => settle(true)}
                className={state.danger ? 'btn-danger' : 'btn-primary'}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
