import { useEffect, useMemo, useRef, useState } from "react"
import { evaluateAnswer } from "../services/interview.api"
import { getErrorMessage } from "../../../lib/api"
import { useToast } from "../../../components/Toast"

// Browser speech-to-text (Chrome / Edge). Firefox doesn't support it, so we hide the mic there.
const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null

const scoreClass = (s) => s >= 8 ? "score--high" : s >= 5 ? "score--mid" : "score--low"

const formatTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`

/**
 * Mock Interview mode:
 * pick a question → (optionally listen to it) → answer by typing or speaking →
 * AI scores it out of 10 with feedback, strengths, improvements and a better answer.
 */
const MockInterview = ({ report, setReport, initialQuestion }) => {
    const toast = useToast()
    const [ type, setType ] = useState(initialQuestion?.type || "technical")
    const [ index, setIndex ] = useState(initialQuestion?.index || 0)
    const [ answer, setAnswer ] = useState("")
    const [ submitting, setSubmitting ] = useState(false)
    const [ listening, setListening ] = useState(false)
    const [ showModel, setShowModel ] = useState(false)
    const [ seconds, setSeconds ] = useState(0)
    const [ timerOn, setTimerOn ] = useState(false)
    const recognitionRef = useRef(null)
    const feedbackRef = useRef(null)
    const baseTextRef = useRef("")

    const questions = type === "technical" ? report.technicalQuestions : report.behavioralQuestions
    const question = questions[ index ]

    const attempts = useMemo(() =>
        (report.practiceAttempts || [])
            .filter(a => a.questionType === type && a.questionIndex === index)
            .slice()
            .reverse()
    , [ report.practiceAttempts, type, index ])

    const latest = attempts[ 0 ]

    // switch question and reset the answer box
    const selectQuestion = (newType, newIndex) => {
        setType(newType)
        setIndex(newIndex)
        setAnswer("")
        setShowModel(false)
        setSeconds(0)
        setTimerOn(false)
        stopListening()
        window.speechSynthesis?.cancel()
    }

    // simple stopwatch so it feels like a real interview
    useEffect(() => {
        if (!timerOn) return
        const t = setInterval(() => setSeconds(s => s + 1), 1000)
        return () => clearInterval(t)
    }, [ timerOn ])

    // stop mic / voice when leaving the page
    useEffect(() => () => {
        recognitionRef.current?.stop()
        window.speechSynthesis?.cancel()
    }, [])

    const speak = () => {
        if (!window.speechSynthesis || !question) return
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(question.question)
        u.rate = 0.95
        window.speechSynthesis.speak(u)
    }

    const startListening = () => {
        if (!SpeechRecognition) return
        const rec = new SpeechRecognition()
        rec.lang = "en-IN"
        rec.continuous = true
        rec.interimResults = true
        baseTextRef.current = answer ? answer.trim() + " " : ""
        rec.onresult = (event) => {
            let text = ""
            for (let i = 0; i < event.results.length; i++) text += event.results[ i ][ 0 ].transcript
            setAnswer(baseTextRef.current + text)
        }
        rec.onerror = (e) => {
            if (e.error === "not-allowed") toast.error("Microphone permission denied.")
            setListening(false)
        }
        rec.onend = () => setListening(false)
        rec.start()
        recognitionRef.current = rec
        setListening(true)
        setTimerOn(true)
    }

    function stopListening() {
        recognitionRef.current?.stop()
        recognitionRef.current = null
        setListening(false)
    }

    const submit = async () => {
        if (answer.trim().length < 10) {
            toast.error("Please write a bit more (at least 10 characters).")
            return
        }
        stopListening()
        setTimerOn(false)
        setSubmitting(true)
        try {
            const data = await evaluateAnswer(report._id, { questionType: type, questionIndex: index, answer })
            setReport(r => ({ ...r, practiceAttempts: [ ...(r.practiceAttempts || []), data.attempt ] }))
            setAnswer("")
            setShowModel(true)
            toast.success(`Scored ${data.attempt.score}/10`)
            setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not evaluate your answer."))
        } finally {
            setSubmitting(false)
        }
    }

    const total = report.technicalQuestions.length + report.behavioralQuestions.length
    const practicedKeys = new Set((report.practiceAttempts || []).map(a => `${a.questionType}-${a.questionIndex}`))

    if (!question) {
        return <div className='empty-state'><h3>No questions in this report</h3></div>
    }

    return (
        <section className='mock'>
            <div className='content-header'>
                <h2>Mock Interview</h2>
                <span className='content-header__count'>{practicedKeys.size}/{total} practiced</span>
            </div>

            {/* question picker */}
            <div className='mock__picker'>
                <div className='segmented'>
                    <button className={type === "technical" ? "active" : ""} onClick={() => selectQuestion("technical", 0)}>Technical</button>
                    <button className={type === "behavioral" ? "active" : ""} onClick={() => selectQuestion("behavioral", 0)}>Behavioral</button>
                </div>
                <div className='mock__dots'>
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            title={`Question ${i + 1}`}
                            className={`mock__dot ${i === index ? 'mock__dot--active' : ''} ${practicedKeys.has(`${type}-${i}`) ? 'mock__dot--done' : ''}`}
                            onClick={() => selectQuestion(type, i)}
                        >{i + 1}</button>
                    ))}
                </div>
            </div>

            {/* the question */}
            <div className='mock__question'>
                <div className='mock__question-top'>
                    <span className='q-card__index'>Q{index + 1}</span>
                    <span className='mock__timer' title='Answer time'>⏱ {formatTime(seconds)}</span>
                </div>
                <p>{question.question}</p>
                <div className='mock__question-actions'>
                    {window.speechSynthesis && (
                        <button className='btn btn--ghost btn--small' onClick={speak}>🔊 Read aloud</button>
                    )}
                    <button className='btn btn--ghost btn--small' onClick={() => setShowModel(s => !s)}>
                        {showModel ? 'Hide' : 'Show'} model answer
                    </button>
                </div>
                {showModel && (
                    <div className='mock__model'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{question.intention}</p>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{question.answer}</p>
                    </div>
                )}
            </div>

            {/* answer box */}
            <div className='mock__answer'>
                <textarea
                    value={answer}
                    onChange={(e) => { setAnswer(e.target.value); if (!timerOn && e.target.value) setTimerOn(true) }}
                    placeholder={type === "behavioral"
                        ? "Answer like you would in the interview. Tip: use STAR – Situation, Task, Action, Result."
                        : "Type your answer here, or use the microphone to speak it..."}
                    maxLength={5000}
                    disabled={submitting}
                />
                <div className='mock__answer-bar'>
                    <div className='mock__answer-left'>
                        {SpeechRecognition ? (
                            <button
                                className={`btn btn--small ${listening ? 'btn--danger' : 'btn--ghost'}`}
                                onClick={listening ? stopListening : startListening}
                                disabled={submitting}
                            >
                                {listening ? <><span className='rec-dot' /> Stop recording</> : '🎙 Speak answer'}
                            </button>
                        ) : (
                            <span className='mock__hint'>Voice input works in Chrome/Edge</span>
                        )}
                        <span className='mock__hint'>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                    <button className='btn btn--primary' onClick={submit} disabled={submitting || !answer.trim()}>
                        {submitting ? <><span className='spinner' /> Evaluating...</> : 'Submit answer'}
                    </button>
                </div>
            </div>

            {/* latest feedback */}
            {latest && (
                <div className='feedback' ref={feedbackRef}>
                    <div className='feedback__head'>
                        <div className={`feedback__score ${scoreClass(latest.score)}`}>
                            <strong>{latest.score}</strong><span>/10</span>
                        </div>
                        <div>
                            <h3>AI Feedback</h3>
                            <p>{latest.feedback}</p>
                        </div>
                    </div>
                    <div className='feedback__grid'>
                        <div>
                            <span className='feedback__label feedback__label--good'>What went well</span>
                            <ul>{(latest.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div>
                            <span className='feedback__label feedback__label--improve'>How to improve</span>
                            <ul>{(latest.improvements || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                    </div>
                    {latest.improvedAnswer && (
                        <details className='feedback__better'>
                            <summary>See a stronger version of your answer</summary>
                            <p>{latest.improvedAnswer}</p>
                        </details>
                    )}
                    <details className='feedback__yours'>
                        <summary>Your answer</summary>
                        <p>{latest.answer}</p>
                    </details>
                </div>
            )}

            {/* history */}
            {attempts.length > 1 && (
                <div className='attempts'>
                    <p className='attempts__label'>Previous attempts</p>
                    {attempts.slice(1).map((a, i) => (
                        <div key={a._id || i} className='attempts__row'>
                            <span className={`attempts__score ${scoreClass(a.score)}`}>{a.score}/10</span>
                            <span className='attempts__text'>{a.answer}</span>
                            {a.createdAt && <span className='attempts__date'>{new Date(a.createdAt).toLocaleDateString()}</span>}
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

export default MockInterview
