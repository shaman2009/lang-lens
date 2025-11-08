"use client";

import { useParams } from "next/navigation";

import {
  WorkspaceContainer,
  WorkspaceContent,
  WorkspaceHeader,
} from "@/components/workspace";

export default function ThreadsPage() {
  const { threadId } = useParams<{ threadId: string }>();
  return (
    <WorkspaceContainer>
      <WorkspaceHeader>{threadId}</WorkspaceHeader>
      <WorkspaceContent>
        <div className="h-[2000px] w-50">Thread List</div>
      </WorkspaceContent>
    </WorkspaceContainer>
  );
}
