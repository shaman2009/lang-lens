"use client";

import type { HumanMessage } from "@langchain/core/messages";
import { useStream } from "@langchain/langgraph-sdk/react";
import { redirect, useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { InputBox } from "@/components/input-box";
import { Messages } from "@/components/messages";
import {
  WorkspaceContainer,
  WorkspaceContent,
  WorkspaceFooter,
  WorkspaceHeader,
} from "@/components/workspace";
import { apiClient, useAssistants } from "@/lib/api";
import { type MessageThreadValues } from "@/lib/thread";
import { cn } from "@/lib/utils";

export default function ThreadPage() {
  const searchParams = useSearchParams();
  const assistantId = searchParams.get("assistantId");
  const { data: assistants } = useAssistants();
  const DEFAULT_ASSISTANT_ID = useMemo(() => {
    return assistants && assistants.length > 0 ? assistants[0]!.graph_id : null;
  }, [assistants]);

  const { threadId } = useParams<{ threadId: string }>();
  const isNewThread = useMemo(() => threadId === "new", [threadId]);
  const { messages, isLoading, isThreadLoading, submit } =
    useStream<MessageThreadValues>({
      client: apiClient,
      threadId: isNewThread ? undefined : threadId,
      assistantId: assistantId!,
    });
  useEffect(() => {
    if (
      typeof localStorage === "object" &&
      assistants &&
      isNewThread &&
      !assistantId
    ) {
      if (assistants.length > 0) {
        const lastAssistantId = localStorage.getItem(
          "lang-lens/default_assistant_id",
        );
        if (lastAssistantId) {
          const assistant = assistants.find(
            (a) =>
              a.graph_id === lastAssistantId ||
              a.assistant_id === lastAssistantId,
          );
          if (assistant) {
            redirect(`/workspace/threads/new?assistantId=${lastAssistantId}`);
          }
        }
        redirect(`/workspace/threads/new?assistantId=${DEFAULT_ASSISTANT_ID}`);
      } else {
        redirect("/workspace/assistants");
      }
    }
  }, [DEFAULT_ASSISTANT_ID, assistantId, assistants, isNewThread]);

  useEffect(() => {
    if (assistantId && isNewThread) {
      localStorage.setItem("lang-lens/default_assistant_id", assistantId);
    }
  }, [assistantId, isNewThread]);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      await submit({
        messages: [
          {
            type: "human",
            content: [
              {
                type: "text",
                text: message.text!,
              },
            ],
          } as HumanMessage,
        ],
      });
    },
    [submit],
  );

  return (
    <WorkspaceContainer>
      <WorkspaceHeader>{isNewThread ? `New` : threadId}</WorkspaceHeader>
      <WorkspaceContent>
        <div className="flex h-full w-full">
          <Messages messages={messages} />
        </div>
      </WorkspaceContent>
      <WorkspaceFooter>
        <InputBox
          className={cn(
            "max-w-(--container-width-md)",
            isNewThread && "-translate-y-[40vh]",
          )}
          assistantId={assistantId}
          isNewThread={isNewThread}
          onSubmit={handleSubmit}
        />
      </WorkspaceFooter>
    </WorkspaceContainer>
  );
}
