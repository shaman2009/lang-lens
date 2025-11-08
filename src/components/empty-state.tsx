import {
  ConversationEmptyState,
  type ConversationEmptyStateProps,
} from "./ai-elements/conversation";

export function EmptyState(props: ConversationEmptyStateProps) {
  return <ConversationEmptyState {...props} />;
}
