import {createContext,useState,useEffect} from "react";
import {getMe} from "./services/auth.api";


export const AuthContext = createContext()


export const AuthProvider = ({children}) => {
    const [user,setUser] = useState(null)
    const [loading,setLoading] = useState(true)

    // Check once, when the app loads, whether the user already has a valid cookie.
    // (Previously this ran inside useAuth, so every page using useAuth called /get-me again.)
    useEffect(()=>{
        const getAndSetUser = async ()=>{
            try{
                const data = await getMe()
                setUser(data.user)
            }catch{
                setUser(null)
            } finally{
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return (
        <AuthContext.Provider value={{user,setUser,loading,setLoading}}>
            {children}
        </AuthContext.Provider>
    )
}
