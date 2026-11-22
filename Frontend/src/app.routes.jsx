import {createBrowserRouter} from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Profile from "./features/auth/pages/Profile";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import Dashboard from "./features/interview/pages/Dashboard";
import SharedReport from "./features/interview/pages/SharedReport";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
{
    path: "/login",
    element: <Login />
},
{
    path: "/register",
    element: <Register />
},
{
    // public read-only link, no login needed
    path: "/shared/:shareId",
    element: <SharedReport />
},
{
    // all logged-in pages share the navbar (AppLayout also does the login check)
    element: <AppLayout />,
    children: [
        { path: "/", element: <Home /> },
        { path: "/dashboard", element: <Dashboard /> },
        { path: "/profile", element: <Profile /> },
        { path: "/interview/:interviewId", element: <Interview /> },
    ]
},
{
    path: "*",
    element: <NotFound />
}
])
