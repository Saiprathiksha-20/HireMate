import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import "../style/dashboard.scss"
import { getStats, getAllInterviewReports, updateReport, deleteReport } from "../services/interview.api"
import { getErrorMessage } from "../../../lib/api"
import { useToast } from "../../../components/Toast"
import Modal from "../../../components/Modal"
import ScoreChart from "../components/ScoreChart"

const scoreClass = (s) => s >= 80 ? "score--high" : s >= 60 ? "score--mid" : "score--low"

const StatCard = ({ label, value, sub, accent }) => (
    <div className={`stat-card ${accent ? `stat-card--${accent}` : ""}`}>
        <span className='stat-card__label'>{label}</span>
        <strong className='stat-card__value'>{value}</strong>
        {sub && <span className='stat-card__sub'>{sub}</span>}
    </div>
)

const Dashboard = () => {
    const toast = useToast()
    const navigate = useNavigate()
    const [ stats, setStats ] = useState(null)
    const [ reports, setReports ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ query, setQuery ] = useState("")
    const [ sort, setSort ] = useState("newest")
    const [ editing, setEditing ] = useState(null)   // { id, title, companyName }
    const [ deleting, setDeleting ] = useState(null) // report
    const [ busy, setBusy ] = useState(false)

    const load = useCallback(async () => {
        try {
            const [ s, r ] = await Promise.all([ getStats(), getAllInterviewReports() ])
            setStats(s.stats)
            setReports(r.interviewReports)
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not load your dashboard"))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load() }, [ load ])

    const progressById = useMemo(() => {
        const map = {}
        ;(stats?.progress || []).forEach(p => { map[ p.id ] = p })
        return map
    }, [ stats ])

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase()
        const list = reports.filter(r => !q || r.title?.toLowerCase().includes(q) || r.companyName?.toLowerCase().includes(q))
        const sorted = [ ...list ]
        if (sort === "oldest") sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        if (sort === "newest") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        if (sort === "score") sorted.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
        return sorted
    }, [ reports, query, sort ])

    const saveEdit = async () => {
        if (!editing.title.trim()) { toast.error("Title can't be empty"); return }
        setBusy(true)
        try {
            const data = await updateReport(editing.id, { title: editing.title, companyName: editing.companyName })
            setReports(rs => rs.map(r => r._id === editing.id ? { ...r, title: data.interviewReport.title, companyName: data.interviewReport.companyName } : r))
            setEditing(null)
            toast.success("Report updated")
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not update the report"))
        } finally {
            setBusy(false)
        }
    }

    const confirmDelete = async () => {
        setBusy(true)
        try {
            await deleteReport(deleting._id)
            setDeleting(null)
            toast.success("Report deleted")
            load()
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not delete the report"))
        } finally {
            setBusy(false)
        }
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <span className='spinner spinner--large' />
                <h1>Loading your dashboard...</h1>
            </main>
        )
    }

    const tasksPct = stats?.totalTasks ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0

    return (
        <div className='dashboard'>
            <header className='dashboard__header'>
                <div>
                    <h1>Your <span className='highlight'>Dashboard</span></h1>
                    <p>Track your match scores, practice and preparation across every job you're targeting.</p>
                </div>
                <Link to="/" className='btn btn--primary'>+ New Interview Plan</Link>
            </header>

            {reports.length === 0 ? (
                <div className='dash-card'>
                    <div className='empty-state'>
                        <span style={{ fontSize: "2.2rem" }}>🚀</span>
                        <h3>No interview plans yet</h3>
                        <p>Paste a job description and your resume to get questions, a skill-gap analysis and a day-wise roadmap.</p>
                        <Link to="/" className='btn btn--primary'>Create your first plan</Link>
                    </div>
                </div>
            ) : (
                <>
                    <div className='stat-grid'>
                        <StatCard label='Interview plans' value={stats.totalReports} />
                        <StatCard label='Average match' value={`${stats.averageMatchScore}%`} sub={`Best: ${stats.bestMatchScore}%`} accent='pink' />
                        <StatCard label='Answers practiced' value={stats.totalPracticeAnswers} sub={stats.totalPracticeAnswers ? `Avg score ${stats.averagePracticeScore}/10` : 'Try Mock Interview'} accent='purple' />
                        <StatCard label='Roadmap tasks done' value={`${stats.tasksCompleted}/${stats.totalTasks}`} sub={`${tasksPct}% complete`} accent='green' />
                    </div>

                    <div className='dash-grid'>
                        <div className='dash-card'>
                            <div className='dash-card__head'>
                                <h2>Match score over time</h2>
                                <span>{stats.scoreHistory.length} plans</span>
                            </div>
                            <ScoreChart points={stats.scoreHistory} />
                        </div>

                        <div className='dash-card'>
                            <div className='dash-card__head'>
                                <h2>Most common skill gaps</h2>
                            </div>
                            {stats.topSkillGaps.length === 0 ? <p className='dash-muted'>No skill gaps found 🎉</p> : (
                                <ul className='gap-bars'>
                                    {stats.topSkillGaps.map(g => (
                                        <li key={g.skill}>
                                            <span className='gap-bars__name'>{g.skill}</span>
                                            <span className='gap-bars__track'>
                                                <span style={{ width: `${(g.count / stats.topSkillGaps[ 0 ].count) * 100}%` }} />
                                            </span>
                                            <span className='gap-bars__count'>{g.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className='dash-muted dash-muted--small'>Skills that show up again and again are the best ones to learn first.</p>
                        </div>
                    </div>

                    <div className='dash-card'>
                        <div className='dash-card__head dash-card__head--tools'>
                            <h2>All interview plans</h2>
                            <div className='dash-tools'>
                                <input
                                    className='dash-search'
                                    placeholder='Search by job title or company...'
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    aria-label='Search reports'
                                />
                                <select className='dash-select' value={sort} onChange={e => setSort(e.target.value)} aria-label='Sort reports'>
                                    <option value='newest'>Newest first</option>
                                    <option value='oldest'>Oldest first</option>
                                    <option value='score'>Highest score</option>
                                </select>
                            </div>
                        </div>

                        {visible.length === 0 ? <p className='dash-muted'>No plans match “{query}”.</p> : (
                            <div className='report-table'>
                                {visible.map(r => {
                                    const p = progressById[ r._id ]
                                    const pct = p?.total ? Math.round((p.done / p.total) * 100) : 0
                                    return (
                                        <div key={r._id} className='report-row' onClick={() => navigate(`/interview/${r._id}`)}>
                                            <div className={`report-row__score ${scoreClass(r.matchScore)}`}>{r.matchScore ?? "–"}<small>%</small></div>
                                            <div className='report-row__main'>
                                                <h3>{r.title || "Untitled Position"}</h3>
                                                <p>{r.companyName ? <span className='report-row__company'>{r.companyName} · </span> : null}{new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
                                            </div>
                                            <div className='report-row__progress' title={`${pct}% of roadmap done`}>
                                                <span className='report-row__progress-label'>{pct}%</span>
                                                <span className='report-row__progress-track'><span style={{ width: `${pct}%` }} /></span>
                                            </div>
                                            <div className='report-row__actions' onClick={e => e.stopPropagation()}>
                                                <button className='icon-btn' title='Rename' aria-label='Rename' onClick={() => setEditing({ id: r._id, title: r.title || "", companyName: r.companyName || "" })}>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                                                </button>
                                                <button className='icon-btn icon-btn--danger' title='Delete' aria-label='Delete' onClick={() => setDeleting(r)}>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            <Modal
                open={!!editing}
                title='Edit interview plan'
                onClose={() => !busy && setEditing(null)}
                actions={<>
                    <button className='btn btn--ghost' onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                    <button className='btn btn--primary' onClick={saveEdit} disabled={busy}>{busy ? <span className='spinner' /> : 'Save'}</button>
                </>}
            >
                {editing && (
                    <>
                        <div className='field'>
                            <label htmlFor='edit-title'>Job title</label>
                            <input id='edit-title' value={editing.title} maxLength={150} onChange={e => setEditing({ ...editing, title: e.target.value })} autoFocus />
                        </div>
                        <div className='field'>
                            <label htmlFor='edit-company'>Company</label>
                            <input id='edit-company' value={editing.companyName} maxLength={100} placeholder='Optional' onChange={e => setEditing({ ...editing, companyName: e.target.value })} />
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                open={!!deleting}
                title='Delete this plan?'
                onClose={() => !busy && setDeleting(null)}
                actions={<>
                    <button className='btn btn--ghost' onClick={() => setDeleting(null)} disabled={busy}>Cancel</button>
                    <button className='btn btn--danger' onClick={confirmDelete} disabled={busy}>{busy ? <span className='spinner' /> : 'Delete'}</button>
                </>}
            >
                <p>“{deleting?.title}” and all its practice answers, ATS check and cover letter will be permanently deleted.</p>
            </Modal>
        </div>
    )
}

export default Dashboard
