import axios from "axios"

// One shared axios instance for the whole app.
// Set VITE_API_URL in Frontend/.env when you deploy; locally it falls back to localhost:3000.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})

// Pull the backend's { message } out of an axios error, with a fallback
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
    error?.response?.data?.message || fallback
