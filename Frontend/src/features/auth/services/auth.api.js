import { api } from "../../../lib/api"

export async function register({username,email,password}){
     
try{


  const response = await api.post('/api/auth/register',{username,email,password})


    return response.data
} catch(error){
  console.log(error)
  throw error
}
}


export async function login({email,password}){
    
try{


  const response = await api.post('/api/auth/login',{email,password})


    return response.data
} catch(error){
  console.log(error)
  throw error
}
}

export async function logout(){
    
try{


  const response = await api.get('/api/auth/logout')


    return response.data
} catch(error){
  console.log(error)
  throw error
}
}


export async function getMe(){
    try{
         const response = await api.get('/api/auth/get-me')
         return response.data
    }
catch(error){
  console.log(error)
  throw error
}
}


// ═════════════════════════════ NEW ═════════════════════════════

export const updateProfile = async ({ username, email }) =>
    (await api.patch("/api/auth/profile", { username, email })).data

export const changePassword = async ({ currentPassword, newPassword }) =>
    (await api.patch("/api/auth/change-password", { currentPassword, newPassword })).data

export const deleteAccount = async ({ password }) =>
    (await api.delete("/api/auth/account", { data: { password } })).data
