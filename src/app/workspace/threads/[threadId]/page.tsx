"use client";

import type { HumanMessage } from "@langchain/core/messages";
import { useStream } from "@langchain/langgraph-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { v4 as uuid } from "uuid";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { InputBox } from "@/components/input-box";
import { Messages } from "@/components/messages";
import { Todos } from "@/components/todos";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  WorkspaceContainer,
  WorkspaceContent,
  WorkspaceFooter,
  WorkspaceHeader,
} from "@/components/workspace";
import { apiClient, useAssistants } from "@/lib/api";
import { DEFAULT_THREADS_PARAMS } from "@/lib/constants/query";
import { storage, STORAGE_KEYS } from "@/lib/constants/storage";
import { UI_TRANSFORMS } from "@/lib/constants/ui";
import { extractTodosFromMessages } from "@/lib/services/todo-extractor";
import { type MessageThreadValues } from "@/lib/thread";
import { cn } from "@/lib/utils";

export default function ThreadPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assistantId = searchParams.get("assistantId");
  const { threadId: threadIdFromPath } = useParams<{ threadId: string }>();

  // Derive threadId from URL params - no need for separate state
  const isNew = useMemo(() => threadIdFromPath === "new", [threadIdFromPath]);
  const threadId = useMemo(
    () => (threadIdFromPath !== "new" ? threadIdFromPath : uuid()),
    [threadIdFromPath],
  );
  const thread = useStream<MessageThreadValues>({
    client: apiClient,
    assistantId: assistantId!,
    threadId: !isNew ? threadId : undefined,
    reconnectOnMount: true,
    fetchStateHistory: true,
  });

  // Extract todos from thread messages using useMemo to avoid infinite loops
  const todos = useMemo(
    () => extractTodosFromMessages(thread.messages),
    [thread.messages],
  );

  useAssistantMemory(assistantId, isNew);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (isNew) {
        queryClient.setQueryData(
          ["threads", "search", DEFAULT_THREADS_PARAMS],
          (oldData: Array<unknown>) => {
            return [
              {
                thread_id: threadId,
                metadata: { assistant_id: assistantId, graph_id: assistantId },
                values: {
                  messages: [
                    {
                      type: "human",
                      content: [{ type: "text", text: message.text }],
                    },
                  ],
                },
              },
              ...oldData,
            ];
          },
        );
        router.replace(
          `/workspace/threads/${threadId}?assistantId=${assistantId}&autoFocus=true`,
        );
      }
      await thread.submit(
        {
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
        },
        {
          threadId: isNew ? threadId : undefined,
          streamSubgraphs: true,
          streamResumable: true,
        },
      );
      void queryClient.invalidateQueries({ queryKey: ["threads", "search"] });
    },
    [assistantId, isNew, queryClient, router, thread, threadId],
  );

  const handleStop = useCallback(() => {
    void thread.stop();
  }, [thread]);

  return (
    <WorkspaceContainer>
      <WorkspaceHeader>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href={`/workspace/threads?assistantId=${assistantId}`}>
              {assistantId}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="hidden md:block">
          {isNew ? "New Thread" : threadId}
        </BreadcrumbItem>
      </WorkspaceHeader>
      <WorkspaceContent>
        <div className="flex h-full w-full flex-col">
          <Todos
            className="mt-2 w-full max-w-(--container-width-md) place-self-center"
            todos={todos}
          />
          <Messages thread={thread} />
        </div>
      </WorkspaceContent>
      <WorkspaceFooter>
        <InputBox
          className={cn(isNew && `translate-y-[${UI_TRANSFORMS.INPUT_TRANSLATE_Y}]`)}
          assistantId={assistantId}
          status={thread.isLoading ? "streaming" : "ready"}
          isNew={isNew}
          autoFocus={isNew || searchParams.get("autoFocus") === "true"}
          onSubmit={handleSubmit}
          onStop={handleStop}
        />
      </WorkspaceFooter>
    </WorkspaceContainer>
  );
}

function useAssistantMemory(assistantId: string | null, isNewThread: boolean) {
  const router = useRouter();
  const { data: assistants } = useAssistants();

  // Safely get default assistant ID with optional chaining
  const DEFAULT_ASSISTANT_ID = useMemo(() => {
    return assistants?.[0]?.graph_id ?? null;
  }, [assistants]);

  useEffect(() => {
    if (!assistants || !isNewThread || assistantId) {
      return;
    }

    if (assistants.length > 0) {
      // Use safe storage wrapper instead of direct localStorage
      const lastAssistantId = storage.getItem(STORAGE_KEYS.DEFAULT_ASSISTANT_ID);
      if (lastAssistantId) {
        const assistant = assistants.find(
          (a) =>
            a.graph_id === lastAssistantId ||
            a.assistant_id === lastAssistantId,
        );
        if (assistant) {
          router.replace(
            `/workspace/threads/new?assistantId=${lastAssistantId}`,
          );
          return;
        }
      }
      router.replace(
        `/workspace/threads/new?assistantId=${DEFAULT_ASSISTANT_ID}`,
      );
      return;
    } else {
      router.replace("/workspace/assistants");
      return;
    }
  }, [DEFAULT_ASSISTANT_ID, assistantId, assistants, isNewThread, router]);

  useEffect(() => {
    if (assistantId && isNewThread) {
      // Use safe storage wrapper to persist assistant selection
      storage.setItem(STORAGE_KEYS.DEFAULT_ASSISTANT_ID, assistantId);
    }
  }, [assistantId, isNewThread]);
}
