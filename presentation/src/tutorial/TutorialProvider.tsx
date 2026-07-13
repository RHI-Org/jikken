import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useState,
} from 'react';
import { initialTutorialState, tutorialReducer } from './tutorialReducer';
import type { TutorialContextValue, TutorialProviderProps } from './types';

export const TUTORIAL_STORAGE_KEY = 'jikken_tutorial_v1';

const TutorialContext = createContext<TutorialContextValue | null>(null);

function readCompleted(): boolean {
  try {
    const value = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    return value === 'completed' || value === 'true';
  } catch {
    return false;
  }
}

function persistCompleted(): void {
  try {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'completed');
  } catch {
    // Storage can be unavailable in private or embedded browsing contexts.
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

export function TutorialProvider({
  children,
  onFinish,
  onStart,
  steps,
}: TutorialProviderProps) {
  const [state, dispatch] = useReducer(tutorialReducer, initialTutorialState);
  const [completed, setCompleted] = useState(readCompleted);
  const autoStarted = useRef(false);
  const reducedMotion = useReducedMotion();

  const start = useCallback(() => {
    if (steps.length === 0) return;
    onStart?.();
    dispatch({ type: 'START' });
  }, [onStart, steps.length]);

  const complete = useCallback(
    (reason: 'finished' | 'skipped') => {
      persistCompleted();
      setCompleted(true);
      dispatch({ type: 'COMPLETE' });
      onFinish?.(reason);
    },
    [onFinish],
  );

  const finish = useCallback(() => complete('finished'), [complete]);
  const skip = useCallback(() => complete('skipped'), [complete]);

  const advance = useCallback(() => {
    if (state.status !== 'running') return;
    if (state.currentIndex >= steps.length - 1) {
      finish();
      return;
    }
    dispatch({ type: 'ADVANCE', totalSteps: steps.length });
  }, [finish, state.currentIndex, state.status, steps.length]);

  const back = useCallback(() => dispatch({ type: 'BACK' }), []);
  const restart = start;

  const emit = useCallback(
    (eventName: string) => {
      const current = steps[state.currentIndex];
      if (state.status === 'running' && current?.advanceOn === eventName) advance();
    },
    [advance, state.currentIndex, state.status, steps],
  );

  const currentStep =
    state.status === 'running' ? (steps[state.currentIndex] ?? null) : null;

  useEffect(() => {
    if (!currentStep?.prepare) return;
    void Promise.resolve(currentStep.prepare()).catch(() => {
      // Preparation is best-effort; the callout remains usable if demo setup fails.
    });
  }, [currentStep?.id, state.session]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    if (new URLSearchParams(window.location.search).get('tutorial') === '1') start();
  }, [start]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isFormControl = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (event.key === 'Escape') {
        event.preventDefault();
        skip();
      } else if (!isFormControl && event.key === 'ArrowRight' && steps[state.currentIndex]?.allowNext === true) {
        event.preventDefault();
        advance();
      } else if (!isFormControl && event.key === 'ArrowLeft' && state.currentIndex > 0) {
        event.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance, back, skip, state.currentIndex, state.status, steps]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      active: state.status === 'running',
      back,
      completed,
      currentIndex: state.currentIndex,
      currentStep,
      emit,
      finish,
      next: advance,
      reducedMotion,
      restart,
      skip,
      start,
      state,
      status: state.status,
      totalSteps: steps.length,
    }),
    [
      advance,
      back,
      completed,
      currentStep,
      emit,
      finish,
      reducedMotion,
      restart,
      skip,
      start,
      state,
      steps.length,
    ],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within a TutorialProvider');
  return context;
}
