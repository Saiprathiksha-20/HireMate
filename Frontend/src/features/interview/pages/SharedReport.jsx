import { useEffect, useState } from "react"
import { useParams, Link } from "react-router"
import "../style/interview.scss"
import "../style/features.scss"
import "../style/shared.scss"
import { getSharedReport } from "../services/interview.api"
import { getErrorMessage } from "../../../lib/api"
import { scoreColorOf, scoreTextOf, LEARNING_LINKS } from "../components/reportHelpers"

const QA = ({ q, i }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{i + 1}</span>
                <p className='q-card__question'>{q.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'><span className='q-card__tag q-card__tag--intention'>Intention</span><p>{q.intention || '—'}</p></div>
                    <div className='q-card__section'><span className='q-card__tag q-card__tag--answer'>Model Answer</span><p>{q.answer}</p></div>
                </div>
            )}
        </div>
    )
}

/** Public, read-only version of a report opened from a share link */
const SharedReport = () => {
    const { shareId } = useParams()
    const [ report, setReport ] = useState(null)
    const [ error, setError ] = useState("")

    useEffect(() => {
        getSharedReport(shareId)
            .then(d => setReport(d.interviewReport))
            .catch(e => setError(getErrorMessage(e, "This shared report doesn't exist or sharing was turned off.")))
    }, [ shareId ])

    if (error) {
        return (
            <main className='loading-screen' style={{ minHeight: "100vh" }}>
                <h1>{error}</h1>
                <Link to="/">Go to HireMate</Link>
            </main>
        )
    }

    if (!report) {
        return (
            <main className='loading-screen' style={{ minHeight: "100vh" }}>
                <span className='spinner spinner--large' />
                <h1>Loading shared report...</h1>
            </main>
        )
    }

    return (
        <div className='shared'>
            <header className='shared__bar'>
                <Link to="/" className='shared__brand'>Hire<span>Mate</span></Link>
                <span className='shared__by'>Shared by <strong>{report.sharedBy}</strong></span>
                <Link to="/register" className='btn btn--primary btn--small'>Create your own plan</Link>
            </header>

            <div className='shared__body'>
                <section className='shared__hero'>
                    <div>
                        <p className='shared__eyebrow'>Interview Preparation Plan</p>
                        <h1>{report.title}</h1>
                        {report.companyName && <p className='shared__company'>{report.companyName}</p>}
                        <p className='shared__date'>Generated {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className='match-score'>
                        <div className={`match-score__ring ${scoreColorOf(report.matchScore)}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className={`match-score__sub ${scoreColorOf(report.matchScore)}`}>{scoreTextOf(report.matchScore)}</p>
                    </div>
                </section>

                {report.skillGaps.length > 0 && (
                    <section className='shared__card'>
                        <h2>Skill Gaps</h2>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((g, i) => (
                                <a key={i} className={`skill-tag skill-tag--${g.severity}`} href={LEARNING_LINKS(g.skill)[ 0 ].url} target='_blank' rel='noopener noreferrer'>{g.skill}</a>
                            ))}
                        </div>
                    </section>
                )}

                <section className='shared__card'>
                    <h2>Technical Questions</h2>
                    <div className='q-list'>{report.technicalQuestions.map((q, i) => <QA key={i} q={q} i={i} />)}</div>
                </section>

                <section className='shared__card'>
                    <h2>Behavioral Questions</h2>
                    <div className='q-list'>{report.behavioralQuestions.map((q, i) => <QA key={i} q={q} i={i} />)}</div>
                </section>

                <section className='shared__card'>
                    <h2>Preparation Road Map</h2>
                    <div className='roadmap-list'>
                        {report.preparationPlan.map(d => (
                            <div key={d.day} className='roadmap-day'>
                                <div className='roadmap-day__header'>
                                    <span className='roadmap-day__badge'>Day {d.day}</span>
                                    <h3 className='roadmap-day__focus'>{d.focus}</h3>
                                    {d.timeframe && <span className='roadmap-day__time'>⏱ {d.timeframe}</span>}
                                </div>
                                <ul className='roadmap-day__tasks shared__tasks'>
                                    {d.tasks.map((t, i) => <li key={i}><span className='roadmap-day__bullet' />{t}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

export default SharedReport
