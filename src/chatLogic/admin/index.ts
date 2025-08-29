import type { ChatFlow } from '../../types/chatFlow';

export const adminFlows: Record<string, ChatFlow> = {
  // Add admin-specific flows here when needed
};

export function resolveAdminFlow(topic?: string | null): ChatFlow | null {
  void topic;
  // Return null or default flow when admin flows are implemented
  return null;
}
