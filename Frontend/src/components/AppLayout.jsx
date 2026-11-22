import { Outlet } from "react-router"
import Navbar from "./Navbar"
import Protected from "../features/auth/components/Protected"

// Every logged-in page gets the navbar on top
const AppLayout = () => (
    <Protected>
        <div className='app-shell'>
            <Navbar />
            <Outlet />
        </div>
    </Protected>
)

export default AppLayout
