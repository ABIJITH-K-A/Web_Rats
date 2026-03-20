import '../style/nav.css';

function Navbar() {
    return (
        <div>
            <ul>
                <li className="nav-item"><a className="nav-link" href="index.html">Home</a></li>
                <li className="nav-item"><a className="nav-link" href="services.html">Services</a></li>
                <li className="nav-item"><a className="nav-link" href="projects.html">Projects</a></li>
                <li className="nav-item"><a className="nav-link" href="about.html">About</a></li>
                <li className="nav-item"><a className="nav-link" href="book.html">Book Service</a></li>
                <li className="nav-item"><a className="nav-link" href="help.html">Help</a></li>
                <li className="nav-item"><a className="nav-link" href="signup.html">Sign Up</a></li>
            </ul>
        </div>
    )
}
export default Navbar