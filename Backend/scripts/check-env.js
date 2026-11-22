/**
 * Checks that everything in your .env still works.
 * Run from the Backend folder:   npm run check-env
 */
require("dotenv").config({ quiet: true })
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const { GoogleGenAI } = require("@google/genai")

const ok = (m) => console.log("✅", m)
const bad = (m) => console.log("❌", m)

async function main() {
    console.log("\nChecking HireMate .env ...\n")

    // 1. JWT secret (never expires, just needs to exist)
    try {
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing")
        jwt.verify(jwt.sign({ t: 1 }, process.env.JWT_SECRET), process.env.JWT_SECRET)
        ok("JWT_SECRET works (secrets don't expire)")
    } catch (e) { bad(e.message) }

    // 2. MongoDB
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing")
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 })
        const users = await mongoose.connection.db.collection("users").countDocuments()
        const reports = await mongoose.connection.db.collection("interviewreports").countDocuments()
        ok(`MongoDB connected  (users: ${users}, reports: ${reports})`)
        await mongoose.disconnect()
    } catch (e) {
        bad("MongoDB: " + e.message.split("\n")[0])
        console.log("   → Atlas → Network Access: add your current IP.  Free clusters pause after 60 days idle → click 'Resume'.")
    }

    // 3. Gemini
    const models = [process.env.GEMINI_MODEL || "gemini-3-flash-preview", "gemini-2.5-flash"]
    if (!process.env.GOOGLE_GENAI_API_KEY) { bad("GOOGLE_GENAI_API_KEY is missing") }
    else {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
        let worked = false
        for (const model of models) {
            try {
                const r = await ai.models.generateContent({ model, contents: "Reply with the single word OK" })
                ok(`Gemini API key works with model "${model}" (reply: ${String(r.text).trim().slice(0, 20)})`)
                worked = true
                break
            } catch (e) {
                bad(`Gemini model "${model}": ${e.status || ""} ${String(e.message).slice(0, 160)}`)
            }
        }
        if (!worked) console.log("   → Create a new key at https://aistudio.google.com/apikey and put it in .env")
    }
    console.log("")
    process.exit(0)
}
main()
