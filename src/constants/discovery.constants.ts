/**
 * Tunables for search pagination and recommendation scoring. Centralized so
 * limits can be adjusted without hunting through service/validator code.
 */
export const DISCOVERY_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,

  DEFAULT_RECOMMENDATION_LIMIT: 10,
  MAX_RECOMMENDATION_LIMIT: 50,

  /**
   * How many shared-skill/interest candidates to pull from the DB before
   * ranking in-memory by exact overlap score. Bounded on purpose: large
   * enough that a real match rarely gets excluded, small enough that the
   * in-memory scoring pass (simple array intersection, not ML) stays cheap
   * regardless of total student count.
   */
  RECOMMENDATION_CANDIDATE_POOL_SIZE: 200,
} as const;
