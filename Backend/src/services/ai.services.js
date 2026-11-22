const {GoogleGenAI} = require("@google/genai")
const {z}= require("zod")
const{zodToJsonSchema}= require("zod-to-json-schema")
const puppeteer=require("puppeteer")



const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

/**
 * Models to try, in order.
 * "Preview" models get retired by Google after a few months, so if the first model
 * no longer exists we automatically fall back to the next one.
 * You can override the first one with GEMINI_MODEL in .env.
 */
const MODELS = [
    process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
].filter((m, i, arr) => arr.indexOf(m) === i)

function isModelUnavailable(error){
    const msg = String(error?.message || "").toLowerCase()
    return error?.status === 404 || msg.includes("not found") || msg.includes("is not supported") || msg.includes("deprecated")
}

/**
 * Calls Gemini with a zod schema and returns the parsed JSON.
 * Turns common Gemini failures into friendly errors (with statusCode) that the
 * central error handler in app.js sends back as JSON.
 */
async function generateJson(prompt, schema){
    let lastError
    for (const model of MODELS){
        try{
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config:{
                    responseMimeType:"application/json",
                    responseSchema:zodToJsonSchema(schema)
                }
            })
            return JSON.parse(response.text)
        } catch(error){
            lastError = error
            if (isModelUnavailable(error)){
                console.warn(`⚠️  Gemini model "${model}" unavailable, trying next model...`)
                continue
            }
            break
        }
    }

    console.error("❌ GEMINI API ERROR:", lastError?.status, lastError?.message)
    const msg = String(lastError?.message || "").toLowerCase()
    const friendly = new Error("AI service failed. Please try again in a moment.")
    friendly.statusCode = 502
    if (lastError?.status === 429 || msg.includes("quota") || msg.includes("rate")){
        friendly.message = "AI usage limit reached. Please wait a minute and try again."
        friendly.statusCode = 429
    } else if (lastError?.status === 401 || lastError?.status === 403 || msg.includes("api key") || msg.includes("permission")){
        friendly.message = "AI service rejected the API key. Check GOOGLE_GENAI_API_KEY in your .env."
        friendly.statusCode = 502
    }
    throw friendly
}




const interviewReportSchema = z.object({
    matchScore: z.number().describe("The match score between the candidate and the job description, ranging from 0 to 100 indicating how well the candidate's profile matches the job desceription"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question to be asked in the interview"),
        intention: z.string().describe("The intention behind the technical question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("technical questions that can be asked in the interview along with their intention and how to answer"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question to be asked in the interview"),
        intention: z.string().describe("The intention behind the behavioral question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("behavioral questions that can be asked in the interview along with their intention and how to answer"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill that is identified as a gap"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of the skill gap, can be low, medium or high")
    })).describe("list of skills that the candidate needs to improve"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number of the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, etc."),
        tasks: z.array(z.string()).describe("List of tasks to be completed on this day"),
        timeframe: z.string().describe("The timeframe for completing the tasks")
    })).describe("A day-wise preparation plan for the candidate to improve their skills and prepare for the interview"),
    title:z.string().describe("The title of the job for which the interview report is generated"),
})



async function generateInterviewReport({resume, selfDescription, jobDescription, companyName}){

const prompt = `Generate an interview report based on the following information:
IMPORTANT:
Return ONLY the JSON structure defined by the provided response schema.
Do not add any additional fields.
Do not rename any fields.

The report must contain:
1. matchScore
2. technicalQuestions
3. behavioralQuestions
4. skillGaps
5. preparationPlan
6. title (the job title from the job description)

For preparationPlan, tasks must be an array of individual task strings.
${companyName ? `\nThe candidate is interviewing at "${companyName}". Tailor the questions to the interview style, products and values this company is known for.\n` : ""}
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}
`

    console.log("🚀 About to call Gemini");
    const report = await generateJson(prompt, interviewReportSchema)
    console.log("✅ Gemini responded");
    return report
}



async function generatePdfFromHtml(htmlContent){
    // these flags are needed on Linux servers like Render (no sandbox, small /dev/shm)
    const browser=await puppeteer.launch({
        args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"]
    })
    try{
        const page=await browser.newPage();
        await page.setContent(htmlContent, {waitUntil: "networkidle0"})

        const pdfBuffer=await page.pdf({
            format:"A4",
            printBackground:true,
            margin:{
                top:"20mm",
                bottom:"20mm",
                left:"15mm",
                right:"15mm"
            }
        })

        return pdfBuffer
    } finally {
        // always close the browser, even if something fails, so Chrome processes don't pile up
        await browser.close()
    }
}


