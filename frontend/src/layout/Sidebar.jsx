import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>Payroll App</div>
    <nav style={styles.nav}>
    <SidebarLink to="/dashboard" label="Dashboard" />
    <SidebarLink to="/hcga/pegawai" label="Pegawai" />
    <SidebarLink to="/hcga/penempatan" label="Penempatan" />
    </nav>
    </aside>
  );
}

function SidebarLink({ to, label }) {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        ...styles.link,
        backgroundColor:
          isActive || hovered ? "#eff6ff" : "transparent",
        color:
          isActive || hovered ? "#2563eb" : "#374151",
        transform:
          isActive || hovered ? "translateX(4px)" : "translateX(0)",
        fontWeight: isActive ? 600 : 400,
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </NavLink>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    minWidth: "200px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    padding: "24px 16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#2563eb",
    marginBottom: "32px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  link: {
    padding: "10px 12px",
    borderRadius: "10px",
    textDecoration: "none",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.25s ease",
    display: "block",
  },
};
