const multer=require("multer")




const upload=multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            return cb(null, true)
        }
        const error = new Error("Only PDF files are allowed for the resume")
        error.statusCode = 400
        cb(error)
    }
})



module.exports = upload
