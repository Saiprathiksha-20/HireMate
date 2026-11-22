const mongoose=require("mongoose")
const crypto=require("crypto")
const pdfParse=require("pdf-parse")
const {generateInterviewReport, generateResumePdf, evaluateAnswer, analyzeAts, generateCoverLetter}=require("../services/ai.services")
const interviewReportModel= require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description,resume and job description.
 */



async function generateInterviewReportController(req,res){
    const {selfDescription, jobDescription, companyName}=req.body || {}

    if(!jobDescription || !jobDescription.trim()){
        return res.status(400).json({message:"Job description is required."})
    }
    if(!req.file && !(selfDescription && selfDescription.trim())){
        return res.status(400).json({message:"Please upload a resume (PDF) or write a self description."})
    }

    // Resume is optional: only parse it if the user actually uploaded one
    let resumeText=""
    if(req.file){
        const resumeContent= await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        resumeText=resumeContent.text
    }


   const cleanCompany = typeof companyName === "string" ? companyName.trim().slice(0, 100) : ""

   const interviewReportByAi= await generateInterviewReport({
    resume:resumeText,
    selfDescription,
    jobDescription,
    companyName: cleanCompany
   })

   const interviewReport=await interviewReportModel.create({
    ...interviewReportByAi,
    user: req.user.id,
    resume:resumeText,
    selfDescription,
    jobDescription,
    companyName: cleanCompany || undefined
   })

   res.status(201).json({
    message:"Interview report generated successfully.",
    interviewReport
   })

}

/**
 * @description Controller to get interview report by interviewId.
 */

async function getInterviewReportByIdController(req,res){
    const {interviewId}=req.params

    if(!mongoose.isValidObjectId(interviewId)){
        return res.status(400).json({message:"Invalid interview report id."})
    }

    const interviewReport=await interviewReportModel.findOne({ _id: interviewId, user: req.user.id})

    if(!interviewReport){
        return res.status(404).json({
            message:"Interview report not found.",
        })
    }
     res.status(200).json({
            message:"Interview report fetched successfully.",
            interviewReport
        })
}

/**
 * @description Controller to get all interview reports of logged in user.
 */

async function getAllInterviewReportsController(req,res){
    const interviewReports=await interviewReportModel.find({user: req.user.id}).sort({createdAt:-1}).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -practiceAttempts -atsAnalysis -coverLetter -shareId -completedTasks")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */

async function generateResumePdfController(req,res){
    const {interviewReportId}=req.params

    if(!mongoose.isValidObjectId(interviewReportId)){
        return res.status(400).json({message:"Invalid interview report id."})
    }

    // Only the owner of the report can generate a resume from it
    const interviewReport= await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if(!interviewReport){
        return res.status(404).json({
            message:"Interview report not found."
        })
    }

    const {resume,jobDescription,selfDescription}=interviewReport

    const pdfBuffer=await generateResumePdf({resume, jobDescription,selfDescription})

    res.set({
        "Content-Type":"application/pdf",
        "Content-Disposition":`attachment; filename=resume_${interviewReportId}.pdf`
    })
    res.send(Buffer.from(pdfBuffer))
}




// ═════════════════════════════════════════════════════════════════════════════
//  NEW FEATURES
// ═════════════════════════════════════════════════════════════════════════════

/** Finds a report owned by the logged-in user, or sends 400/404 and returns null */
async function findOwnReport(req, res, id){
    if(!mongoose.isValidObjectId(id)){
        res.status(400).json({message:"Invalid interview report id."})
        return null
    }
    const report = await interviewReportModel.findOne({ _id: id, user: req.user.id })
    if(!report){
        res.status(404).json({message:"Interview report not found."})
        return null
    }
    return report
}


/**
 * @description Dashboard statistics for the logged-in user
 * @route GET /api/interview/stats
 */
async function getStatsController(req,res){
    const reports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: 1 })
        .select("title companyName matchScore createdAt preparationPlan completedTasks practiceAttempts.score practiceAttempts.createdAt skillGaps")
        .lean()

    const scores = reports.map(r => r.matchScore).filter(n => typeof n === "number")
    const attempts = reports.flatMap(r => r.practiceAttempts || [])
    const attemptScores = attempts.map(a => a.score).filter(n => typeof n === "number")

    let totalTasks = 0, doneTasks = 0
    const progress = reports.map(r => {
        const total = (r.preparationPlan || []).reduce((sum, d) => sum + (d.tasks?.length || 0), 0)
        const done = Math.min((r.completedTasks || []).length, total)
        totalTasks += total
        doneTasks += done
        return { id: r._id, total, done }
    })

    // most common skill gaps across all reports
    const gapCount = {}
    reports.forEach(r => (r.skillGaps || []).forEach(g => {
        const key = g.skill.trim()
        gapCount[key] = (gapCount[key] || 0) + 1
    }))
    const topSkillGaps = Object.entries(gapCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([skill, count]) => ({ skill, count }))

    const avg = arr => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0

    res.status(200).json({
        message: "Stats fetched successfully.",
        stats: {
            totalReports: reports.length,
            averageMatchScore: avg(scores),
            bestMatchScore: scores.length ? Math.max(...scores) : 0,
            totalPracticeAnswers: attempts.length,
            averagePracticeScore: avg(attemptScores),
            tasksCompleted: doneTasks,
            totalTasks,
            scoreHistory: reports.map(r => ({ id: r._id, title: r.title, companyName: r.companyName, matchScore: r.matchScore, createdAt: r.createdAt })),
            progress,
            topSkillGaps,
        }
    })
}


