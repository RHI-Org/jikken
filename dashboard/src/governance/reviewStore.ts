export type ReviewStatus = 'pending' | 'approved' | 'denied';

export interface GovernanceReview {
  simulationId: string;
  status: ReviewStatus;
  requestedAt: string;
  requestedBy: string;
  policyVersion: string;
  reason: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
}

export const REVIEWER = 'Maya Chen · Release Manager';
export const POLICY_VERSION = 'targeting-safety/v1.3';
export const REVIEW_REASON = 'Some users match only part of the proposed audience policy and must be reviewed before production deployment.';

const REVIEWS_KEY = 'jikken-governance-reviews-v1';

function readReviews(): Record<string, GovernanceReview> {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) as Record<string, GovernanceReview> : {};
  } catch {
    return {};
  }
}

function writeReviews(reviews: Record<string, GovernanceReview>): void {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch {
    // Review UI still works for this session if browser storage is unavailable.
  }
}

export function getGovernanceReview(simulationId: string, requestedAt: string): GovernanceReview {
  return readReviews()[simulationId] ?? {
    simulationId,
    status: 'pending',
    requestedAt,
    requestedBy: 'Jikken policy engine',
    policyVersion: POLICY_VERSION,
    reason: REVIEW_REASON,
  };
}

export function resolveGovernanceReview(
  simulationId: string,
  requestedAt: string,
  status: Exclude<ReviewStatus, 'pending'>,
  resolutionReason: string,
): GovernanceReview {
  const reviews = readReviews();
  const review: GovernanceReview = {
    ...getGovernanceReview(simulationId, requestedAt),
    status,
    resolvedAt: new Date().toISOString(),
    resolvedBy: REVIEWER,
    resolutionReason: resolutionReason.trim(),
  };
  reviews[simulationId] = review;
  writeReviews(reviews);
  return review;
}
