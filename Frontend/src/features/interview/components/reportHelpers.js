/** Small helpers shared by the report page, share page and print view */

export const LEARNING_LINKS = (skill) => [
    { label: "Video", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} tutorial for interviews`)}` },
    { label: "Docs", url: `https://www.google.com/search?q=${encodeURIComponent(`${skill} official documentation`)}` },
    { label: "Practice", url: `https://www.google.com/search?q=${encodeURIComponent(`${skill} interview questions`)}` },
]

export const scoreColorOf = (score) =>
    score >= 80 ? 'score--high' : score >= 60 ? 'score--mid' : 'score--low'

export const scoreTextOf = (score) =>
    score >= 80 ? 'Strong match for this role' :
        score >= 60 ? 'Good match, a few gaps to cover' : 'Needs preparation for this role'
