const express= require("express")
const authMiddleware= require("../middlewares/auth.middleware")
const interviewController=require("../controllers/interview.controller")
const upload=require("../middlewares/file.middleware")
const {aiLimiter}=require("../middlewares/rateLimit.middleware")

const interviewRouter= express.Router()




/** * @route POST /api/interview/
 * @description Generate an interview report based on the candidate's resume, self description and job description
 * @body (form-data) jobDescription, selfDescription, resume (PDF file), companyName (optional, NEW)
 * @access Private
 */

interviewRouter.post("/",authMiddleware.authUser,aiLimiter,upload.single("resume"),interviewController.generateInterviewReportController)

/**
 * @route GET/api/interview/report/:interviewID
 * @description get interview report by interviewId.
 * @access private
 */

interviewRouter.get("/report/:interviewId",authMiddleware.authUser,interviewController.getInterviewReportByIdController)



/**
 * @route GET/api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */

interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)
/**
 * @route GET/api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description,resume content and job description
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, aiLimiter, interviewController.generateResumePdfController)


// ═════════════════════════════ NEW ROUTES ═════════════════════════════

/**
 * @route GET /api/interview/stats
 * @description dashboard statistics (scores over time, practice stats, progress, common skill gaps)
 * @access private
 */
interviewRouter.get("/stats", authMiddleware.authUser, interviewController.getStatsController)

/**
 * @route GET /api/interview/shared/:shareId
 * @description public read-only report (no login). Resume & private data are never included.
 * @access public
 */
interviewRouter.get("/shared/:shareId", interviewController.getSharedReportController)

/**
 * @route PATCH /api/interview/report/:interviewId
 * @description rename report / change company. body: { title?, companyName? }
 * @access private
 */
interviewRouter.patch("/report/:interviewId", authMiddleware.authUser, interviewController.updateReportController)

/**
 * @route DELETE /api/interview/report/:interviewId
 * @description delete a report
 * @access private
 */
interviewRouter.delete("/report/:interviewId", authMiddleware.authUser, interviewController.deleteReportController)

/**
 * @route PATCH /api/interview/report/:interviewId/progress
 * @description tick/untick roadmap task. body: { day, taskIndex, done }
 * @access private
 */
interviewRouter.patch("/report/:interviewId/progress", authMiddleware.authUser, interviewController.updateProgressController)

/**
 * @route POST /api/interview/report/:interviewId/evaluate
 * @description mock interview - AI scores your answer. body: { questionType, questionIndex, answer }
 * @access private
 */
interviewRouter.post("/report/:interviewId/evaluate", authMiddleware.authUser, aiLimiter, interviewController.evaluateAnswerController)

/**
 * @route POST /api/interview/report/:interviewId/ats   (?refresh=true to regenerate)
 * @description ATS keyword match analysis
 * @access private
 */
interviewRouter.post("/report/:interviewId/ats", authMiddleware.authUser, aiLimiter, interviewController.atsAnalysisController)

/**
 * @route POST /api/interview/report/:interviewId/cover-letter   (?refresh=true to regenerate)
 * @description tailored cover letter
 * @access private
 */
interviewRouter.post("/report/:interviewId/cover-letter", authMiddleware.authUser, aiLimiter, interviewController.coverLetterController)

/**
 * @route POST /api/interview/report/:interviewId/share
 * @description enable/disable public share link. body: { enabled: true|false }
 * @access private
 */
interviewRouter.post("/report/:interviewId/share", authMiddleware.authUser, interviewController.shareReportController)

module.exports=interviewRouter
