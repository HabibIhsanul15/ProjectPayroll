import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut, LayoutDashboard, Users, MapPin, DollarSign, Briefcase, Wallet, User, BarChart2, FileText } from "lucide-react";
import { clearAuth } from "../lib/auth";

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    if (confirm("Yakin ingin keluar?")) {
      clearAuth();
      navigate("/login");
    }
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>Payroll App</div>

      <nav style={styles.nav}>
        <SidebarLink to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={18} />} />

        {/* HCGA MENU */}
        <div style={styles.sectionLabel}>HCGA</div>
        <SidebarLink to="/hcga/pegawai" label="Pegawai" icon={<Users size={18} />} />
        <SidebarLink to="/hcga/penempatan" label="Penempatan" icon={<MapPin size={18} />} />

        {/* FAT MENU */}
        <div style={styles.sectionLabel}>FINANCE</div>
        <SidebarLink to="/fat/dashboard" label="Penggajian" icon={<DollarSign size={18} />} />
        <SidebarLink to="/fat/jurnal" label="Jurnal Umum" icon={<FileText size={18} />} />
        <SidebarLink to="/fat/laporan" label="Laporan" icon={<BarChart2 size={18} />} />

        {/* DIREC MENU */}
        <div style={styles.sectionLabel}>DIREKTUR</div>
        <SidebarLink to="/direktur/dashboard" label="Approval" icon={<Briefcase size={18} />} />

        {/* PEGAWAI MENU */}
        <div style={styles.sectionLabel}>PEGAWAI</div>
        <SidebarLink to="/pegawai/dashboard" label="Slip Gaji Saya" icon={<Wallet size={18} />} />
      </nav>

      <div style={styles.footer}>
        <SidebarLink to="/profile" label="Profile" icon={<User size={18} />} />
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon }) {
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
          isActive || hovered ? "#2563eb" : "#64748b",
        fontWeight: isActive ? 600 : 500,
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

const styles = {
  sidebar: {
    width: "250px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    padding: "24px 16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0
  },

  brand: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#2563eb", // blue-600
    marginBottom: "32px",
    paddingLeft: "12px",
    letterSpacing: "-0.5px"
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1
  },

  sectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: "20px",
    marginBottom: "8px",
    paddingLeft: "12px"
  },

  link: {
    padding: "10px 12px",
    borderRadius: "12px",
    textDecoration: "none",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  footer: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "16px",
    marginTop: "16px"
  },

  logoutBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "transparent",
    border: "none",
    color: "#ef4444", // red-500
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    transition: "background 0.2s"
  }
};
