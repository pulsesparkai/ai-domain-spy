import * as React from "react"
import { PanelLeft, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SidebarContext = {
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  collapsed: boolean
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  collapsedWidth?: number
}

export function SidebarProvider({ 
  children, 
  defaultOpen = true,
  collapsedWidth = 56
}: SidebarProviderProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(prev => !prev)
    } else {
      setOpen(prev => !prev)
    }
  }, [isMobile])

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
      collapsed: !open
    }),
    [open, openMobile, isMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  const { open, openMobile, setOpenMobile, isMobile } = useSidebar()

  // Mobile sidebar (slide-out drawer)
  if (isMobile) {
    return (
      <>
        {/* Mobile backdrop */}
        {openMobile && (
          <div 
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpenMobile(false)}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-300 ease-in-out",
          openMobile ? "translate-x-0" : "-translate-x-full",
          className
        )}>
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenMobile(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </>
    )
  }

  // Desktop sidebar (static)
  return (
    <div className={cn(
      "h-screen bg-background border-r transition-all duration-300 ease-in-out",
      open ? "w-64" : "w-14",
      className
    )}>
      <div className="flex flex-col h-full">
        {children}
      </div>
    </div>
  )
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn("h-8 w-8", className)}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      {children}
    </div>
  )
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 border-b", className)}>
      {children}
    </div>
  )
}

export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 border-t mt-auto", className)}>
      {children}
    </div>
  )
}

export function SidebarGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  )
}

export function SidebarGroupLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  const { collapsed } = useSidebar()
  
  return (
    <div className={cn(
      "px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide",
      collapsed && "sr-only",
      className
    )}>
      {children}
    </div>
  )
}

export function SidebarGroupContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  )
}

export function SidebarMenu({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav className={cn("space-y-1", className)}>
      {children}
    </nav>
  )
}

export function SidebarMenuItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function SidebarMenuButton({ 
  children, 
  className, 
  asChild = false,
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  asChild?: boolean
} & React.ComponentProps<"button">) {
  if (asChild) {
    return (
      <div className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
        className
      )}>
        {children}
      </div>
    )
  }
  
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}