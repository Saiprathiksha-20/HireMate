import { getAllInterviewReports, generateInterviewReport, getInterviewReportById,generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"
import { getErrorMessage } from "../../../lib/api"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile, companyName }) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, companyName })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            setError(getErrorMessage(error, "Could not generate the report. Please try again."))
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        setError("")
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            setReport(null)
            setError(getErrorMessage(error, "Could not load this report."))
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            console.log(error)
            return []
        } finally {
            setLoading(false)
        }
    }

    // Resume generation has its own "busy" flag in the page, so we don't swap
    // the whole report page for a loading screen while the PDF is being made.
    const getResumePdf=async (interviewReportId)=>{
        try{
            const response=await generateResumePdf({interviewReportId})
            const url=window.URL.createObjectURL(new Blob([response], {type:"application/pdf"}))
            const link=document.createElement("a")
            link.href=url
            link.setAttribute("download",`resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            return true
        }
        catch (error){
            console.log(error)
            return false
        }
    }


    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ interviewId ])

    return { loading, report, setReport, reports, setReports, error, setError, generateReport, getReportById, getReports, getResumePdf }

}
