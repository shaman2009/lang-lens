/**
 * Utility functions for message processing and content extraction
 * @module lib/message/utils
 */

import type {
  BaseMessage,
  MessageContentComplex,
} from "@langchain/core/messages";
import type { AIMessage } from "@langchain/langgraph-sdk";
import type { UseStream } from "@langchain/langgraph-sdk/react";
import type { BagTemplate } from "node_modules/@langchain/langgraph-sdk/dist/react/types";

import type { MessageThreadValues } from "../thread";

/**
 * Finds the index of the previous human message before a given AI message.
 *
 * Searches backwards through the thread messages starting from the AI message
 * to locate the most recent human message that preceded it.
 *
 * @param message - The AI message to search from
 * @param thread - The thread containing the message history
 * @returns The index of the previous human message, or -1 if not found
 *
 * @example
 * ```typescript
 * const aiMessage = thread.messages[5]; // Assume this is an AI message
 * const humanIndex = findPreviousHumanMessageIndex(aiMessage, thread);
 * if (humanIndex !== -1) {
 *   const humanMessage = thread.messages[humanIndex];
 * }
 * ```
 */
export function findPreviousHumanMessageIndex(
  message: AIMessage,
  thread: UseStream<MessageThreadValues, BagTemplate>,
): number {
  const messageIndex = thread.values.messages.indexOf(message as BaseMessage);
  let previousHumanMessageIndex = -1;
  for (let i = messageIndex - 1; i >= 0; i--) {
    const msg = thread.values.messages[i]!;
    if (msg.type === "human") {
      previousHumanMessageIndex = i;
      break;
    }
  }
  return previousHumanMessageIndex;
}

/**
 * Extracts plain text from message content of various formats.
 *
 * Handles different message content types:
 * - String: Returns trimmed string
 * - Array: Recursively extracts and concatenates text parts
 * - Object: Extracts text from text-type content parts
 *
 * @param content - The message content to extract text from
 * @returns Extracted and trimmed text string
 *
 * @example
 * ```typescript
 * // String content
 * extractTextFromMessageContent("Hello") // "Hello"
 *
 * // Array content
 * extractTextFromMessageContent([
 *   { type: "text", text: "Hello" },
 *   { type: "text", text: "World" }
 * ]) // "Hello\n\nWorld"
 *
 * // Object content
 * extractTextFromMessageContent({ type: "text", text: "Hello" }) // "Hello"
 * ```
 */
export function extractTextFromMessageContent(
  content: MessageContentComplex | string,
): string {
  if (typeof content === "string") {
    return content.trim();
  } else if (Array.isArray(content)) {
    return content
      .map((part) => extractTextFromMessageContent(part))
      .filter((text) => text.trim())
      .join("\n\n")
      .trim();
  } else if (typeof content === "object" && content) {
    return content.type === "text" ? content.text.trim() : "";
  }
  return "";
}

/**
 * Extracts the complete text content from an AI message and its related messages.
 *
 * This function aggregates all AI message content from the previous human message
 * up to and including the specified AI message. This is useful for getting the
 * full context of an AI response that may span multiple message objects.
 *
 * @param message - The AI message to extract content from
 * @param thread - The thread containing the message history
 * @returns The aggregated text content from all related AI messages
 *
 * @example
 * ```typescript
 * const aiMessage = thread.messages[10]; // An AI message
 * const fullContent = extractAIMessageContent(aiMessage, thread);
 * // Returns all AI message content since the last human message
 * ```
 */
export function extractAIMessageContent(
  message: AIMessage,
  thread: UseStream<MessageThreadValues, BagTemplate>,
): string {
  const messageIndex = thread.values.messages.indexOf(message as BaseMessage);
  const previousHumanMessageIndex = findPreviousHumanMessageIndex(
    message,
    thread,
  );
  if (previousHumanMessageIndex === -1) {
    return extractTextFromMessageContent(message.content);
  }
  let content = "";
  for (let i = previousHumanMessageIndex + 1; i <= messageIndex; i++) {
    const msg = thread.values.messages[i]!;
    if (msg.type === "ai") {
      const extracted = extractTextFromMessageContent(msg.content);
      if (extracted.trim()) {
        content += extracted + "\n\n";
      }
    }
  }
  return content.trim();
}
