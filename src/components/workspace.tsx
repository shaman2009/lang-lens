"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { ProgressiveBlur } from "./ui/progressive-blur";

export function WorkspaceContainer({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex h-screen w-full flex-col overflow-y-auto", className)}
      {...props}
    >
      {children}
      <ProgressiveBlur position="top" height="64px" />
      <ProgressiveBlur position="bottom" height="8%" />
    </div>
  );
}

export function WorkspaceHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  const pathname = usePathname();
  const segments = useMemo(() => {
    const parts = pathname?.split("/") || [];
    if (parts.length > 0) {
      return parts.slice(1, 3);
    }
  }, [pathname]);
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-out group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            {segments?.[0] && (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href={`/${segments[0]}`}>
                    {nameOfSegment(segments[0])}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {segments?.[1] && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  {segments.length >= 2 ? (
                    <BreadcrumbLink asChild>
                      <Link href={`/${segments[0]}/${segments[1]}`}>
                        {nameOfSegment(segments[1])}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>
                      {nameOfSegment(segments[1])}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {children && (
              <>
                <BreadcrumbSeparator />
                {children}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

export function WorkspaceContent({
  className,
  children,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "relative flex size-full flex-1 flex-col items-center px-4 pt-2",
        className,
      )}
      {...props}
    >
      <div className="container flex h-full flex-col items-center">
        {children}
        <div className="flex h-12 shrink-0">&nbsp;</div>
      </div>
    </main>
  );
}

function nameOfSegment(segment: string | undefined) {
  if (!segment) return "home";
  return segment[0]?.toUpperCase() + segment.slice(1);
}
