import { useEffect } from "react"
import "./components.scss"

/**
 * Simple dialog used for confirmations and small forms.
 * Closes on Escape or when clicking the dark backdrop.
 */
const Modal = ({ open, title, children, onClose, actions }) => {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === "Escape" && onClose?.()
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [ open, onClose ])

    if (!open) return null

    return (
        <div className='modal-backdrop' onMouseDown={onClose}>
            <div className='modal' role='dialog' aria-modal='true' aria-label={title} onMouseDown={e => e.stopPropagation()}>
                <h3 className='modal__title'>{title}</h3>
                <div className='modal__body'>{children}</div>
                {actions && <div className='modal__actions'>{actions}</div>}
            </div>
        </div>
    )
}

export default Modal
