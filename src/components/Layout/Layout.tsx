import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

const Layout = () => {
  const { sidebarCollapsed, isMobileMenuOpen, toggleMobileMenu } = useUIStore((state) => ({
    sidebarCollapsed: state.sidebarCollapsed,
    isMobileMenuOpen: state.isMobileMenuOpen,
    toggleMobileMenu: state.toggleMobileMenu,
  }))

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      {/* Mobile Topbar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-sidebar-bg text-slate-800 dark:text-white z-40 flex items-center justify-between px-6 border-b border-slate-200 dark:border-border-brand shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg">
            <img 
              src="/assets/icons/logoTestgen.png" 
              alt="TestGen Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-lg tracking-tight">TestGen</span>
        </div>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 hover:bg-slate-100 dark:hover:bg-primary/20 rounded-lg transition-colors border border-slate-200 dark:border-border-brand"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <Sidebar />
      
      <main 
        className={cn(
          "flex-1 transition-all duration-300 p-4 lg:p-6 py-16 lg:py-4",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-52",
          "ml-0" // Reset margin for mobile
        )}
      >
        <div className={cn(
          "mx-auto transition-all duration-300",
          sidebarCollapsed ? "max-w-full" : "max-w-7xl"
        )}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
