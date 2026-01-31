import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar />

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen transition-all duration-300">
                <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
