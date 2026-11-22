const express=require("express")
const cookieParser=require("cookie-parser")
const cors=require("cors")
const multer=require("multer")
const helmet=require("helmet")
const mongoose=require("mongoose")

const app=express()



// security headers (cross-origin resources allowed so the frontend can download PDFs)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials:true
}))

const authRouter=require("./routes/auth.routes")
const interviewRouter=require("./routes/interview.routes")




/**
 * @route GET /api/health
 * @description quick check that the server and database are up (handy in Postman)
 */
app.get("/api/health",(req,res)=>{
    const states=["disconnected","connected","connecting","disconnecting"]
    res.status(200).json({
        status:"ok",
        database:states[mongoose.connection.readyState] || "unknown",
        aiKeyConfigured:Boolean(process.env.GOOGLE_GENAI_API_KEY),
        time:new Date().toISOString()
    })
})

app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter)


// Unknown routes -> clean JSON 404 instead of an HTML page
app.use((req,res)=>{
    res.status(404).json({message:`Route ${req.method} ${req.originalUrl} not found`})
})

// Central error handler: any error thrown inside a controller ends up here
// and is returned as JSON (works nicely in Postman and in the frontend)
// eslint-disable-next-line no-unused-vars
app.use((err,req,res,next)=>{
    if(err instanceof multer.MulterError){
        const message = err.code === "LIMIT_FILE_SIZE" ? "Resume must be smaller than 5MB" : err.message
        return res.status(400).json({message})
    }
    if(err.statusCode){
        return res.status(err.statusCode).json({message:err.message})
    }
    console.error(err)
    res.status(500).json({message:"Something went wrong. Please try again."})
})



module.exports=app
