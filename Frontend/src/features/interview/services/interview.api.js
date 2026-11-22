import { api } from "../../../lib/api"


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile, companyName }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    if (companyName) {
        formData.append("companyName", companyName)
    }
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    // axios sets the multipart Content-Type (with boundary) automatically for FormData
    const response = await api.post("/api/interview/", formData)

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

// ═════════════════════════════ NEW ═════════════════════════════

export const getStats = async () => (await api.get("/api/interview/stats")).data

export const updateReport = async (interviewId, { title, companyName }) =>
    (await api.patch(`/api/interview/report/${interviewId}`, { title, companyName })).data

export const deleteReport = async (interviewId) =>
    (await api.delete(`/api/interview/report/${interviewId}`)).data

export const updateProgress = async (interviewId, { day, taskIndex, done }) =>
    (await api.patch(`/api/interview/report/${interviewId}/progress`, { day, taskIndex, done })).data

export const evaluateAnswer = async (interviewId, { questionType, questionIndex, answer }) =>
    (await api.post(`/api/interview/report/${interviewId}/evaluate`, { questionType, questionIndex, answer })).data

export const getAtsAnalysis = async (interviewId, refresh = false) =>
    (await api.post(`/api/interview/report/${interviewId}/ats${refresh ? "?refresh=true" : ""}`)).data

export const getCoverLetter = async (interviewId, refresh = false) =>
    (await api.post(`/api/interview/report/${interviewId}/cover-letter${refresh ? "?refresh=true" : ""}`)).data

export const setShare = async (interviewId, enabled) =>
    (await api.post(`/api/interview/report/${interviewId}/share`, { enabled })).data

export const getSharedReport = async (shareId) =>
    (await api.get(`/api/interview/shared/${shareId}`)).data
