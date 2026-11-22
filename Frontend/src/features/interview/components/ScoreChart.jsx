import { useState } from "react"

/**
 * Lightweight SVG line chart of match scores over time (no chart library needed).
 * points: [{ matchScore, createdAt, title }]
 */
const ScoreChart = ({ points }) => {
    const [ hover, setHover ] = useState(null)
    const data = points.filter(p => typeof p.matchScore === "number")

    if (data.length === 0) return null

    const W = 640, H = 220, padL = 36, padR = 16, padT = 16, padB = 28
    const innerW = W - padL - padR, innerH = H - padT - padB
    const x = (i) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
    const y = (v) => padT + innerH - (v / 100) * innerH

    const line = data.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.matchScore)}`).join(" ")
    const area = `${line} L${x(data.length - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z`

    return (
        <div className='score-chart'>
            <svg viewBox={`0 0 ${W} ${H}`} role='img' aria-label='Match score over time'>
                <defs>
                    <linearGradient id='scoreFill' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#ff2d78' stopOpacity='0.35' />
                        <stop offset='100%' stopColor='#ff2d78' stopOpacity='0' />
                    </linearGradient>
                </defs>
                {[ 0, 25, 50, 75, 100 ].map(v => (
                    <g key={v}>
                        <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke='#2a3348' strokeDasharray={v === 0 ? "" : "3 4"} />
                        <text x={padL - 8} y={y(v) + 4} textAnchor='end' fontSize='10' fill='#7d8590'>{v}</text>
                    </g>
                ))}
                {data.length > 1 && <path d={area} fill='url(#scoreFill)' />}
                {data.length > 1 && <path d={line} fill='none' stroke='#ff2d78' strokeWidth='2.5' strokeLinejoin='round' />}
                {data.map((p, i) => (
                    <circle
                        key={i}
                        cx={x(i)} cy={y(p.matchScore)} r={hover === i ? 6 : 4}
                        fill='#161b22' stroke='#ff2d78' strokeWidth='2'
                        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                        style={{ cursor: "pointer" }}
                    />
                ))}
                {data.length > 1 && (
                    <>
                        <text x={x(0)} y={H - 8} fontSize='10' fill='#7d8590' textAnchor='start'>{new Date(data[ 0 ].createdAt).toLocaleDateString()}</text>
                        <text x={x(data.length - 1)} y={H - 8} fontSize='10' fill='#7d8590' textAnchor='end'>{new Date(data[ data.length - 1 ].createdAt).toLocaleDateString()}</text>
                    </>
                )}
            </svg>
            {hover !== null && (
                <div className='score-chart__tip'>
                    <strong>{data[ hover ].matchScore}%</strong> · {data[ hover ].title}
                    {data[ hover ].companyName ? ` (${data[ hover ].companyName})` : ""} · {new Date(data[ hover ].createdAt).toLocaleDateString()}
                </div>
            )}
        </div>
    )
}

export default ScoreChart
