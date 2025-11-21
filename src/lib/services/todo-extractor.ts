/**
 * Service for extracting todos from thread messages
 * @module services/todo-extractor
 */

import type { AIMessage, BaseMessage } from "@langchain/core/messages";

import type { QueueTodo } from "@/components/ai-elements/queue";

import { isTodoTool } from "../constants/tool-names";

/**
 * Extracts todos from a list of thread messages.
 *
 * Scans through all AI messages looking for tool calls that write todos.
 * Returns the todos from the LAST matching tool call found.
 *
 * @param messages - Array of messages from the thread
 * @returns Array of todos, or empty array if none found
 *
 * @example
 * ```typescript
 * const todos = extractTodosFromMessages(thread.messages);
 * setTodos(todos);
 * ```
 */
export function extractTodosFromMessages(
  messages: BaseMessage[],
): QueueTodo[] {
  // Filter for AI messages that have todo tool calls
  const todoCallMessages = messages.filter(
    (message) =>
      message.type === "ai" &&
      message.tool_calls?.some((toolCall) => isTodoTool(toolCall.name)),
  );

  // No todo messages found
  if (todoCallMessages.length === 0) {
    return [];
  }

  // Get the last message with todo tool calls
  const lastTodoCallMessage = todoCallMessages[
    todoCallMessages.length - 1
  ] as AIMessage;

  // Find the todo tool call in that message
  const lastTodoToolCall = lastTodoCallMessage.tool_calls?.find((toolCall) =>
    isTodoTool(toolCall.name),
  );

  // Return the todos if they exist, otherwise empty array
  return (lastTodoToolCall?.args?.todos as QueueTodo[]) ?? [];
}
