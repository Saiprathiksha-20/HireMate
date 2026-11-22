import { Link } from "react-router"
import "./notfound.scss"

const NotFound = () => (
    <main className='not-found'>
        <span className='not-found__code'>404</span>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or was moved.</p>
        <Link to="/" className='btn btn--primary'>Go to HireMate</Link>
    </main>
)

export default NotFound
