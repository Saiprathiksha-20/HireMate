import { useState } from "react"
import { getAtsAnalysis } from "../services/interview.api"
import { getErrorMessage } from "../../../lib/api"
import { useToast } from "../../../components/Toast"

const scoreClass = (s) => s >= 75 ? "score--high" : s >= 50 ? "score--mid" : "score--low"

/** ATS keyword check: which job keywords your resume has / is missing */
const AtsPanel = ({ report, setReport }) => {
    const toast = useToast()
    const [ busy, setBusy ] = useState(false)
    const ats = report.atsAnalysis

    const run = async (refresh = false) => {
        setBusy(true)
        try {
            const data = await getAtsAnalysis(report._id, refresh)
            setReport(r => ({ ...r, atsAnalysis: data.atsAnalysis }))
            if (refresh) toast.success("ATS analysis updated")
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not run the ATS check."))
        } finally {
            setBusy(false)
        }
    }

    return (
        <section>
            <div className='content-header'>
                <h2>ATS Keyword Check</h2>
                {ats?.generatedAt && <span className='content-header__count'>Checked {new Date(ats.generatedAt).toLocaleDateString()}</span>}
            </div>

            {!ats?.generatedAt ? (
                <div className='empty-state'>
                    <span style={{ fontSize: "2rem" }}>🔍</span>
                    <h3>Will your resume pass the ATS filter?</h3>
                    <p>Most companies use Applicant Tracking Systems that scan resumes for keywords from the job description. Find out which ones you're missing.</p>
                    <button className='btn btn--primary' onClick={() => run(false)} disabled={busy}>
                        {busy ? <><span className='spinner' /> Scanning...</> : 'Run ATS check'}
                    </button>
                </div>
            ) : (
                <div className='ats'>
                    <div className='ats__top'>
                        <div className={`ats__score ${scoreClass(ats.score)}`}>
                            <strong>{ats.score}</strong><span>%</span>
                        </div>
                        <div className='ats__summary'>
                            <h3>{ats.score >= 75 ? "Great keyword coverage" : ats.score >= 50 ? "Decent, but some gaps" : "Likely to be filtered out"}</h3>
                            <p>{ats.matchedKeywords.length} of {ats.matchedKeywords.length + ats.missingKeywords.length} important keywords found in your profile.</p>
                            <div className='ats__bar'>
                                <span style={{ width: `${ats.score}%` }} />
                            </div>
                        </div>
                        <button className='btn btn--ghost btn--small' onClick={() => run(true)} disabled={busy}>
                            {busy ? <span className='spinner' /> : '↻ Re-run'}
                        </button>
                    </div>

                    <div className='ats__group'>
                        <p className='ats__label ats__label--missing'>Missing keywords ({ats.missingKeywords.length})</p>
                        <div className='chip-list'>
                            {ats.missingKeywords.length === 0 && <span className='ats__none'>None – nice!</span>}
                            {ats.missingKeywords.map(k => <span key={k} className='chip chip--missing'>✕ {k}</span>)}
                        </div>
                    </div>

                    <div className='ats__group'>
                        <p className='ats__label ats__label--matched'>Matched keywords ({ats.matchedKeywords.length})</p>
                        <div className='chip-list'>
                            {ats.matchedKeywords.map(k => <span key={k} className='chip chip--matched'>✓ {k}</span>)}
                        </div>
                    </div>

                    {ats.suggestions?.length > 0 && (
                        <div className='ats__group'>
                            <p className='ats__label'>Suggestions</p>
                            <ol className='ats__suggestions'>
                                {ats.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}

export default AtsPanel
