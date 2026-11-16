import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import { useAuth } from './context/AuthContext'

const Beranda = lazy(() => import('./pages/Beranda'))
const TempatList = lazy(() => import('./pages/TempatList'))
const TempatDetail = lazy(() => import('./pages/TempatDetail'))
const TambahTempat = lazy(() => import('./pages/TambahTempat'))
const EditTempat = lazy(() => import('./pages/EditTempat'))
const KontribusiSaya = lazy(() => import('./pages/KontribusiSaya'))
const ModerasiAdmin = lazy(() => import('./pages/ModerasiAdmin'))
const FavoritList = lazy(() => import('./pages/FavoritList'))
const LupaPassword = lazy(() => import('./pages/LupaPassword'))
const KategoriList = lazy(() => import('./pages/KategoriList'))
const KategoriDetail = lazy(() => import('./pages/KategoriDetail'))
const Profil = lazy(() => import('./pages/Profil'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>Memuat…</span>
    </div>
  )
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <PageLoader />
  if (!user) {
    return (
      <Navigate
        to="/masuk"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Beranda />} />
            <Route path="tempat" element={<TempatList />} />
            <Route
              path="tempat/tambah"
              element={
                <ProtectedRoute>
                  <TambahTempat />
                </ProtectedRoute>
              }
            />
            <Route
              path="tempat/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTempat />
                </ProtectedRoute>
              }
            />
            <Route path="tempat/:id" element={<TempatDetail />} />
            <Route
              path="kontribusi-saya"
              element={
                <ProtectedRoute>
                  <KontribusiSaya />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/moderasi"
              element={
                <ProtectedRoute requireAdmin>
                  <ModerasiAdmin />
                </ProtectedRoute>
              }
            />
            <Route path="favorit" element={<FavoritList />} />
            <Route path="kategori" element={<KategoriList />} />
            <Route path="kategori/:slug" element={<KategoriDetail />} />
            <Route
              path="profil"
              element={
                <ProtectedRoute>
                  <Profil />
                </ProtectedRoute>
              }
            />
            <Route path="masuk" element={<Login />} />
            <Route path="daftar" element={<Register />} />
            <Route path="lupa-password" element={<LupaPassword />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
