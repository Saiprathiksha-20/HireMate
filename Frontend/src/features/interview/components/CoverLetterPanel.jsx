import { useState } from "react"
import { getCoverLetter } from "../services/interview.api"
import { getErrorMessage } from "../../../lib/api"
import { useToast } from "../../../components/Toast"

/** AI cover letter tailored to this job – copy or download as .txt */
const CoverLetterPanel = ({ report, setReport }) => {
    const toast = useToast()
    const [ busy, setBusy ] = useState(false)
    const letter = report.coverLetter?.content

    const run = async (refresh = false) => {
        setBusy(true)
        try {
            const data = await getCoverLetter(report._id, refresh)
            setReport(r => ({ ...r, coverLetter: data.coverLetter }))
            if (refresh) toast.success("New cover letter generated")
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not generate the cover letter."))
        } finally {
            setBusy(false)
        }
    }

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(letter)
            toast.success("Copied to clipboard")
        } catch {
            toast.error("Couldn't copy – please select the text manually")
        }
    }

    const download = () => {
        const url = URL.createObjectURL(new Blob([ letter ], { type: "text/plain" }))
        const a = document.createElement("a")
        a.href = url
        a.download = `cover_letter_${(report.title || "job").replace(/[^a-z0-9]+/gi, "_")}.txt`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    return (
        <section>
            <div className='content-header'>
                <h2>Cover Letter</h2>
                {report.coverLetter?.generatedAt && <span className='content-header__count'>Generated {new Date(report.coverLetter.generatedAt).toLocaleDateString()}</span>}
            </div>

            {!letter ? (
                <div className='empty-state'>
                    <span style={{ fontSize: "2rem" }}>✉️</span>
                    <h3>A cover letter written for this exact job</h3>
                    <p>We'll connect your real projects and experience to what {report.companyName || "the company"} is asking for.</p>
                    <button className='btn btn--primary' onClick={() => run(false)} disabled={busy}>
                        {busy ? <><span className='spinner' /> Writing...</> : 'Generate cover letter'}
                    </button>
                </div>
            ) : (
                <div className='letter'>
                    <div className='letter__actions'>
                        <button className='btn btn--ghost btn--small' onClick={copy}>📋 Copy</button>
                        <button className='btn btn--ghost btn--small' onClick={download}>⬇ Download .txt</button>
                        <button className='btn btn--ghost btn--small' onClick={() => run(true)} disabled={busy}>
                            {busy ? <><span className='spinner' /> Rewriting...</> : '↻ Regenerate'}
                        </button>
                    </div>
                    <article className='letter__paper'>
                        {letter.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
                    </article>
                </div>
            )}
        </section>
    )
}

export default CoverLetterPanel
