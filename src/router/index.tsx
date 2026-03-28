import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/components/layouts/AuthGuard'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import DashboardPage from '@/pages/DashboardPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import UsersPage from '@/pages/UsersPage'
import PromptsPage from '@/pages/PromptsPage'
import SupportPage from '@/pages/SupportPage'
import PlansPage from '@/pages/PlansPage'
import LoginPage from '@/pages/LoginPage'
import LegalPage from '@/pages/LegalPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'plans', element: <PlansPage /> },
          { path: 'prompts', element: <PromptsPage /> },
          { path: 'support', element: <SupportPage /> },
          { path: 'legal', element: <LegalPage /> },
        ],
      },
    ],
  },
])
