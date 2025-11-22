/**
 * Tool name constants used throughout the application
 * @module constants/tool-names
 */

/**
 * Tool names that write/update the todo list
 * These tools are called by AI assistants to manage task queues
 */
export const TODO_TOOL_NAMES = ["write_todos", "todo_write"] as const;

/**
 * Type guard to check if a tool name is a todo tool
 */
export function isTodoTool(toolName: string): boolean {
  return TODO_TOOL_NAMES.includes(toolName as (typeof TODO_TOOL_NAMES)[number]);
}
