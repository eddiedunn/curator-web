import { Outlet } from "react-router-dom"
import { PanelLeft } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./layout/AppSidebar"

export function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile top bar with sidebar trigger */}
        <header className="flex h-12 items-center gap-2 border-b border-border px-4 lg:hidden">
          <SidebarTrigger>
            <PanelLeft className="h-5 w-5" />
          </SidebarTrigger>
          <span className="text-sm font-semibold">Curator</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
