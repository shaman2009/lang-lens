"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "@/components/error-boundary";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";

const queryClient = new QueryClient();

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <WorkspaceSidebar />
          <SidebarInset>
            <ErrorBoundary>{children}</ErrorBoundary>
          </SidebarInset>
        </SidebarProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
