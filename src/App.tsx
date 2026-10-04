import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/login"
import SettingsPage from "./pages/settings"
import AdminLayout from "./layouts/admin-layout"
import Dashboard from "./pages/dashboard"
import Memberships from "./pages/memberships"
import GymDashboard from "./pages/gym/dashboard"
import GymPayments from "./pages/gym/payments"
import GymMembers from "./pages/gym/members"
import GymTrainers from "./pages/gym/trainers"
import GymPlans from "./pages/gym/plans"
import CarWashDashboard from "./pages/car-wash/dashboard"
import CarWashPayments from "./pages/car-wash/payments"
import CarWashServices from "./pages/car-wash/services"
import CarWashPackages from "./pages/car-wash/packages"
import CafeDashboard from "./pages/cafe/dashboard"
import CafePayments from "./pages/cafe/payments"
import CafeMenu from "./pages/cafe/menu"
import BadmintonDashboard from "./pages/badminton/dashboard"
import BadmintonPayments from "./pages/badminton/payments"
import BadmintonCourts from "./pages/badminton/courts"
import GamingDashboard from "./pages/gaming/dashboard"
import GamingPayments from "./pages/gaming/payments"
import GamingGames from "./pages/gaming/games"
import GamingSettings from "./pages/gaming/settings"
import SalonDashboard from "./pages/salon/dashboard"
import SalonPayments from "./pages/salon/payments"
import SalonServices from "./pages/salon/services"
import Staff from "./pages/staff"
import Holidays from "./pages/holidays"
import MembershipCoupons from "./pages/memberships/Coupons"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Dashboard Routes */}
      <Route element={<AdminLayout><Dashboard /></AdminLayout>} path="/main/dashboard" />
      <Route element={<AdminLayout><SettingsPage /></AdminLayout>} path="/main/settings" />
      <Route element={<AdminLayout><Staff /></AdminLayout>} path="/main/staff" />
      <Route element={<AdminLayout><Holidays /></AdminLayout>} path="/main/holidays" />
      <Route element={<AdminLayout><Memberships /></AdminLayout>} path="/main/memberships" />
      <Route element={<AdminLayout><MembershipCoupons /></AdminLayout>} path="/main/memberships/coupons" />

      <Route path="/main" element={<Navigate to="/main/dashboard" />} />


      <Route element={<AdminLayout><GymDashboard /></AdminLayout>} path="/gym/dashboard" />
      <Route element={<AdminLayout><GymPayments /></AdminLayout>} path="/gym/payments" />
      <Route element={<AdminLayout><GymMembers /></AdminLayout>} path="/gym/members" />
      <Route element={<AdminLayout><GymTrainers /></AdminLayout>} path="/gym/trainers" />
      <Route element={<AdminLayout><GymPlans /></AdminLayout>} path="/gym/plans" />

      <Route path="/gym" element={<Navigate to="/gym/dashboard" />} />

      <Route element={<AdminLayout><CarWashDashboard /></AdminLayout>} path="/car-wash/dashboard" />
      <Route element={<AdminLayout><CarWashPayments /></AdminLayout>} path="/car-wash/payments" />
      <Route element={<AdminLayout><CarWashServices /></AdminLayout>} path="/car-wash/services" />
      <Route element={<AdminLayout><CarWashPackages /></AdminLayout>} path="/car-wash/packages" />

      <Route path="/car-wash" element={<Navigate to="/car-wash/dashboard" />} />

      <Route element={<AdminLayout><CafeDashboard /></AdminLayout>} path="/cafe/dashboard" />
      <Route element={<AdminLayout><CafePayments /></AdminLayout>} path="/cafe/payments" />
      <Route element={<AdminLayout><CafeMenu /></AdminLayout>} path="/cafe/menu" />

      <Route path="/cafe" element={<Navigate to="/cafe/dashboard" />} />

      <Route element={<AdminLayout><BadmintonDashboard /></AdminLayout>} path="/badminton/dashboard" />
      <Route element={<AdminLayout><BadmintonPayments /></AdminLayout>} path="/badminton/payments" />
      <Route element={<AdminLayout><BadmintonCourts /></AdminLayout>} path="/badminton/courts" />

      <Route path="/badminton" element={<Navigate to="/badminton/dashboard" />} />

      <Route element={<AdminLayout><GamingDashboard /></AdminLayout>} path="/gaming/dashboard" />
      <Route element={<AdminLayout><GamingPayments /></AdminLayout>} path="/gaming/payments" />
      <Route element={<AdminLayout><GamingGames /></AdminLayout>} path="/gaming/games" />
      <Route element={<AdminLayout><GamingSettings /></AdminLayout>} path="/gaming/settings" />

      <Route path="/gaming" element={<Navigate to="/gaming/dashboard" />} />

      <Route element={<AdminLayout><SalonDashboard /></AdminLayout>} path="/salon/dashboard" />
      <Route element={<AdminLayout><SalonPayments /></AdminLayout>} path="/salon/payments" />
      <Route element={<AdminLayout><SalonServices /></AdminLayout>} path="/salon/services" />

      <Route path="/salon" element={<Navigate to="/salon/dashboard" />} />
    </Routes>
  )
}

export default App
