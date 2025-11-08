"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";

const queryClient = new QueryClient();

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <WorkspaceSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
