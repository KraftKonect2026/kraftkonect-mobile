export type LiveConversation = {
  id: string;
  ownerId: string;
  recipientId: string;
  name: string;
  avatarUrl?: string;
  service: string;
  unread: number;
  last?: { text: string; at?: string };
};
export type LiveMessage = {
  id: string;
  text: string;
  at?: string;
  own: boolean;
  read: boolean;
  photoUrl?: string;
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The message response is unavailable.");
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number) {
  return typeof value === "string" && value.trim() && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) ? value : undefined;
}
function id(value: unknown) {
  const result = text(value, 200);
  if (!result || /\s/.test(result)) throw new Error("The message identity could not be confirmed.");
  return result;
}
function timestamp(value: unknown) {
  return typeof value === "string" && value.length <= 80 && Number.isFinite(Date.parse(value)) ? value : undefined;
}
function publicImage(value: unknown) {
  const result = text(value, 2048);
  return result && /^https?:\/\//i.test(result) ? result : undefined;
}

/** Read the existing DTO without inventing a booking, support case or verification status. */
export function ownedLiveConversations(ownerId: string, response: unknown): LiveConversation[] {
  if (!ownerId || !Array.isArray(response)) throw new Error("Your conversations could not be loaded.");
  const seen = new Set<string>();
  return response.flatMap(value => {
    const row = record(value), conversationId = id(row.id), customerId = id(row.customerId), providerId = id(row.providerId);
    // A conversation with yourself (an older version of the app allowed messaging your own profile) has nobody to talk to.
    // It is left out rather than blocking every other conversation.
    if (customerId === providerId && customerId === ownerId) return [];
    if (customerId === providerId || (ownerId !== customerId && ownerId !== providerId) || seen.has(conversationId)) throw new Error("The conversation does not match this account.");
    seen.add(conversationId);
    const other = record(row.otherParticipant), recipientId = ownerId === customerId ? providerId : customerId;
    if (other.id !== recipientId) throw new Error("The conversation participant could not be confirmed.");
    const unread = row.unreadCount;
    if (!Number.isSafeInteger(unread) || (unread as number) < 0) throw new Error("The unread count could not be confirmed.");
    const latest = text(row.lastMessage, 10000);
    return [{ id: conversationId, ownerId, recipientId, name: text(other.name, 200) ?? "Participant", avatarUrl: publicImage(other.avatar),
      service: "Service context unavailable", unread: unread as number, last: latest ? { text: latest, at: timestamp(row.lastMessageAt) } : undefined }];
  });
}

/** A deep-link recipient/name is never evidence of ownership. Resolve through the owned inbox first. */
export function ownedLiveConversation(ownerId: string, rows: LiveConversation[], conversationId: unknown) {
  const conversation = typeof conversationId === "string" && rows.find(row => row.id === conversationId && row.ownerId === ownerId);
  if (!conversation) throw new Error("This conversation is unavailable for your account. Open it from Messages.");
  return conversation;
}

export function ownedLiveMessages(ownerId: string, conversation: LiveConversation, response: unknown): LiveMessage[] {
  if (conversation.ownerId !== ownerId || !Array.isArray(response)) throw new Error("Your message history could not be loaded.");
  const seen = new Set<string>();
  return response.map(value => {
    const row = record(value), messageId = id(row.id), senderId = id(row.senderId), recipientId = id(row.recipientId);
    const own = senderId === ownerId;
    if (row.conversationId !== conversation.id || seen.has(messageId) ||
      !(own ? recipientId === conversation.recipientId : senderId === conversation.recipientId && recipientId === ownerId)) {
      throw new Error("The message does not match this owned conversation.");
    }
    seen.add(messageId);
    const body = text(row.text, 10000), photoUrl = publicImage(row.attachmentUrl);
    // A message is words, a photo, or both; never nothing.
    if (!body && !photoUrl) throw new Error("The saved message text could not be loaded.");
    return { id: messageId, text: body ?? "", at: timestamp(row.createdAt), own, read: row.read === true, ...(photoUrl ? { photoUrl } : {}) };
  });
}