/**
 * @description Rename a report / change company name
 * @route PATCH /api/interview/report/:interviewId
 */
async function updateReportController(req,res){
    const report = await findOwnReport(req, res, req.params.interviewId)
    if(!report) return

    const {title, companyName} = req.body || {}
    if(title !== undefined){
        if(typeof title !== "string" || !title.trim()){
            return res.status(400).json({message:"Title cannot be empty."})
        }
        report.title = title.trim().slice(0, 150)
    }
    if(companyName !== undefined){
        report.companyName = typeof companyName === "string" && companyName.trim() ? companyName.trim().slice(0, 100) : undefined
    }
    await report.save()

    res.status(200).json({message:"Report updated successfully.", interviewReport: report})
}


/**
 * @description Delete a report
 * @route DELETE /api/interview/report/:interviewId
 */
async function deleteReportController(req,res){
    const report = await findOwnReport(req, res, req.params.interviewId)
    if(!report) return
    await report.deleteOne()
    res.status(200).json({message:"Report deleted successfully."})
}


/**
 * @description Tick / untick a roadmap task
 * @route PATCH /api/interview/report/:interviewId/progress
 * @body { day: 1, taskIndex: 0, done: true }
 */
async function updateProgressController(req,res){
    const report = await findOwnReport(req, res, req.params.interviewId)
    if(!report) return

    const {day, taskIndex, done} = req.body || {}
    const plan = report.preparationPlan.find(d => d.day === Number(day))
    if(!plan || !Number.isInteger(Number(taskIndex)) || Number(taskIndex) < 0 || Number(taskIndex) >= plan.tasks.length){
        return res.status(400).json({message:"Invalid day or task index."})
    }

    const key = `${Number(day)}-${Number(taskIndex)}`
    const set = new Set(report.completedTasks)
    if(done === false) set.delete(key)
    else set.add(key)
    report.completedTasks = [ ...set ]
    await report.save()

    res.status(200).json({message:"Progress updated.", completedTasks: report.completedTasks})
}


/**
 * @description Mock interview: evaluate the user's answer with AI
 * @route POST /api/interview/report/:interviewId/evaluate
 * @body { questionType: "technical" | "behavioral", questionIndex: 0, answer: "..." }
 */
async function evaluateAnswerController(req,res){
    const report = await findOwnReport(req, res, req.params.interviewId)
    if(!report) return

    const {questionType, questionIndex, answer} = req.body || {}
    if(![ "technical", "behavioral" ].includes(questionType)){
        return res.status(400).json({message:"questionType must be 'technical' or 'behavioral'."})
    }
    const list = questionType === "technical" ? report.technicalQuestions : report.behavioralQuestions
    const index = Number(questionIndex)
    const q = list[index]
    if(!Number.isInteger(index) || !q){
        return res.status(400).json({message:"Invalid question index."})
    }
    if(typeof answer !== "string" || answer.trim().length < 10){
        return res.status(400).json({message:"Please write an answer of at least 10 characters."})
    }

    const evaluation = await evaluateAnswer({
        question: q.question,
        intention: q.intention || "",
        modelAnswer: q.answer,
        answer: answer.trim().slice(0, 5000),
        jobDescription: report.jobDescription,
        questionType,
    })

    report.practiceAttempts.push({
        questionType,
        questionIndex: index,
        answer: answer.trim().slice(0, 5000),
        ...evaluation,
    })
    await report.save()

    res.status(201).json({
        message:"Answer evaluated successfully.",
        attempt: report.practiceAttempts[ report.practiceAttempts.length - 1 ],
    })
}


