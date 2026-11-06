import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="brand">
        <img
          src="/logo.png"
          alt="IKIRERE CYACU"
          className="brand-logo"
        />
        <span>IKIRERE CYACU</span>
      </div>

      <div className="nav-links">
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/climate">Climate</a>
        <a href="/about">About</a>
      </div>
    </nav>
  );
}

export default Navbar;