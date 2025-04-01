//src\components\layout\layout.tsx
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-supernosso-lightgray dark:bg-gray-900 transition-colors">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all",
        isMobile ? "ml-0" : "ml-16"
      )}>
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto w-full animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}