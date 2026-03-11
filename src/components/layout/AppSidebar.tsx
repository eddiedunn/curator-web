import { useLocation, Link } from "react-router-dom"
import {
  LayoutDashboard,
  ListVideo,
  Archive,
  Upload,
  Settings,
  Moon,
  Sun,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme-provider"
import { useHealth } from "@/hooks/useSystemStatus"
import { cn } from "@/lib/utils"

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/subscriptions", label: "Subscriptions", icon: ListVideo },
  { path: "/ingested", label: "Ingested", icon: Archive },
  { path: "/manual", label: "Manual Ingest", icon: Upload },
  { path: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { data: health } = useHealth()

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/"
    return location.pathname.startsWith(path)
  }

  const isHealthy = health?.database_connected && health?.daemon_running

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-sidebar-foreground">Curator</h1>
          <div
            className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              isHealthy === undefined
                ? "bg-gray-400"
                : isHealthy
                  ? "bg-green-500"
                  : "bg-red-500"
            )}
            title={
              isHealthy === undefined
                ? "Checking..."
                : isHealthy
                  ? "System healthy"
                  : "System degraded"
            }
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="w-full justify-start gap-2"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
