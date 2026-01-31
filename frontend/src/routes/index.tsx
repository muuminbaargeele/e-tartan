import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import PlayerDashboardLayout from '../layouts/PlayerDashboardLayout';
import AdminDashboardLayout from '../layouts/AdminDashboardLayout';
import HomePage from '../pages/HomePage';
import PlayerDashboardPage from '../pages/PlayerDashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/player',
    element: <PlayerDashboardLayout />,
    children: [
      {
        index: true,
        element: <PlayerDashboardPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminDashboardLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
    ],
  },
]);
