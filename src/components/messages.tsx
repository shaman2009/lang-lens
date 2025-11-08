import type { MessageContentComplex } from "@langchain/core/messages";
import type { Message } from "@langchain/langgraph-sdk";

import { cn } from "@/lib/utils";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./ai-elements/conversation";
import {
  Message as ConversationMessage,
  MessageContent as ConversationMessageContent,
  MessageResponse as ConversationMessageResponse,
} from "./ai-elements/message";
import { Skeleton } from "./ui/skeleton";

export function Messages({
  className,
  messages,
  loading,
}: {
  className?: string;
  messages: Array<Message>;
  loading?: boolean;
}) {
  return (
    <Conversation className={cn("w-full", className)}>
      <ConversationContent className="w-full pb-20">
        {loading ? (
          <ConversationSkeleton />
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

export function MessageItem({ message }: { message: Message }) {
  return (
    <ConversationMessage from={message.type === "human" ? "user" : "assistant"}>
      <ConversationMessageContent>
        {typeof message.content === "string" ? (
          <MessageContent>{message.content}</MessageContent>
        ) : (
          message.content.map((content, index) => (
            <MessageContent key={index}>{content}</MessageContent>
          ))
        )}
      </ConversationMessageContent>
    </ConversationMessage>
  );
}

export function MessageContent({
  children,
}: {
  children: string | MessageContentComplex | null | undefined;
}) {
  if (!children) {
    return null;
  }
  if (typeof children === "object") {
    if (children.type === "text") {
      return (
        <ConversationMessageResponse>
          {children.text}
        </ConversationMessageResponse>
      );
    } else if (children.type === "image_url") {
      return (
        <img
          alt={"Image"}
          className="max-w-full rounded-md"
          src={
            typeof children.image_url === "string"
              ? children.image_url
              : children.image_url.url
          }
        />
      );
    }
  }
  return (
    <ConversationMessageResponse>
      {children as string}
    </ConversationMessageResponse>
  );
}

export function ConversationSkeleton() {
  return (
    <>
      <ConversationMessage from="user">
        <MessageContent>
          <Skeleton className="h-3 w-50" />
        </MessageContent>
      </ConversationMessage>
      <ConversationMessage from="assistant">
        <MessageContent>
          <Skeleton className="h-6 w-120" />
          <Skeleton className="h-6 w-120" />
          <Skeleton className="h-6 w-100" />
          <Skeleton className="h-6 w-120" />
          <Skeleton className="h-6 w-100" />
          <Skeleton className="h-6 w-100" />
        </MessageContent>
      </ConversationMessage>
    </>
  );
}
