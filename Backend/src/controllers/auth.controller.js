const userModel=require("../models/user.model")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const tokenBlacklistModel=require("../models/balcklist.model")
/**
 * @name registerUserController
 * @description register a new user, expects username, email and password
 * @access Public
 */
async function registerUserController(req,res){
    const {username,email,password}=req.body
    if(!username || !email || !password){
        return res.status(400).json({message:"please provide username,"})
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
    // return res.status(201).json({message:"User created successfully",user:User})

const token=jwt.sign({id:User._id, username:User.username},process.env.JWT_SECRET,{expiresIn:"1d"})
res.cookie("token",token)
res.status(201).json({message:"User created successfully",user:{id:User._id, username:User.username, email: User.email}})
}

/**
 * @name loginUserController
 * @description login a user, expects email and password
 * @access Public
 */
async function loginUserController(req,res){
const {email,password}=req.body
const user=await userModel.findOne({email})
if(!user){
    return res.status(400).json({message:"Invalid email or password"})
}
const isPasswordValid=await bcrypt.compare(password,user.password)
if(!isPasswordValid){
    return res.status(400).json({message:"Invalid email or password"})
}
const token=jwt.sign({id:user._id, username:user.username},process.env.JWT_SECRET,{expiresIn:"1d"})
res.cookie("token",token)
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
    res.clearCookie("token")
    res.status(200).json({message:"Logout successful"})
}


/**
 * @name getMeController
 * @description get the logged in user details,expects token in the request cookie
 * @access Private
 */
async function getMeController(req,res){
    const user=await userModel.findById(req.user.id)
    res.status(200).json({ message: "User details retrieved successfully", user:{id:user._id, username:user.username, email: user.email}})
}
module.exports={registerUserController, loginUserController, logoutUserController, getMeController}