import { Conversation } from '@litert-lm/core';

/**
 * Safely deletes a LiteRT-LM conversation session from VRAM/RAM, catching and logging any errors.
 */
export async function safeDeleteConversation(conversation: Conversation | null | undefined): Promise<void> {
  if (conversation) {
    try {
      await conversation.delete();
    } catch (err) {
      console.warn('Error releasing LiteRT-LM conversation session memory:', err);
    }
  }
}
