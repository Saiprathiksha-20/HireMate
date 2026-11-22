const mongoose=require("mongoose")
async function connectToDB(){
   try{
       await mongoose.connect(process.env.MONGO_URI,{ serverSelectionTimeoutMS: 15000 })
       console.log("connected to database")
   } catch (error) {
       console.error("error connecting to database:", error.message)
       const msg=String(error.message).toLowerCase()
       if(msg.includes("whitelist") || msg.includes("could not connect to any servers")){
           console.error("👉 Atlas tips: 1) Network Access → add your current IP (or 0.0.0.0/0 for testing)."
               + " 2) Free (M0) clusters PAUSE after 60 days without connections → open Atlas and click 'Resume'.")
       }
       if(msg.includes("authentication failed") || msg.includes("bad auth")){
           console.error("👉 Username/password in MONGO_URI is wrong. Atlas → Database Access → edit user → reset password.")
       }
   }
}
module.exports=connectToDB
