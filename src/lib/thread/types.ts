import { type BaseMessage } from "@langchain/core/messages";
import type { Thread } from "@langchain/langgraph-sdk";

export interface MessageThreadValues extends Record<string, unknown> {
  messages: BaseMessage[];
}

export interface MessageThread extends Thread<MessageThreadValues> {
  metadata: Thread["metadata"] & {
    graph_id?: string;
    assistant_id?: string;
  };
}
