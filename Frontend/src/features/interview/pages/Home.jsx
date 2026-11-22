import { useState, useRef, useEffect } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'

const LOADING_STEPS = [
    "Reading your resume...",
    "Analyzing the job description...",
    "Calculating your match score...",
    "Writing technical questions...",
    "Writing behavioral questions...",
    "Finding your skill gaps...",
    "Building your day-wise roadmap...",
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

const Home = () => {

    const { loading, generateReport, reports, error, setError } = useInterview()
    const { user } = useAuth()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ companyName, setCompanyName ] = useState("")
    const [ resumeFile, setResumeFile ] = useState(null)
    const [ dragging, setDragging ] = useState(false)
    const [ generating, setGenerating ] = useState(false)
    const [ step, setStep ] = useState(0)
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    // clear any old error when arriving on the page
    useEffect(() => { setError("") }, [ setError ])

    // rotate the loading messages while the AI works
    useEffect(() => {
        if (!generating) return
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStep(0)
        const t = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 4000)
        return () => clearInterval(t)
    }, [ generating ])

    const pickFile = (file) => {
        if (!file) return
        if (file.type !== "application/pdf") {
            setError("Please upload a PDF file.")
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            setError("Resume must be smaller than 5MB.")
            return
        }
        setError("")
        setResumeFile(file)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        pickFile(e.dataTransfer.files?.[ 0 ])
    }

    const clearFile = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setResumeFile(null)
        if (resumeInputRef.current) resumeInputRef.current.value = ""
    }

    const handleGenerateReport = async () => {
        // Validate before calling the backend (the backend validates too)
        if (!jobDescription.trim()) {
            setError("Please paste the job description.")
            return
        }
        if (!resumeFile && !selfDescription.trim()) {
            setError("Please upload your resume or write a short self description.")
            return
        }

        setGenerating(true)
        const data = await generateReport({ jobDescription, selfDescription, resumeFile, companyName: companyName.trim() })
        setGenerating(false)
        if(!data){
            return
        }
        navigate(`/interview/${data._id}`)
    }

    if (generating) {
        return (
            <main className='loading-screen loading-screen--generate'>
                <div className='generate-loader'>
                    <span className='spinner spinner--large' />
                    <h1>Building your interview plan</h1>
                    <p className='generate-loader__step' key={step}>{LOADING_STEPS[ step ]}</p>
                    <div className='generate-loader__bar'>
                        <span style={{ width: `${((step + 1) / LOADING_STEPS.length) * 100}%` }} />
                    </div>
                    <p className='generate-loader__hint'>This usually takes 20–40 seconds. Please don't close this tab.</p>
                </div>
            </main>
        )
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const recent = reports.slice(0, 3)

    return (
        <div className='home-page'>

            {/* Page Header */}
            <header className='page-header'>
                {user?.username && <p className='page-header__greeting'>Welcome back, {user.username} 👋</p>}
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <input
                            className='panel__input'
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            maxLength={100}
                            placeholder='Company name (optional) – e.g. Google, Infosys, Swiggy'
                            aria-label='Company name'
                        />
                        <textarea
                            value={jobDescription}
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            <label
                                className={`dropzone ${dragging ? 'dropzone--active' : ''} ${resumeFile ? 'dropzone--filled' : ''}`}
                                htmlFor='resume'
                                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                            >
                                <span className='dropzone__icon'>
                                    {resumeFile ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="9 15 11 17 15 13" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                    )}
                                </span>
                                {resumeFile ? (
                                    <>
                                        <p className='dropzone__title'>{resumeFile.name}</p>
                                        <p className='dropzone__subtitle'>
                                            {(resumeFile.size / 1024).toFixed(0)} KB · <button type='button' className='dropzone__remove' onClick={clearFile}>Remove</button>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                        <p className='dropzone__subtitle'>PDF only (Max 5MB)</p>
                                    </>
                                )}
                                <input ref={resumeInputRef} hidden type='file' id='resume' name='resume' accept='application/pdf,.pdf'
                                    onChange={(e) => pickFile(e.target.files[ 0 ])} />
                            </label>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                value={selfDescription}
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {error && <p className='form-error-banner'>{error}</p>}

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {recent.length > 0 && (
                <section className='recent-reports'>
                    <div className='recent-reports__header'>
                        <h2>My Recent Interview Plans</h2>
                        {reports.length > 0 && <Link to="/dashboard" className='recent-reports__all'>View all ({reports.length}) →</Link>}
                    </div>
                    <ul className='reports-list'>
                        {recent.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                {report.companyName && <p className='report-company'>{report.companyName}</p>}
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <span>© {new Date().getFullYear()} HireMate</span>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/profile">Settings</Link>
            </footer>
        </div>
    )
}

export default Home
