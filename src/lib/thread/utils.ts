import type { BaseMessage } from "@langchain/core/messages";

import type { MessageThread } from "./types";

export function pathOfThread(thread: MessageThread, includeAssistantId = true) {
  if (includeAssistantId) {
    return `/workspace/threads/${thread.thread_id}?assistantId=${thread.metadata.graph_id}`;
  }
  return `/workspace/threads/${thread.thread_id}`;
}

export function textOfMessage(message: BaseMessage) {
  if (typeof message.content === "string") {
    return message.content;
  } else if (Array.isArray(message.content)) {
    return message.content.find((part) => part.type === "text" && part.text)
      ?.text as string;
  }
  return null;
}

export function titleOfThread(thread: MessageThread) {
  if (thread.values?.messages?.length > 0) {
    const firstMessage = thread.values.messages.find((msg) =>
      textOfMessage(msg),
    );
    if (firstMessage) {
      return textOfMessage(firstMessage) ?? "Untitled";
    }
  }
  return "Untitled";
}
