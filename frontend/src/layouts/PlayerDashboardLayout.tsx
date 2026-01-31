import { Outlet } from 'react-router-dom';

export default function PlayerDashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl font-bold">e-Tartan - Player Dashboard</div>
            <div className="text-sm">Player Navigation</div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
