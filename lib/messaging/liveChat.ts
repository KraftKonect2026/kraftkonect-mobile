// Sending in a conversation. The server decides who the message goes to (the other person in the conversation)
// and returns the saved message; the app only asks and shows what came back.
import { ApolloClient, gql } from "@apollo/client";
import { friendlyError } from "@/lib/bookings/liveFlow";

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($conversationId: ID!, $text: String, $attachmentUrl: String, $idempotencyKey: String!) {
    sendChatMessage(conversationId: $conversationId, text: $text, attachmentUrl: $attachmentUrl, idempotencyKey: $idempotencyKey) { id conversationId senderId recipientId text read createdAt attachmentUrl }
  }
`;
export const MARK_CONVERSATION_READ = gql`mutation MarkConversationRead($conversationId: ID!) { markConversationRead(conversationId: $conversationId) }`;

type Client = Pick<ApolloClient<unknown>, "mutate">;
const scoped = (ownerId: string) => ({ accountOwnerId: ownerId, queryDeduplication: false });

/** One tap = one key, kept until the send settles, so a retry after a dropped connection cannot send twice. */
const keys = new Map<string, string>();
const newKey = () => "msg-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);

export async function sendChat(client: Client, ownerId: string, conversationId: string, text: string, photoUrl?: string): Promise<void> {
  const body = text.trim();
  if (!body && !photoUrl) throw new Error("Write a message or add a photo.");
  if (body.length > 1000) throw new Error("Keep the message within 1,000 characters.");
  const signature = JSON.stringify([ownerId, conversationId, body, photoUrl ?? ""]);
  const key = keys.get(signature) ?? newKey();
  keys.set(signature, key);
  try {
    const result = await client.mutate({ mutation: SEND_CHAT_MESSAGE as never, variables: { conversationId, text: body || null, attachmentUrl: photoUrl && /^https:\/\//.test(photoUrl) ? photoUrl : null, idempotencyKey: key }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never);
    const sent = (result.data as { sendChatMessage?: { id?: string } } | null)?.sendChatMessage;
    if (!sent?.id) throw new Error("The server did not confirm that the message was sent.");
    keys.delete(signature);
  } catch (e) {
    // A refusal means nothing was sent, so the next try is a fresh send. A dropped connection keeps the key.
    const error = friendlyError(e);
    if (!/network|timeout|failed to fetch|offline/i.test(error.message)) keys.delete(signature);
    throw error;
  }
}

export async function markRead(client: Client, ownerId: string, conversationId: string): Promise<void> {
  try { await client.mutate({ mutation: MARK_CONVERSATION_READ as never, variables: { conversationId }, context: scoped(ownerId), fetchPolicy: "no-cache" } as never); }
  catch (e) { throw friendlyError(e); }
}
