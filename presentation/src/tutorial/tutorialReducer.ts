import type { TutorialAction, TutorialState } from './types';

export const initialTutorialState: TutorialState = {
  currentIndex: 0,
  session: 0,
  status: 'idle',
};

export function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case 'START':
      return { currentIndex: 0, session: state.session + 1, status: 'running' };
    case 'ADVANCE':
      if (state.status !== 'running' || action.totalSteps < 1) return state;
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, action.totalSteps - 1),
      };
    case 'BACK':
      if (state.status !== 'running') return state;
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) };
    case 'COMPLETE':
      return { ...state, status: 'completed' };
  }
}
