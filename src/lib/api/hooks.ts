import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { MessageThread, MessageThreadValues } from "../thread";

import { apiClient, logApiError } from "./client";

export function useThreads(
  params: Parameters<typeof apiClient.threads.search>[0] = {
    limit: 50,
    sortBy: "updated_at",
    sortOrder: "desc",
  },
) {
  return useQuery<MessageThread[]>({
    queryKey: ["threads", "search", params],
    queryFn: async () => {
      try {
        const response =
          await apiClient.threads.search<MessageThreadValues>(params);
        return response as MessageThread[];
      } catch (error) {
        logApiError("useThreads", error, { params });
        throw new Error(
          "Failed to fetch threads. Please check your connection to the LangGraph server.",
        );
      }
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId }: { threadId: string }) => {
      try {
        await apiClient.threads.delete(threadId);
      } catch (error) {
        logApiError("useDeleteThread", error, { threadId });
        throw new Error(
          `Failed to delete thread ${threadId}. Please try again.`,
        );
      }
    },
    onSuccess(_, { threadId }) {
      queryClient.setQueriesData(
        {
          queryKey: ["threads", "search"],
          exact: false,
        },
        (oldData: Array<MessageThread>) => {
          return oldData.filter((t) => t.thread_id !== threadId);
        },
      );
    },
  });
}

export function useAssistants(
  params: Parameters<typeof apiClient.assistants.search>[0] = {
    limit: 50,
    sortBy: "name",
    sortOrder: "asc",
  },
) {
  return useQuery({
    queryKey: ["assistants", "search", params],
    queryFn: async () => {
      try {
        const response = await apiClient.assistants.search(params);
        return response;
      } catch (error) {
        logApiError("useAssistants", error, { params });
        throw new Error(
          "Failed to fetch assistants. Please ensure the LangGraph server is running.",
        );
      }
    },
  });
}
