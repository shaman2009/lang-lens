import type { MessageContentComplex } from "@langchain/core/messages";
import type { Message } from "@langchain/langgraph-sdk";

import { rehypeSplitWordsIntoSpans } from "@/lib/rehype";
import { cn } from "@/lib/utils";

import { Conversation, ConversationContent } from "./ai-elements/conversation";
import {
  Message as ConversationMessage,
  MessageContent as ConversationMessageContent,
  MessageResponse as ConversationMessageResponse,
} from "./ai-elements/message";

export function Messages({
  className,
  messages,
}: {
  className?: string;
  messages: Array<Message>;
}) {
  return (
    <Conversation
      className={cn("flex h-full w-full justify-center", className)}
    >
      <ConversationContent className="w-full max-w-(--container-width-md) place-self-center pt-20 pb-40">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </ConversationContent>
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

function MessageContent({
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
        <ConversationMessageResponse
          rehypePlugins={[rehypeSplitWordsIntoSpans]}
        >
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
    <ConversationMessageResponse rehypePlugins={[rehypeSplitWordsIntoSpans]}>
      {children as string}
    </ConversationMessageResponse>
  );
}
