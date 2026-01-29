import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import { getPeran, isLoggedIn } from "./lib/auth";

import Login from "./pages/auth/Login";
import HcgaPegawai from "./pages/hcga/Pegawai";
import PageContainer from "./components/PageContainer";
import PenempatanPage from "./pages/hcga/Penempatan";


function Dashboard() {
  return (
    <PageContainer title="Dashboard">
      <p>Ini konten utama.</p>
    </PageContainer>
  );
}

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

            {/* FAT (dummy dulu) */}
            <Route element={<ProtectedRoute allow={["FAT"]} />}>
              <Route
                path="/fat/dashboard"
                element={
                  <PageContainer title="FAT Dashboard">
                    <p>Coming soon</p>
                  </PageContainer>
                }
              />
            </Route>

            {/* DIREKTUR (dummy dulu) */}
            <Route element={<ProtectedRoute allow={["DIREKTUR"]} />}>
              <Route
                path="/direktur/dashboard"
                element={
                  <PageContainer title="Direktur Dashboard">
                    <p>Coming soon</p>
                  </PageContainer>
                }
              />
            </Route>

            {/* PEGAWAI (dummy dulu) */}
            <Route element={<ProtectedRoute allow={["PEGAWAI"]} />}>
              <Route
                path="/pegawai/dashboard"
                element={
                  <PageContainer title="Pegawai Dashboard">
                    <p>Coming soon</p>
                  </PageContainer>
                }
              />
            </Route>

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
