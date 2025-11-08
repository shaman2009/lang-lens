import {
  BotMessageSquare,
  HatGlasses,
  MessageSquarePlus,
  MessagesSquare,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { LoginStatus } from "./login-status";
import { Tooltip } from "./tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <HeaderBar />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavRecents />
      </SidebarContent>
      <SidebarFooter>
        <LoginStatus />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavMain() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link className="text-muted-foreground" href="/threads">
              <MessageSquarePlus />
              <span>New Thread</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link className="text-muted-foreground" href="/threads">
              <MessagesSquare />
              <span>Threads</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link className="text-muted-foreground" href="/assistants">
              <BotMessageSquare />
              <span>Assistants</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavRecents() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recents</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link className="text-muted-foreground" href="/threads/1234">
              Thread about project X
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function HeaderBar() {
  const { open } = useSidebar();
  return open ? (
    <div className="flex h-8 w-full items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
      <Logo className="ml-[7px]" />
      <Tooltip content="Collapse sidebar">
        <SidebarTrigger className="text-l opacity-30 hover:opacity-100" />
      </Tooltip>
    </div>
  ) : (
    <div className="group/collapse-button flex size-8 items-center justify-center">
      <Logo className="group-hover/collapse-button:hidden" />
      <SidebarTrigger className="text-l hidden w-4 opacity-30 group-hover/collapse-button:block hover:opacity-100" />
    </div>
  );
}

function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <HatGlasses size={18} />
      <span className="text-l group-data-[collapsible=icon]:hidden">
        LangLens
      </span>
    </div>
  );
}
