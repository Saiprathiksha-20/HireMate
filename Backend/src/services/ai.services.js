const {GoogleGenAI} = require("@google/genai")
const {z}= require("zod")
const{zodToJsonSchema}= require("zod-to-json-schema")
const puppeteer=require("puppeteer")



const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})




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
    


async function generateInterviewReport({resume, selfDescription, jobDescription}){
   
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

For preparationPlan, tasks must be an array of individual task strings.

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`
   


console.log("🚀 About to call Gemini");

console.log(
    JSON.stringify(zodToJsonSchema(interviewReportSchema), null, 2)
);


try{


    const response = await ai.models.generateContent({
        model:"gemini-3-flash-preview",
        contents: prompt,
        config:{
            responseMimeType:"application/json",
            responseSchema:zodToJsonSchema(interviewReportSchema)
        }


    });
    console.log("✅ Gemini responded");
    console.log(response.text)
    return JSON.parse(response.text)
}catch(error){
console.error("❌ GEMINI API ERROR")
        console.error("Message:", error.message)
        console.error("Status:", error.status)
        console.error("Status code:", error.code)
        console.error("Full error:", error)

        throw error
}
}



async function generatePdfFromHtml(htmlContent){
    const browser=await puppeteer.launch()
    const page=await browser.newPage();
    await page.setContent(htmlContent, {waitUntil: "networkidle0"})

    const pdfBuffer=await page.pdf({
        format:"A4",margins:{
            top:"20mm",
            bottom:"20mm",
            left:"15mm",
            right:"15mm"
        }
    })

    await browser.close() 

    return pdfBuffer
}


async function generateResumePdf({resume, selfDescription,jobDescription}){
    const resumePdfSchema=z.object({
        html:z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

   const prompt=`Generate resume  for a candidate with the following details:
   Resume:${resume}
   Self Description: ${selfDescription}
   Job Description: ${jobDescription}
   the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer 
   the resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The  HTML content should be well-formatted and structured, making it easy to read and visible.
   the content of resume should not sound like: it's generated by AI and should be as close as possible to a real human-written resume. 
   you can highlight the content using some colors or different font styles but the overall design should be simple and professional. 
   the content should be ATS friendly, i.e, it should be easily parsable by ATS systems without losing important information.
   the resume should not be so lengthy, it should only be 1 page long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information thatcan increase the candidate's chances of getting an interview call for the given job description.
   
   `


   const response =await ai.models.generateContent({
    model:"gemini-3-flash-preview",
    contents:prompt,
    config:{
        responseMimeType:"application/json",
        responseSchema:zodToJsonSchema(resumePdfSchema),
    }
   })
   const jsonContent= JSON.parse(response.text)

   const pdfBuffer=await generatePdfFromHtml(jsonContent.html)

   return pdfBuffer

}



module.exports = {generateInterviewReport,generateResumePdf}