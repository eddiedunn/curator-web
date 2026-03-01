import { Outlet } from 'react-router-dom'
import { Header } from './layout/Header'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 text-center text-slate-600 dark:text-slate-400 text-sm">
          <div className="flex items-center justify-center space-x-4">
            <p>&copy; 2024 Curator. All rights reserved.</p>
            <span>•</span>
            <p>v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
