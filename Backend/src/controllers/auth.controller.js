const userModel=require("../models/user.model")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const crypto=require("crypto")
const tokenBlacklistModel=require("../models/balcklist.model")
const interviewReportModel=require("../models/interviewReport.model")

/**
 * Cookie settings used for the auth token.
 * - httpOnly: JavaScript in the browser can't read the token (protects against XSS token theft)
 * - sameSite "lax": localhost:5173 -> localhost:3000 is still "same site", so the frontend keeps working
 * - secure: only turned on in production (https). On localhost / Postman it stays off.
 * - maxAge: 1 day, same as the JWT expiry
 */
const cookieOptions={
    httpOnly:true,
    sameSite:"lax",
    secure:process.env.NODE_ENV==="production",
    maxAge:24*60*60*1000
}

/**
 * Creates the login token. Each token gets a unique id (jwtid) so a new login
 * never produces the same token string as one that was blacklisted on logout.
 */
function signToken(user){
    return jwt.sign({id:user._id, username:user.username},process.env.JWT_SECRET,{expiresIn:"1d", jwtid:crypto.randomUUID()})
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password
 * @access Public
 */
async function registerUserController(req,res){
    const {username,email,password}=req.body || {}
    if(!username || !email || !password){
        return res.status(400).json({message:"please provide username, email and password"})
    }
    const isUserAlreadyExists=await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if(isUserAlreadyExists){
        return res.status(400).json({message:"User already exists"})
    }
    const hash=await bcrypt.hash(password,10)
    const User=await userModel.create({
        username,
        email,
        password:hash
    })

const token=signToken(User)
res.cookie("token",token,cookieOptions)
res.status(201).json({message:"User created successfully",user:{id:User._id, username:User.username, email: User.email}})
}

/**
 * @name loginUserController
 * @description login a user, expects email and password
 * @access Public
 */
async function loginUserController(req,res){
const {email,password}=req.body || {}
if(!email || !password){
    return res.status(400).json({message:"please provide email and password"})
}
const user=await userModel.findOne({email})
if(!user){
    return res.status(400).json({message:"Invalid email or password"})
}
const isPasswordValid=await bcrypt.compare(password,user.password)
if(!isPasswordValid){
    return res.status(400).json({message:"Invalid email or password"})
}
const token=signToken(user)
res.cookie("token",token,cookieOptions)
res.status(200).json({message:"Login successful",user:{id:user._id, username:user.username, email: user.email}})
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token to blacklist
 * @access Public
 */
async function logoutUserController(req,res){
    const token=req.cookies.token

    if(token){
        await tokenBlacklistModel.create({token})
    }
    res.clearCookie("token",{httpOnly:true, sameSite:"lax", secure:cookieOptions.secure})
    res.status(200).json({message:"Logout successful"})
}


/**
 * @name getMeController
 * @description get the logged in user details,expects token in the request cookie
 * @access Private
 */
async function getMeController(req,res){
    const user=await userModel.findById(req.user.id)
    if(!user){
        return res.status(404).json({message:"User not found"})
    }
    res.status(200).json({ message: "User details retrieved successfully", user:{id:user._id, username:user.username, email: user.email}})
}


// ═════════════════════════════ NEW: profile & account ═════════════════════════════

/**
 * @name updateProfileController
 * @description change username and/or email. body: { username?, email? }
 * @access Private
 */
async function updateProfileController(req,res){
    const {username,email}=req.body || {}
    const user=await userModel.findById(req.user.id)
    if(!user){
        return res.status(404).json({message:"User not found"})
    }

    if(username!==undefined){
        const clean=String(username).trim()
        if(clean.length<3){
            return res.status(400).json({message:"Username must be at least 3 characters"})
        }
        if(clean!==user.username && await userModel.exists({username:clean})){
            return res.status(400).json({message:"Username already taken"})
        }
        user.username=clean
    }
    if(email!==undefined){
        const clean=String(email).trim()
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)){
            return res.status(400).json({message:"Please provide a valid email"})
        }
        if(clean!==user.email && await userModel.exists({email:clean})){
            return res.status(400).json({message:"An account already exists with this email"})
        }
        user.email=clean
    }
    await user.save()

    // re-issue the token so the username inside it stays in sync
    const token=signToken(user)
    res.cookie("token",token,cookieOptions)
    res.status(200).json({message:"Profile updated successfully", user:{id:user._id, username:user.username, email:user.email}})
}


/**
 * @name changePasswordController
 * @description body: { currentPassword, newPassword }
 * @access Private
 */
async function changePasswordController(req,res){
    const {currentPassword,newPassword}=req.body || {}
    if(!currentPassword || !newPassword){
        return res.status(400).json({message:"please provide current and new password"})
    }
    if(String(newPassword).length<6){
        return res.status(400).json({message:"New password must be at least 6 characters"})
    }
    const user=await userModel.findById(req.user.id)
    if(!user){
        return res.status(404).json({message:"User not found"})
    }
    const ok=await bcrypt.compare(currentPassword,user.password)
    if(!ok){
        return res.status(400).json({message:"Current password is incorrect"})
    }
    user.password=await bcrypt.hash(newPassword,10)
    await user.save()
    res.status(200).json({message:"Password changed successfully"})
}


/**
 * @name deleteAccountController
 * @description permanently delete the account and all its reports. body: { password }
 * @access Private
 */
async function deleteAccountController(req,res){
    const {password}=req.body || {}
    if(!password){
        return res.status(400).json({message:"please provide your password to confirm"})
    }
    const user=await userModel.findById(req.user.id)
    if(!user){
        return res.status(404).json({message:"User not found"})
    }
    const ok=await bcrypt.compare(password,user.password)
    if(!ok){
        return res.status(400).json({message:"Password is incorrect"})
    }
    await interviewReportModel.deleteMany({user:user._id})
    await user.deleteOne()
    if(req.cookies.token){
        await tokenBlacklistModel.create({token:req.cookies.token})
    }
    res.clearCookie("token",{httpOnly:true, sameSite:"lax", secure:cookieOptions.secure})
    res.status(200).json({message:"Account deleted successfully"})
}

module.exports={registerUserController, loginUserController, logoutUserController, getMeController, updateProfileController, changePasswordController, deleteAccountController}
