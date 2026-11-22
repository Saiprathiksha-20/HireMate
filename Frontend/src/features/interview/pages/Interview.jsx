import { useState } from 'react'
import '../style/interview.scss'
import '../style/features.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams, Link } from 'react-router'
import { updateProgress, setShare } from '../services/interview.api'
import { getErrorMessage } from '../../../lib/api'
import { useToast } from '../../../components/Toast'
import MockInterview from '../components/MockInterview'
import AtsPanel from '../components/AtsPanel'
import CoverLetterPanel from '../components/CoverLetterPanel'
import { PrintableReport } from '../components/ReportView'
import { LEARNING_LINKS, scoreColorOf, scoreTextOf } from '../components/reportHelpers'



const icon = (path) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>)

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: icon(<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />) },
    { id: 'roadmap', label: 'Road Map', icon: icon(<polygon points="3 11 22 2 13 21 11 13 3 11" />) },
    { id: 'mock', label: 'Mock Interview', badge: 'AI', icon: icon(<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></>) },
    { id: 'ats', label: 'ATS Check', icon: icon(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>) },
    { id: 'cover', label: 'Cover Letter', icon: icon(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index, onPractice, practicedScore }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                {practicedScore !== undefined && (
                    <span className={`q-card__practiced ${practicedScore >= 8 ? 'score--high' : practicedScore >= 5 ? 'score--mid' : 'score--low'}`} title='Your best practice score'>
                        {practicedScore}/10
                    </span>
                )}
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention || '—'}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                    {onPractice && (
                        <button className='btn btn--ghost btn--small q-card__practice' onClick={onPractice}>
                            🎙 Practice this question
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day, completed, onToggle }) => {
    const done = day.tasks.filter((_, i) => completed.has(`${day.day}-${i}`)).length
    return (
        <div className={`roadmap-day ${done === day.tasks.length && day.tasks.length > 0 ? 'roadmap-day--complete' : ''}`}>
            <div className='roadmap-day__header'>
                <span className='roadmap-day__badge'>Day {day.day}</span>
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
                {day.timeframe && <span className='roadmap-day__time'>⏱ {day.timeframe}</span>}
                <span className='roadmap-day__count'>{done}/{day.tasks.length}</span>
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, i) => {
                    const checked = completed.has(`${day.day}-${i}`)
                    return (
                        <li key={i}>
                            <label className={`task-check ${checked ? 'task-check--done' : ''}`}>
                                <input type='checkbox' checked={checked} onChange={() => onToggle(day.day, i, !checked)} />
                                <span className='task-check__box' />
                                <span className='task-check__text'>{task}</span>
                            </label>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    // useInterview already fetches the report when interviewId is in the URL,
    // so we don't fetch it a second time here.
    const { report, setReport, loading, error, getResumePdf } = useInterview()
    const { interviewId } = useParams()
    const toast = useToast()
    const [ pdfLoading, setPdfLoading ] = useState(false)
    const [ shareBusy, setShareBusy ] = useState(false)
    const [ practiceTarget, setPracticeTarget ] = useState(null)

    const handleDownloadResume = async () => {
        setPdfLoading(true)
        const ok = await getResumePdf(interviewId)
        if (ok) toast.success("Tailored resume downloaded")
        else toast.error("Could not generate the resume. Please try again.")
        setPdfLoading(false)
    }

    if (!loading && error) {
        return (
            <main className='loading-screen'>
                <h1>{error}</h1>
                <Link to="/">Back to home</Link>
            </main>
        )
    }

    if (loading || !report || report._id !== interviewId) {
        return (
            <main className='loading-screen'>
                <span className='spinner spinner--large' />
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const scoreColor = scoreColorOf(report.matchScore)
    const scoreText = scoreTextOf(report.matchScore)

    const completed = new Set(report.completedTasks || [])
    const totalTasks = report.preparationPlan.reduce((sum, d) => sum + d.tasks.length, 0)
    const doneTasks = report.preparationPlan.reduce((sum, d) => sum + d.tasks.filter((_, i) => completed.has(`${d.day}-${i}`)).length, 0)
    const progressPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

    // best practice score per question, shown on the question cards
    const bestScore = {}
    ;(report.practiceAttempts || []).forEach(a => {
        const key = `${a.questionType}-${a.questionIndex}`
        bestScore[ key ] = Math.max(bestScore[ key ] ?? 0, a.score ?? 0)
    })

    const toggleTask = async (day, taskIndex, done) => {
        const key = `${day}-${taskIndex}`
        const previous = report.completedTasks || []
        // update the UI immediately, then save
        setReport(r => ({ ...r, completedTasks: done ? [ ...new Set([ ...previous, key ]) ] : previous.filter(k => k !== key) }))
        try {
            const data = await updateProgress(report._id, { day, taskIndex, done })
            setReport(r => ({ ...r, completedTasks: data.completedTasks }))
            if (done && doneTasks + 1 === totalTasks) toast.success("🎉 Road map complete! You're ready.")
        } catch (err) {
            setReport(r => ({ ...r, completedTasks: previous }))
            toast.error(getErrorMessage(err, "Could not save progress"))
        }
    }

    const practice = (type, index) => {
        setPracticeTarget(prev => ({ type, index, at: (prev?.at || 0) + 1 }))
        setActiveNav('mock')
    }

    const shareUrl = report.shareId ? `${window.location.origin}/shared/${report.shareId}` : ""

    const toggleShare = async () => {
        setShareBusy(true)
        try {
            const data = await setShare(report._id, !report.shareId)
            setReport(r => ({ ...r, shareId: data.shareId || undefined }))
            if (data.shareId) {
                const url = `${window.location.origin}/shared/${data.shareId}`
                try { await navigator.clipboard.writeText(url); toast.success("Share link created & copied") }
                catch { toast.success("Share link created") }
            } else {
                toast.info("Share link turned off")
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update sharing"))
        } finally {
            setShareBusy(false)
        }
    }

    const copyShare = async () => {
        try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied") }
        catch { toast.error("Couldn't copy the link") }
    }


    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <div className='interview-nav__title'>
                            <p className='interview-nav__job' title={report.title}>{report.title}</p>
                            {report.companyName && <p className='interview-nav__company'>{report.companyName}</p>}
                        </div>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                                {item.badge && <span className='interview-nav__badge'>{item.badge}</span>}
                            </button>
                        ))}
                    </div>
                    <div className='interview-nav__actions'>
                        <button
                            onClick={handleDownloadResume}
                            disabled={pdfLoading}
                            className='button primary-button' >
                            {pdfLoading ? <span className='spinner' style={{ marginRight: "0.6rem", width: 12, height: 12 }} /> : (
                                <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                            )}
                            {pdfLoading ? 'Generating Resume...' : 'Download Resume'}
                        </button>
                        <button className='btn btn--ghost' onClick={() => window.print()}>
                            🖨 Print / Save report
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} onPractice={() => practice('technical', i)} practicedScore={bestScore[ `technical-${i}` ]} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} onPractice={() => practice('behavioral', i)} practicedScore={bestScore[ `behavioral-${i}` ]} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                                <span className='content-header__progress'>{doneTasks}/{totalTasks} tasks done</span>
                            </div>
                            <div className='progress-bar progress-bar--wide'><span style={{ width: `${progressPct}%` }} /></div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} completed={completed} onToggle={toggleTask} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'mock' && <MockInterview key={practiceTarget?.at || 0} report={report} setReport={setReport} initialQuestion={practiceTarget} />}
                    {activeNav === 'ats' && <AtsPanel report={report} setReport={setReport} />}
                    {activeNav === 'cover' && <CoverLetterPanel report={report} setReport={setReport} />}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className={`match-score__sub ${scoreColor}`}>{scoreText}</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Progress */}
                    <div className='sidebar-block'>
                        <p className='skill-gaps__label'>Preparation Progress</p>
                        <div className='progress-bar'><span style={{ width: `${progressPct}%` }} /></div>
                        <p className='sidebar-block__sub'>{progressPct}% · {doneTasks} of {totalTasks} tasks</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`} title={`${gap.severity} priority`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Learning resources */}
                    {report.skillGaps.length > 0 && (
                        <div className='learn'>
                            <p className='skill-gaps__label'>Learn the gaps</p>
                            {report.skillGaps.map((gap, i) => (
                                <div key={i} className='learn__row'>
                                    <span className='learn__skill'>{gap.skill}</span>
                                    <span className='learn__links'>
                                        {LEARNING_LINKS(gap.skill).map(l => (
                                            <a key={l.label} href={l.url} target='_blank' rel='noopener noreferrer'>{l.label}</a>
                                        ))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className='sidebar-divider' />

                    {/* Share */}
                    <div className='sidebar-block'>
                        <p className='skill-gaps__label'>Share Report</p>
                        <p className='sidebar-block__sub'>Read-only link for a mentor or friend. Your resume is never shown.</p>
                        {report.shareId && (
                            <div className='share-box'>
                                <input readOnly value={shareUrl} onFocus={e => e.target.select()} aria-label='Share link' />
                                <button className='btn btn--ghost btn--small' onClick={copyShare}>Copy</button>
                            </div>
                        )}
                        <button className={`btn btn--small ${report.shareId ? 'btn--ghost' : 'btn--primary'}`} onClick={toggleShare} disabled={shareBusy}>
                            {shareBusy ? <span className='spinner' /> : report.shareId ? 'Turn off sharing' : '🔗 Create share link'}
                        </button>
                    </div>

                </aside>
            </div>

            <PrintableReport report={report} />
        </div>
    )
}

export default Interview
