"use client";

import { useStream } from "@langchain/langgraph-sdk/react";
import { MessageSquarePlus } from "lucide-react";
import { redirect, useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { EmptyState } from "@/components/empty-state";
import { Messages } from "@/components/messages";
import {
  WorkspaceContainer,
  WorkspaceContent,
  WorkspaceHeader,
} from "@/components/workspace";
import { apiClient, useAssistants } from "@/lib/api";
import { type MessageThreadValues } from "@/lib/thread";

export default function ThreadPage() {
  const { data: assistants } = useAssistants();
  const DEFAULT_ASSISTANT_ID = useMemo(() => {
    return assistants && assistants.length > 0 ? assistants[0]!.graph_id : null;
  }, [assistants]);

  const { threadId } = useParams<{ threadId: string }>();
  const searchParams = useSearchParams();
  const assistantId = searchParams.get("assistantId");
  const isNewThread = useMemo(() => threadId === "new", [threadId]);
  const { messages, isLoading, isThreadLoading } =
    useStream<MessageThreadValues>({
      client: apiClient,
      threadId: isNewThread ? undefined : threadId,
      assistantId: assistantId!,
    });
  if (assistants && isNewThread && !assistantId) {
    if (assistants.length > 0) {
      redirect(`/workspace/threads/new?assistantId=${DEFAULT_ASSISTANT_ID}}`);
    } else {
      redirect("/workspace/assistants");
    }
  }
  return (
    <WorkspaceContainer>
      <WorkspaceHeader>{isNewThread ? `New` : threadId}</WorkspaceHeader>
      <WorkspaceContent>
        <div className="h-full w-full max-w-(--container-width-md) px-4 pb-12">
          {messages.length === 0 ? (
            <EmptyState
              description="Messages will appear here as the conversation progresses."
              icon={<MessageSquarePlus className="size-6" />}
              title={`Start a conversation with "${assistantId}"`}
            />
          ) : (
            <Messages
              loading={isLoading || isThreadLoading}
              messages={messages}
            />
          )}
        </div>
      </WorkspaceContent>
    </WorkspaceContainer>
  );
}
