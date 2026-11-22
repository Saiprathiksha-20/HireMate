import {useState} from 'react'
import {useNavigate,Link,Navigate} from "react-router"
import {useAuth} from "../hooks/useAuth"
import "../auth.form.scss"



const Register = () => {
   
  const navigate = useNavigate()
   const [username, setUsername] = useState("")
   const [email, setEmail] = useState("")
   const [password, setPassword] = useState("")
   
  const {user,loading,handleRegister} = useAuth()
   const [error, setError] = useState("")

   const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const result = await handleRegister({username, email, password})
    if(result.ok){
      navigate("/")
    } else {
      setError(result.message)
    }
  }

  if(loading){
      return (<main className='loading-screen' style={{ minHeight: '100vh' }}><span className='spinner spinner--large' /></main>)
  }
  if(user){
      return <Navigate to="/" replace />
  }




    return (
        <main className="auth-page">
        <div className="form-container">
          <div className="auth-brand">
            <span className="auth-brand__logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
            </span>
            <span>Hire<span className="highlight">Mate</span></span>
          </div>
          <h1>Register</h1>
          <p className="auth-sub">Create a free account and get your AI interview plan in 30 seconds.</p>
          <form onSubmit={handleSubmit}> 
            <div className="input-group">
                <label htmlFor="username">Username</label>
                <input 
                 value={username} required
                 onChange={(e) => {setUsername(e.target.value)}}
                 type="text" id="username" name='username' placeholder="Enter your username" />
            </div>

            <div className="input-group">
                <label htmlFor="email">Email</label>
                <input 
                 value={email} required
                 onChange={(e) => {setEmail(e.target.value)}}
                 type="email" id="email" name='email' placeholder="Enter your email" />
            </div>
            <div className="input-group">
                <label htmlFor="password">Password</label>
                <input 
                 value={password} required minLength={6}
                 onChange={(e) => {setPassword(e.target.value)}}
                 type="password" id="password" name='password' placeholder="Enter your password" />
            </div>
            {error && <p className='form-error'>{error}</p>}
            <button className='button primary-button'>Register</button>
            </form>

            <p>Already have an account? <Link to={"/login"}>Login</Link></p>
            </div>
      </main>

    )
}
export default Register