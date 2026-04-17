import { useAuth } from "../../lib/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  return (
    <nav
      style={{
        background: "var(--cream-card)",
        borderBottom: "1px solid var(--cream-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 16px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "var(--text-primary)",
            textDecoration: "none",
            letterSpacing: "-0.3px",
          }}
        >
          VS-Catering
        </Link>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  fontSize: 13,
                  color:
                    location.pathname.startsWith("/admin")
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  textDecoration: "none",
                  fontWeight: location.pathname.startsWith("/admin") ? 600 : 400,
                }}
              >
                Admin
              </Link>
            )}
            <Link
              to="/my-caterings"
              style={{
                fontSize: 13,
                color:
                  location.pathname === "/my-caterings"
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                textDecoration: "none",
                fontWeight: location.pathname === "/my-caterings" ? 600 : 400,
              }}
            >
              My Caterings
            </Link>
            <Link
              to="/profile"
              style={{
                fontSize: 13,
                color:
                  location.pathname === "/profile"
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                textDecoration: "none",
                fontWeight: location.pathname === "/profile" ? 600 : 400,
              }}
            >
              {user.name.split(" ")[0]}
            </Link>
            <button
              onClick={handleLogout}
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
