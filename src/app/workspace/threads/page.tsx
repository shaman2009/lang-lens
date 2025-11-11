"use client";

import { useParams } from "next/navigation";

import { ThreadList } from "@/components/thread-list";
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
        <ThreadList className="w-full max-w-(--container-width-lg)" />
      </WorkspaceContent>
    </WorkspaceContainer>
  );
}
