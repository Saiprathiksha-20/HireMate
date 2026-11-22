 const mongoose =require('mongoose')




 const blacklistTokenSchema=new mongoose.Schema({
    token:{
        type:String,
        required: [true, "token is required to be blacklisted"]
    }
}, {
    timestamps:true
})

// Tokens expire after 1 day anyway, so MongoDB auto-deletes blacklist entries after 1 day
blacklistTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })

const tokenBlacklistModel=mongoose.model("BlacklistToken",blacklistTokenSchema)
module.exports=tokenBlacklistModel