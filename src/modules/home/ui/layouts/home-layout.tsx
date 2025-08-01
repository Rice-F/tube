import { SidebarProvider } from "@/components/ui/sidebar";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export const HomeLayout = ({ children }: HomeLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="w-full">
        {children}
      </div>
    </SidebarProvider>
  )
}