async function generateResumePdf({resume, selfDescription,jobDescription}){
    const resumePdfSchema=z.object({
        html:z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

   const prompt=`Generate resume  for a candidate with the following details:
   Resume:${resume || "Not provided"}
   Self Description: ${selfDescription || "Not provided"}
   Job Description: ${jobDescription}
   the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer
   the resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The  HTML content should be well-formatted and structured, making it easy to read and visible.
   the content of resume should not sound like: it's generated by AI and should be as close as possible to a real human-written resume.
   you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
   the content should be ATS friendly, i.e, it should be easily parsable by ATS systems without losing important information.
   the resume should not be so lengthy, it should only be 1 page long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information thatcan increase the candidate's chances of getting an interview call for the given job description.
   `

   const jsonContent = await generateJson(prompt, resumePdfSchema)

   const pdfBuffer=await generatePdfFromHtml(jsonContent.html)

   return pdfBuffer

}


// ── NEW: Mock interview answer evaluation ───────────────────────────────────
const answerEvaluationSchema = z.object({
    score: z.number().describe("Score for the candidate's answer from 0 to 10"),
    feedback: z.string().describe("2-4 sentences of honest, constructive overall feedback addressed to the candidate as 'you'"),
    strengths: z.array(z.string()).describe("What was good about the answer (1-3 short points)"),
    improvements: z.array(z.string()).describe("Concrete things to add or change (1-3 short points)"),
    improvedAnswer: z.string().describe("A stronger version of the candidate's answer, written in first person, about 80-150 words"),
})

async function evaluateAnswer({question, intention, modelAnswer, answer, jobDescription, questionType}){
    const prompt = `You are an experienced interviewer. Evaluate the candidate's answer to this ${questionType} interview question.

Question: ${question}
What the interviewer wants to learn: ${intention}
Points a strong answer covers: ${modelAnswer}
Job description (for context): ${String(jobDescription).slice(0, 3000)}

Candidate's answer:
"""${answer}"""

Score fairly from 0 to 10 (0-3 weak, 4-6 average, 7-8 good, 9-10 excellent).
${questionType === "behavioral" ? "Check whether the answer follows the STAR method (Situation, Task, Action, Result)." : "Check technical accuracy, depth and clarity."}
If the answer is empty, off-topic or nonsense, give a score of 0-2 and say so politely.
Return ONLY JSON matching the schema.`

    const result = await generateJson(prompt, answerEvaluationSchema)
    result.score = Math.max(0, Math.min(10, Math.round(Number(result.score) || 0)))
    return result
}


// ── NEW: ATS keyword analysis ───────────────────────────────────────────────
const atsSchema = z.object({
    score: z.number().describe("ATS keyword match score from 0 to 100"),
    matchedKeywords: z.array(z.string()).describe("Important keywords/skills from the job description that ARE present in the resume/profile"),
    missingKeywords: z.array(z.string()).describe("Important keywords/skills from the job description that are MISSING from the resume/profile"),
    suggestions: z.array(z.string()).describe("3-6 specific suggestions to improve the resume for ATS and for this job"),
})

async function analyzeAts({resume, selfDescription, jobDescription}){
    const prompt = `Act as an Applicant Tracking System (ATS) and a recruiter.
Compare the candidate's resume/profile with the job description.
Extract the most important hard skills, tools, technologies and qualifications from the job description (10-25 keywords, short phrases),
then split them into matchedKeywords and missingKeywords. Do not invent keywords that aren't in the job description.

Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

Return ONLY JSON matching the schema.`

    const result = await generateJson(prompt, atsSchema)
    result.score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)))
    return result
}


// ── NEW: Cover letter ───────────────────────────────────────────────────────
const coverLetterSchema = z.object({
    content: z.string().describe("The full cover letter as plain text with paragraphs separated by blank lines"),
})

async function generateCoverLetter({resume, selfDescription, jobDescription, title, companyName}){
    const prompt = `Write a cover letter for the role "${title}"${companyName ? ` at ${companyName}` : ""}.

Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

Rules:
- 250-350 words, 3-4 paragraphs, plain text (no markdown, no placeholders like [Your Name] except the candidate's real name if it appears in the resume).
- Sound like a real person, specific and confident, not generic or robotic.
- Connect 2-3 concrete achievements/projects from the resume to the job requirements.
- Start with "Dear Hiring Manager," and end with a sign-off using the candidate's name if known.
Return ONLY JSON matching the schema.`

    return generateJson(prompt, coverLetterSchema)
}



module.exports = {generateInterviewReport,generateResumePdf,evaluateAnswer,analyzeAts,generateCoverLetter}
