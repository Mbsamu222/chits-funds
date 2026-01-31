import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="min-h-screen text-[var(--text)]">
            <Sidebar />

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen transition-all duration-500 ease-out">
                <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
