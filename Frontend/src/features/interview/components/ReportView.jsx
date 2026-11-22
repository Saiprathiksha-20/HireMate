/**
 * Read-only building blocks shared by the report page, the public share page
 * and the printable version.
 */

/** Every section on one page – shown when printing / "Save as PDF" */
export const PrintableReport = ({ report }) => (
    <div className='print-report'>
        <h1>{report.title}{report.companyName ? ` – ${report.companyName}` : ''}</h1>
        <p className='print-report__meta'>
            Match score: <strong>{report.matchScore}%</strong> · Generated {new Date(report.createdAt).toLocaleDateString()} · HireMate
        </p>

        <h2>Skill Gaps</h2>
        <p>{report.skillGaps.map(g => `${g.skill} (${g.severity})`).join(' · ')}</p>

        <h2>Technical Questions</h2>
        {report.technicalQuestions.map((q, i) => (
            <div key={i} className='print-report__q'>
                <h3>Q{i + 1}. {q.question}</h3>
                <p><strong>Intention:</strong> {q.intention}</p>
                <p><strong>How to answer:</strong> {q.answer}</p>
            </div>
        ))}

        <h2>Behavioral Questions</h2>
        {report.behavioralQuestions.map((q, i) => (
            <div key={i} className='print-report__q'>
                <h3>Q{i + 1}. {q.question}</h3>
                <p><strong>Intention:</strong> {q.intention}</p>
                <p><strong>How to answer:</strong> {q.answer}</p>
            </div>
        ))}

        <h2>Preparation Road Map</h2>
        {report.preparationPlan.map(d => (
            <div key={d.day} className='print-report__q'>
                <h3>Day {d.day}: {d.focus}{d.timeframe ? ` (${d.timeframe})` : ''}</h3>
                <ul>{d.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
        ))}
    </div>
)
