const mongoose = require('mongoose');


const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [ true, "Skill is required" ]
    },
    severity: {
        type: String,
        enum: [ "low", "medium", "high" ],
        required: [ true, "Severity is required" ]
    }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [ true, "Day is required" ]
    },
    focus: {
        type: String,
        required: [ true, "Focus is required" ]
    },
    tasks: [ {
        type: String,
        required: [ true, "Task is required" ]
    } ],
    timeframe: {
        type: String
    }
}, {
    _id: false
})

// ── NEW sub-documents (all optional, so old reports keep working) ───────────

// One answer the user gave in Mock Interview mode, plus the AI's evaluation
const practiceAttemptSchema = new mongoose.Schema({
    questionType: { type: String, enum: [ "technical", "behavioral" ], required: true },
    questionIndex: { type: Number, required: true },
    answer: { type: String, required: true },
    score: { type: Number, min: 0, max: 10 },
    feedback: String,
    strengths: [ String ],
    improvements: [ String ],
    improvedAnswer: String,
}, {
    timestamps: { createdAt: true, updatedAt: false }
})

const atsAnalysisSchema = new mongoose.Schema({
    score: { type: Number, min: 0, max: 100 },
    matchedKeywords: [ String ],
    missingKeywords: [ String ],
    suggestions: [ String ],
    generatedAt: Date,
}, {
    _id: false
})

const coverLetterSchema = new mongoose.Schema({
    content: String,
    generatedAt: Date,
}, {
    _id: false
})

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [ true, "Job description is required" ]
    },
    resume: {
        type: String,
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    technicalQuestions: [ technicalQuestionSchema ],
    behavioralQuestions: [ behavioralQuestionSchema ],
    skillGaps: [ skillGapSchema ],
    preparationPlan: [ preparationPlanSchema ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    title: {
        type: String,
        required: [ true, "Job title is required" ]
    },

    // ── NEW fields ──
    companyName: {
        type: String,
        trim: true,
    },
    // roadmap tasks the user ticked off, stored as "day-taskIndex" e.g. "1-0", "2-3"
    completedTasks: {
        type: [ String ],
        default: [],
    },
    practiceAttempts: {
        type: [ practiceAttemptSchema ],
        default: [],
    },
    atsAnalysis: atsAnalysisSchema,
    coverLetter: coverLetterSchema,
    // random id used for the public read-only share link (null = not shared)
    shareId: {
        type: String,
        index: { unique: true, sparse: true },
    },
}, {
    timestamps: true
})


const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;
