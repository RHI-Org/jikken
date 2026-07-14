import type { ReactNode } from 'react';

export type TutorialPlacement = 'top' | 'right' | 'bottom' | 'left' | 'center';
export type TutorialStatus = 'idle' | 'running' | 'completed';

export interface TutorialStep {
  /** Stable value from the target's data-tutorial attribute. */
  anchor?: string;
  /** Optional action run each time a new tutorial session enters this step. */
  prepare?: () => void | Promise<void>;
  /** Only this event advances an interaction-gated step. */
  advanceOn?: string;
  /** Show a manual forward button. Defaults to false for event-gated steps. */
  allowNext?: boolean;
  body: ReactNode;
  /** Optional command/value exposed through a copy button in the callout. */
  copyText?: string;
  id: string;
  /** Keep the surrounding product surface visible instead of dimming it. */
  dimBackground?: boolean;
  /** Discloses when a tutorial decision came from synthetic research. */
  researchNote?: string;
  /** Explains a security boundary at the moment it becomes relevant. */
  securityNote?: string;
  /** Vertical breathing room around the highlighted anchor. Defaults to 6px. */
  spotlightVerticalPadding?: number;
  /** Vertical offset applied to the spotlight. Negative values move it up. */
  spotlightOffsetY?: number;
  nextLabel?: string;
  placement?: TutorialPlacement;
  title: string;
}

export interface TutorialState {
  currentIndex: number;
  /** Increments on start/restart so step preparation runs once per session. */
  session: number;
  status: TutorialStatus;
}

export type TutorialAction =
  | { type: 'START' }
  | { type: 'ADVANCE'; totalSteps: number }
  | { type: 'BACK' }
  | { type: 'COMPLETE' };

export interface TutorialContextValue {
  active: boolean;
  back: () => void;
  completed: boolean;
  currentIndex: number;
  currentStep: TutorialStep | null;
  emit: (eventName: string) => void;
  finish: () => void;
  next: () => void;
  reducedMotion: boolean;
  restart: () => void;
  skip: () => void;
  start: () => void;
  state: TutorialState;
  status: TutorialStatus;
  totalSteps: number;
}

export interface TutorialProviderProps {
  children: ReactNode;
  onFinish?: (reason: 'finished' | 'skipped') => void;
  onStart?: () => void;
  steps: readonly TutorialStep[];
}
