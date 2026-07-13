/**
 * The presentation shell — Retailor-style split screen. Left: collapsible
 * project-notes panel (Overview / Principles / Tech). Right: the live demo
 * stage (CLI / Dashboard / SDK) driven by the notes.
 *
 * Owns the cross-surface state so one intent — a scenario, a principle, the
 * ★ hand-off — commands every surface coherently.
 */
import { useCallback, useRef, useState } from 'react';
import type { ScenarioId, SimulationResult } from '@jikken/shared';
import { NotesPanel, EdgeTab, type NotesTab } from './NotesPanel';
import { Stage } from './Stage';
import type { CliInject } from './surfaces/CliSurface';
import type { Surface, Principle } from './types';
import { supabase } from '@/integrations/supabase/client';

export function Shell() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [notesTab, setNotesTab] = useState<NotesTab>('overview');
  const [surface, setSurface] = useState<Surface>('cli');
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [activePrinciple, setActivePrinciple] = useState<Principle | null>(null);
  const [cliInject, setCliInject] = useState<CliInject | null>(null);
  const [restartNonce, setRestartNonce] = useState(0);
  const nonce = useRef(0);

  const injectCli = useCallback((command: string) => {
    nonce.current += 1;
    setCliInject({ command, nonce: nonce.current });
  }, []);

  // Scenario picker: sets the seed for every surface. On the CLI tab it runs
  // the scenario immediately so the change is visible; SDK/Dashboard read it.
  const changeScenario = useCallback(
    (s: ScenarioId) => {
      setScenario(s);
      setActivePrinciple(null);
      if (surface === 'cli') injectCli(`jikken diff --scenario ${s}`);
    },
    [surface, injectCli],
  );

  // Replay the current surface. On the CLI we re-run the scenario (remounting
  // the terminal would wipe its history); on the Dashboard/SDK we bump a nonce
  // that re-keys the surface so it remounts fresh — visible feedback on every
  // surface, not just the CLI.
  const restart = useCallback(() => {
    if (!scenario) return; // no situation chosen yet — nothing to replay
    setActivePrinciple(null);
    if (surface === 'cli') injectCli(`jikken diff --scenario ${scenario}`);
    else setRestartNonce((n) => n + 1);
  }, [surface, scenario, injectCli]);

  // A principle click commands the stage: switch to its surface, drop its pin.
  const selectPrinciple = useCallback((p: Principle) => {
    setActivePrinciple(p);
    setSurface(p.surface);
  }, []);

  const changeSurface = useCallback((s: Surface) => {
    setSurface(s);
    setActivePrinciple(null);
  }, []);

  // ★ The hand-off centerpiece: run the scenario in the CLI, then auto-switch
  // to the Dashboard where the run lands in history (Realtime pulse arrives
  // once the dashboard's Supabase data layer is wired).
  const handoff = useCallback(() => {
    if (!scenario) return; // hand-off needs a chosen situation to replay
    setActivePrinciple(null);
    setSurface('cli');
    injectCli(`jikken diff --scenario ${scenario}`);
    window.setTimeout(() => setSurface('dashboard'), 1600);
  }, [scenario, injectCli]);

  // Best-effort audit persistence for CLI-tab runs (forward-compatible with
  // the Dashboard's Realtime history; silently ignored if not yet deployed).
  const onCliResult = useCallback(
    (_r: SimulationResult, sc: string | null) => {
      const scenarioId = sc ?? scenario;
      if (!scenarioId) return; // nothing chosen / no scenario to attribute the run to
      void supabase.functions
        .invoke('jikken-simulate', { body: { scenario: scenarioId, surface: 'cli' } })
        .catch(() => {});
    },
    [scenario],
  );

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden' }}>
      {panelOpen ? (
        <NotesPanel
          tab={notesTab}
          onTabChange={setNotesTab}
          onClose={() => setPanelOpen(false)}
          activePrinciple={activePrinciple?.number ?? null}
          onSelectPrinciple={selectPrinciple}
          onHandoff={handoff}
        />
      ) : (
        <EdgeTab onOpen={() => setPanelOpen(true)} />
      )}

      <Stage
        surface={surface}
        onSurfaceChange={changeSurface}
        scenario={scenario}
        onScenarioChange={changeScenario}
        onRestart={restart}
        cliInject={cliInject}
        onCliResult={onCliResult}
        activePrinciple={activePrinciple}
        restartNonce={restartNonce}
      />
    </div>
  );
}
