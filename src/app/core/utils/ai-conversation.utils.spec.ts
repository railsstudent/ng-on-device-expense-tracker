import { describe, it, expect, vi } from 'vitest';
import { safeDeleteConversation } from './ai-conversation.utils';
import { Conversation } from '@litert-lm/core';

describe('ai-conversation.utils', () => {
  describe('safeDeleteConversation', () => {
    it('should do nothing and resolve if conversation is null or undefined', async () => {
      await expect(safeDeleteConversation(null)).resolves.not.toThrow();
      await expect(safeDeleteConversation(undefined)).resolves.not.toThrow();
    });

    it('should call delete on the conversation instance', async () => {
      const mockConversation = {
        delete: vi.fn().mockResolvedValue(undefined),
      } as unknown as Conversation;

      await safeDeleteConversation(mockConversation);
      expect(mockConversation.delete).toHaveBeenCalledTimes(1);
    });

    it('should catch and log warning if delete throws an error', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const error = new Error('VRAM release error');
      const mockConversation = {
        delete: vi.fn().mockRejectedValue(error),
      } as unknown as Conversation;

      await expect(safeDeleteConversation(mockConversation)).resolves.not.toThrow();
      expect(mockConversation.delete).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Error releasing LiteRT-LM conversation session memory:', error);

      consoleWarnSpy.mockRestore();
    });

    it('should properly await the asynchronous delete promise before resolving', async () => {
      let resolved = false;
      const deletePromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          resolved = true;
          resolve();
        }, 50);
      });

      const mockConversation = {
        delete: vi.fn().mockReturnValue(deletePromise),
      } as unknown as Conversation;

      const runPromise = safeDeleteConversation(mockConversation);
      expect(resolved).toBe(false);

      await runPromise;
      expect(resolved).toBe(true);
    });

    it('should support concurrent deletions of multiple conversation sessions safely', async () => {
      const deleteOrder: string[] = [];

      const createDelayedMockConversation = (id: string, delayMs: number): Conversation =>
        ({
          delete: vi.fn().mockImplementation(
            () =>
              new Promise<void>((resolve) => {
                setTimeout(() => {
                  deleteOrder.push(id);
                  resolve();
                }, delayMs);
              }),
          ),
        }) as unknown as Conversation;

      const convA = createDelayedMockConversation('A', 40);
      const convB = createDelayedMockConversation('B', 10);

      await Promise.all([safeDeleteConversation(convA), safeDeleteConversation(convB)]);

      expect(deleteOrder).toEqual(['B', 'A']);
    });
  });
});
