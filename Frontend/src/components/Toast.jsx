import { createContext, useCallback, useContext, useState } from "react"
import "./components.scss"

const ToastContext = createContext(null)

// Small notification popups in the bottom-right corner.
// Usage: const toast = useToast(); toast.success("Saved!"); toast.error("Oops")
export const ToastProvider = ({ children }) => {
    const [ toasts, setToasts ] = useState([])

    const push = useCallback((type, message) => {
        const id = Math.random().toString(36).slice(2)
        setToasts(t => [ ...t, { id, type, message } ])
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    }, [])

    const api = {
        success: (m) => push("success", m),
        error: (m) => push("error", m),
        info: (m) => push("info", m),
    }

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className='toast-stack' role='status' aria-live='polite'>
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast--${t.type}`}>{t.message}</div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const ctx = useContext(ToastContext)
    // fallback so components never crash if used outside the provider
    return ctx || { success: () => {}, error: () => {}, info: () => {} }
}
