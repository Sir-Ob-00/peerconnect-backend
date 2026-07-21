/**
 * Kept as a tiny service (rather than inlining logic in the controller) so
 * the pattern — controller calls service, service does the work — is
 * established from Phase 1 onward, even though this particular check is
 * simple today. Later phases (DB health, uptime, memory) extend this.
 */
export const healthService = {
  getStatus(): { message: string } {
    return { message: "Server is running" };
  },
};
