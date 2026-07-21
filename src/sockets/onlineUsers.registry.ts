/**
 * Simple in-memory registry mapping userId -> the set of active socket ids
 * for that user (supports multiple tabs/devices per user). Deliberately
 * in-memory, not Redis-backed — fine for a single-process deployment; if
 * this ever needs to run across multiple server instances, this is the
 * one place that would need to become a shared store (e.g. a Redis set),
 * without changing anything else that calls it.
 */
class OnlineUsersRegistry {
  private socketsByUser = new Map<string, Set<string>>();

  /** Returns true if this was the user's first active connection (i.e. they just came online). */
  addConnection(userId: string, socketId: string): boolean {
    const existing = this.socketsByUser.get(userId);
    if (existing) {
      const wasOnline = existing.size > 0;
      existing.add(socketId);
      return !wasOnline;
    }
    this.socketsByUser.set(userId, new Set([socketId]));
    return true;
  }

  /** Returns true if this was the user's last active connection (i.e. they just went offline). */
  removeConnection(userId: string, socketId: string): boolean {
    const existing = this.socketsByUser.get(userId);
    if (!existing) return false;
    existing.delete(socketId);
    if (existing.size === 0) {
      this.socketsByUser.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    return (this.socketsByUser.get(userId)?.size ?? 0) > 0;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.socketsByUser.keys());
  }

  /** Test-only utility — resets all tracked presence. Not used by application code. */
  clear(): void {
    this.socketsByUser.clear();
  }
}

export const onlineUsersRegistry = new OnlineUsersRegistry();
