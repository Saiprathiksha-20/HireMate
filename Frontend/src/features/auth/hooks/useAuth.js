import {useContext} from "react"
import {AuthContext} from "../auth.context"
import {login,register,logout} from "../services/auth.api";
import {getErrorMessage} from "../../../lib/api";

/**
 * handleLogin / handleRegister return { ok: true } on success
 * or { ok: false, message } on failure, so the page can show the error
 * instead of silently redirecting.
 */
export const useAuth= () => {
    const context= useContext(AuthContext)
    const {user,setUser,loading,setLoading}= context


    const handleLogin= async ({email,password})=>{
        setLoading(true)
        try{
            const data  = await login({email,password})
            setUser(data.user)
            return {ok:true}
        } catch(error){
            return {ok:false, message:getErrorMessage(error,"Login failed")}
        }
        finally{
            setLoading(false)
        }
    }

    const handleRegister= async ({username,email,password})=>{
        setLoading(true)
        try{
            const data= await register({username,email,password})
            setUser(data.user)
            return {ok:true}
        } catch(error){
            return {ok:false, message:getErrorMessage(error,"Registration failed")}
        }
        finally{
            setLoading(false)
        }
    }

    const handleLogout= async ()=>{
        setLoading(true)
        try{
            await logout()
        }
        catch(error){
            console.error(error)
        }
        finally{
            setUser(null)
            setLoading(false)
        }
    }

    return {user,loading,handleLogin,handleRegister,handleLogout}
}