/**
 * @description ATS keyword analysis (cached on the report; pass ?refresh=true to regenerate)
 * @route POST /api/interview/report/:interviewId/ats
 */
async function atsAnalysisController(req,res){
    const report = await findOwnReport(req, res, req.params.interviewId)
    if(!report) return

    if(report.atsAnalysis?.generatedAt && req.query.refresh !== "true"){
        return res.status(200).json({message:"ATS analysis fetched.", atsAnalysis: report.atsAnalysis})
    }

    const result = await analyzeAts({
        resume: report.resume,
        selfDescription: report.selfDescription,
        jobDescription: report.jobDescription,
    })
    report.atsAnalysis = { ...result, generatedAt: new Date() }
    await report.save()

    res.status(200).json({message:"ATS analysis generated.", atsAnalysis: report.atsAnalysis})
}


/**
 * @description Generate a tailored cover letter (cached; ?refresh=true to regenerate)
 * @route POST /api/interview/report/:interviewId/cover-letter
 */
async function coverLetterController(req,res){
    const report = await findOwnReport(req, res, req.params.interviewId)
    if(!report) return

    if(report.coverLetter?.content && req.query.refresh !== "true"){
        return res.status(200).json({message:"Cover letter fetched.", coverLetter: report.coverLetter})
    }

    const result = await generateCoverLetter({
        resume: report.resume,
        selfDescription: report.selfDescription,
        jobDescription: report.jobDescription,
        title: report.title,
        companyName: report.companyName,
    })
    report.coverLetter = { content: result.content, generatedAt: new Date() }
    await report.save()

    res.status(200).json({message:"Cover letter generated.", coverLetter: report.coverLetter})
}


/**
 * @description Turn the public share link on or off
 * @route POST /api/interview/report/:interviewId/share
 * @body { enabled: true | false }
 */
async function shareReportController(req,res){
    const report = await findOwnReport(req, res, req.params.interviewId)
    if(!report) return

    const enabled = (req.body || {}).enabled !== false
    if(enabled && !report.shareId){
        report.shareId = crypto.randomBytes(12).toString("hex")
    }
    if(!enabled){
        report.shareId = undefined
    }
    await report.save()

    res.status(200).json({message: enabled ? "Share link enabled." : "Share link disabled.", shareId: report.shareId || null})
}


/**
 * @description Public read-only view of a shared report (no login needed).
 * Private data (resume, self description, practice answers, cover letter) is never sent.
 * @route GET /api/interview/shared/:shareId
 */
async function getSharedReportController(req,res){
    const {shareId} = req.params
    if(!/^[a-f0-9]{24}$/.test(shareId)){
        return res.status(404).json({message:"Shared report not found."})
    }
    const report = await interviewReportModel.findOne({ shareId }).populate("user", "username")

    if(!report){
        return res.status(404).json({message:"Shared report not found."})
    }

    // Whitelist: only these fields ever leave the server for a public link
    res.status(200).json({
        message:"Shared report fetched successfully.",
        interviewReport: {
            _id: report._id,
            title: report.title,
            companyName: report.companyName,
            matchScore: report.matchScore,
            technicalQuestions: report.technicalQuestions,
            behavioralQuestions: report.behavioralQuestions,
            skillGaps: report.skillGaps,
            preparationPlan: report.preparationPlan,
            createdAt: report.createdAt,
            sharedBy: report.user?.username || "A HireMate user",
        }
    })
}


module.exports={
    generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController,
    getStatsController, updateReportController, deleteReportController, updateProgressController,
    evaluateAnswerController, atsAnalysisController, coverLetterController, shareReportController, getSharedReportController,
}
