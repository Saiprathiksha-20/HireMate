import { useContext, useState } from "react"
import { useNavigate } from "react-router"
import "../profile.scss"
import { AuthContext } from "../auth.context"
import { updateProfile, changePassword, deleteAccount } from "../services/auth.api"
import { getErrorMessage } from "../../../lib/api"
import { useToast } from "../../../components/Toast"
import Modal from "../../../components/Modal"

const Profile = () => {
    const { user, setUser } = useContext(AuthContext)
    const toast = useToast()
    const navigate = useNavigate()

    const [ username, setUsername ] = useState(user?.username || "")
    const [ email, setEmail ] = useState(user?.email || "")
    const [ savingProfile, setSavingProfile ] = useState(false)

    const [ currentPassword, setCurrentPassword ] = useState("")
    const [ newPassword, setNewPassword ] = useState("")
    const [ confirmPassword, setConfirmPassword ] = useState("")
    const [ savingPassword, setSavingPassword ] = useState(false)

    const [ deleteOpen, setDeleteOpen ] = useState(false)
    const [ deletePassword, setDeletePassword ] = useState("")
    const [ deleting, setDeleting ] = useState(false)

    const profileChanged = username.trim() !== user?.username || email.trim() !== user?.email

    const saveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const data = await updateProfile({ username: username.trim(), email: email.trim() })
            setUser(data.user)
            toast.success("Profile updated")
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not update profile"))
        } finally {
            setSavingProfile(false)
        }
    }

    const savePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match")
            return
        }
        setSavingPassword(true)
        try {
            await changePassword({ currentPassword, newPassword })
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
            toast.success("Password changed")
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not change password"))
        } finally {
            setSavingPassword(false)
        }
    }

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await deleteAccount({ password: deletePassword })
            setUser(null)
            navigate("/register")
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not delete account"))
            setDeleting(false)
        }
    }

    return (
        <div className='profile'>
            <header className='profile__header'>
                <div className='profile__avatar'>{(user?.username || "?").charAt(0).toUpperCase()}</div>
                <div>
                    <h1>{user?.username}</h1>
                    <p>{user?.email}</p>
                </div>
            </header>

            <form className='settings-card' onSubmit={saveProfile}>
                <div className='settings-card__head'>
                    <h2>Profile</h2>
                    <p>Your username is shown on reports you share.</p>
                </div>
                <div className='settings-card__grid'>
                    <div className='field'>
                        <label htmlFor='p-username'>Username</label>
                        <input id='p-username' value={username} onChange={e => setUsername(e.target.value)} minLength={3} required />
                    </div>
                    <div className='field'>
                        <label htmlFor='p-email'>Email</label>
                        <input id='p-email' type='email' value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                </div>
                <div className='settings-card__foot'>
                    <button className='btn btn--primary' disabled={!profileChanged || savingProfile}>
                        {savingProfile ? <span className='spinner' /> : "Save changes"}
                    </button>
                </div>
            </form>

            <form className='settings-card' onSubmit={savePassword}>
                <div className='settings-card__head'>
                    <h2>Change password</h2>
                    <p>Use at least 6 characters.</p>
                </div>
                <div className='settings-card__grid'>
                    <div className='field settings-card__full'>
                        <label htmlFor='p-current'>Current password</label>
                        <input id='p-current' type='password' value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete='current-password' />
                    </div>
                    <div className='field'>
                        <label htmlFor='p-new'>New password</label>
                        <input id='p-new' type='password' value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required autoComplete='new-password' />
                    </div>
                    <div className='field'>
                        <label htmlFor='p-confirm'>Confirm new password</label>
                        <input id='p-confirm' type='password' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required autoComplete='new-password' />
                    </div>
                </div>
                <div className='settings-card__foot'>
                    <button className='btn btn--primary' disabled={savingPassword}>
                        {savingPassword ? <span className='spinner' /> : "Update password"}
                    </button>
                </div>
            </form>

            <div className='settings-card settings-card--danger'>
                <div className='settings-card__head'>
                    <h2>Delete account</h2>
                    <p>Permanently delete your account and every interview plan. This can't be undone.</p>
                </div>
                <div className='settings-card__foot'>
                    <button className='btn btn--danger' onClick={() => setDeleteOpen(true)}>Delete my account</button>
                </div>
            </div>

            <Modal
                open={deleteOpen}
                title='Delete your account?'
                onClose={() => !deleting && setDeleteOpen(false)}
                actions={<>
                    <button className='btn btn--ghost' onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
                    <button className='btn btn--danger' onClick={confirmDelete} disabled={deleting || !deletePassword}>
                        {deleting ? <span className='spinner' /> : "Delete forever"}
                    </button>
                </>}
            >
                <p>All your reports, practice answers and cover letters will be removed. Enter your password to confirm.</p>
                <div className='field'>
                    <label htmlFor='p-delete'>Password</label>
                    <input id='p-delete' type='password' value={deletePassword} onChange={e => setDeletePassword(e.target.value)} autoFocus />
                </div>
            </Modal>
        </div>
    )
}

export default Profile
