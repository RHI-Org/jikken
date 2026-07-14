import { beforeEach, describe, expect, it } from 'vitest';
import {
  getGovernanceReview,
  POLICY_VERSION,
  resolveGovernanceReview,
  REVIEWER,
} from './reviewStore';

describe('governance review store', () => {
  beforeEach(() => localStorage.clear());

  it('creates a pending policy review for an unseen simulation', () => {
    const review = getGovernanceReview('sim_pending', '2026-07-13T10:00:00Z');

    expect(review.status).toBe('pending');
    expect(review.policyVersion).toBe(POLICY_VERSION);
    expect(review.requestedBy).toBe('Jikken policy engine');
  });

  it('persists a denied resolution with actor and rationale', () => {
    resolveGovernanceReview(
      'sim_denied',
      '2026-07-13T10:00:00Z',
      'denied',
      'The evidence does not cover EU users.',
    );

    const persisted = getGovernanceReview('sim_denied', 'ignored');
    expect(persisted.status).toBe('denied');
    expect(persisted.resolvedBy).toBe(REVIEWER);
    expect(persisted.resolutionReason).toBe('The evidence does not cover EU users.');
    expect(persisted.resolvedAt).toBeTruthy();
  });
});
