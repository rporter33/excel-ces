// src/lib/feature-flags.ts
// Simple compile-time feature flags for features that exist in the schema/UI
// but are not yet production-ready. Flip to true when the feature ships.
//
// Keep this file lean — it is NOT a runtime config system.
// For runtime toggling, use a proper feature flag service (LaunchDarkly, etc.).

export const FEATURE_FLAGS = {
  /** Document generation (PDF bid sheets delivered via email) */
  DOCUMENT_GENERATION: false,

  /** Duplicate an existing estimate to a new project */
  ESTIMATE_DUPLICATION: false,

  /** Multi-company / multi-tenant mode (organizationId enforcement) */
  MULTI_COMPANY: false,

  /** Show the price history audit trail in the product catalog */
  PRICE_HISTORY_UI: false,

  /** Crew scheduling / calendar view */
  CREW_SCHEDULING: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
