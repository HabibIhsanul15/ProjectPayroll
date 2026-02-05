import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import { getPeran, isLoggedIn } from "./lib/auth";

import Login from "./pages/auth/Login";
import HcgaPegawai from "./pages/hcga/Pegawai";
import PageContainer from "./components/PageContainer";
import PenempatanPage from "./pages/hcga/Penempatan";
import PenggajianList from "./pages/fat/PenggajianList";
import PenggajianDetail from "./pages/fat/PenggajianDetail";
import LaporanPenggajian from "./pages/fat/LaporanPenggajian";
import JurnalUmum from "./pages/fat/JurnalUmum";
import DirekturDashboard from "./pages/direktur/DirekturDashboard";
import DirekturReview from "./pages/direktur/DirekturReview";
import PegawaiDashboard from "./pages/pegawai/PegawaiDashboard";
import SlipGaji from "./pages/pegawai/SlipGaji";
import Profile from "./pages/profile/Profile";
import Dashboard from "./pages/dashboard/Dashboard";

function PenempatanDummy() {
  return (
    <PageContainer title="Penempatan">
      <p>Manajemen penempatan pegawai (next).</p>
    </PageContainer>
  );
}

function LayoutShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function HomeRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const role = getPeran();
  if (role === "HCGA") return <Navigate to="/hcga/pegawai" replace />;
  if (role === "FAT") return <Navigate to="/fat/dashboard" replace />;
  if (role === "DIREKTUR") return <Navigate to="/direktur/dashboard" replace />;
  return <Navigate to="/pegawai/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        {/* Protected (harus login) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<LayoutShell />}>
            {/* Umum */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* HCGA */}
            <Route element={<ProtectedRoute allow={["HCGA"]} />}>
              <Route path="/hcga/pegawai" element={<HcgaPegawai />} />
              <Route path="/hcga/penempatan" element={<PenempatanPage />} />
            </Route>

            {/* FAT */}
            <Route element={<ProtectedRoute allow={["FAT"]} />}>
              <Route path="/fat/dashboard" element={<PenggajianList />} />
              <Route path="/fat/penggajian/:id" element={<PenggajianDetail />} />
              <Route path="/fat/jurnal" element={<JurnalUmum />} />
              <Route path="/fat/laporan" element={<LaporanPenggajian />} />
            </Route>

            {/* DIREKTUR */}
            <Route element={<ProtectedRoute allow={["DIREKTUR"]} />}>
              <Route path="/direktur/dashboard" element={<DirekturDashboard />} />
              <Route path="/direktur/approval/:id" element={<DirekturReview />} />
            </Route>

            {/* PEGAWAI */}
            <Route element={<ProtectedRoute allow={["PEGAWAI"]} />}>
              <Route path="/pegawai/dashboard" element={<PegawaiDashboard />} />
              <Route path="/pegawai/slip/:id" element={<SlipGaji />} />
            </Route>

            {/* PROFILE - All Roles */}
            <Route path="/profile" element={<Profile />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
