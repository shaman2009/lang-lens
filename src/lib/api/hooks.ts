import { useQuery } from "@tanstack/react-query";

import type { MessageThread, MessageThreadValues } from "../thread";

import { apiClient } from "./client";

export function useThreads(
  params?: Parameters<typeof apiClient.threads.search>[0],
) {
  return useQuery<MessageThread[]>({
    queryKey: ["threads", "search", params],
    queryFn: async () => {
      const response =
        await apiClient.threads.search<MessageThreadValues>(params);
      return response as MessageThread[];
    },
  });
}

export function useRecentThreads() {
  return useThreads({
    limit: 50,
    sortBy: "updated_at",
    sortOrder: "desc",
  });
}

export function useAssistants(
  params?: Parameters<typeof apiClient.assistants.search>[0],
) {
  return useQuery({
    queryKey: ["assistants"],
    queryFn: async () => {
      const response = await apiClient.assistants.search({
        limit: 50,
        ...params,
      });
      return response;
    },
  });
}
