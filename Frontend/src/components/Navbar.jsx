import { useState, useRef, useEffect } from "react"
import { NavLink, Link, useNavigate } from "react-router"
import { useAuth } from "../features/auth/hooks/useAuth"
import "./components.scss"

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()
    const [ menuOpen, setMenuOpen ] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
        document.addEventListener("mousedown", close)
        return () => document.removeEventListener("mousedown", close)
    }, [])

    const logout = async () => {
        await handleLogout()
        navigate("/login")
    }

    const initial = (user?.username || "?").charAt(0).toUpperCase()

    return (
        <header className='navbar'>
            <Link to="/" className='navbar__brand'>
                <span className='navbar__logo'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                </span>
                <span>Hire<span className='highlight-text'>Mate</span></span>
            </Link>

            <nav className='navbar__links'>
                <NavLink to="/" end className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>New Plan</NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>Dashboard</NavLink>
            </nav>

            <div className='navbar__user' ref={menuRef}>
                <button className='navbar__avatar-btn' onClick={() => setMenuOpen(o => !o)} aria-haspopup='menu' aria-expanded={menuOpen}>
                    <span className='navbar__avatar'>{initial}</span>
                    <span className='navbar__username'>{user?.username}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {menuOpen && (
                    <div className='navbar__menu' role='menu'>
                        <div className='navbar__menu-header'>
                            <strong>{user?.username}</strong>
                            <span>{user?.email}</span>
                        </div>
                        <Link to="/profile" role='menuitem' onClick={() => setMenuOpen(false)}>Profile &amp; Settings</Link>
                        <Link to="/dashboard" role='menuitem' onClick={() => setMenuOpen(false)}>My Dashboard</Link>
                        <button role='menuitem' className='navbar__menu-logout' onClick={logout}>Logout</button>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Navbar
