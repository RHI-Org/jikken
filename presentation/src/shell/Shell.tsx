/**
 * The presentation shell — Retailor-style split screen. Left: collapsible
 * project-notes panel (Overview / Principles / Tech). Right: the live demo
 * stage (CLI / Dashboard / SDK) driven by the notes.
 *
 * Owns the cross-surface state so one intent — a scenario, a principle, the
 * ★ hand-off — commands every surface coherently.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeatureDef, FeatureId, ScenarioId, SimulationResult } from '@jikken/shared';
import { NotesPanel, type NotesTab } from './NotesPanel';
import { Stage } from './Stage';
import { setActiveCatalog } from './cli-runtime';
import { loadCatalog, BUNDLED_CATALOG } from './catalog';
import type { CliInject } from './surfaces/CliSurface';
import type { Surface, Principle } from './types';
import { supabase } from '@/integrations/supabase/client';
import { TUTORIAL_EVENTS, useTutorial } from '@/tutorial';

export function Shell() {
  const tutorial = useTutorial();
  const [panelOpen, setPanelOpen] = useState(true);
  const [notesTab, setNotesTab] = useState<NotesTab>('overview');
  const [surface, setSurface] = useState<Surface>('cli');
  const [catalog, setCatalog] = useState<FeatureDef[]>(BUNDLED_CATALOG);
  const [feature, setFeature] = useState<FeatureId>('dark-mode');
  const [scenario, setScenario] = useState<ScenarioId | null>(null);

  // Load the Feature × Situation catalog from Supabase; falls back to the
  // bundled catalog (already the initial state) if the table isn't provisioned.
  // The CLI resolver reads the same catalog so a run matches the menus exactly.
  useEffect(() => {
    let live = true;
    loadCatalog().then((c) => {
      if (!live) return;
      setCatalog(c);
      setActiveCatalog(c);
    });
    return () => {
      live = false;
    };
  }, []);
  const [activePrinciple, setActivePrinciple] = useState<Principle | null>(null);
  const [cliInject, setCliInject] = useState<CliInject | null>(null);
  const nonce = useRef(0);

  // A fresh walkthrough starts from a known state. Starting on a different
  // feature makes "Choose Dark Mode" a real change event instead of a no-op.
  useEffect(() => {
    if (!tutorial.active || tutorial.currentStep?.id !== 'welcome') return;
    setPanelOpen(true);
    setNotesTab('overview');
    setSurface('cli');
    setFeature('checkout-redesign');
    setScenario(null);
    setActivePrinciple(null);
  }, [tutorial.active, tutorial.currentStep?.id, tutorial.state.session]);

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
      if (surface === 'cli') injectCli(`jikken diff --feature ${feature} --scenario ${s}`);
      if (s === 'conflict') tutorial.emit(TUTORIAL_EVENTS.excludeEmployeesSelected);
    },
    [surface, feature, injectCli, tutorial],
  );

  // Feature picker: the second dimension. Switching feature re-runs the current
  // situation against the new feature so the CLI stays in sync with both menus.
  const changeFeature = useCallback(
    (f: FeatureId) => {
      setFeature(f);
      setActivePrinciple(null);
      if (surface === 'cli' && scenario) injectCli(`jikken diff --feature ${f} --scenario ${scenario}`);
      if (f === 'dark-mode') tutorial.emit(TUTORIAL_EVENTS.darkModeSelected);
    },
    [surface, scenario, injectCli, tutorial],
  );

  const changeNotesTab = useCallback((tab: NotesTab) => {
    setNotesTab(tab);
    if (tab === 'commands') tutorial.emit(TUTORIAL_EVENTS.commandsOpened);
  }, [tutorial]);

  // A principle click commands the stage: switch to its surface, drop its pin.
  const selectPrinciple = useCallback((p: Principle) => {
    setActivePrinciple(p);
    setSurface(p.surface);
  }, []);

  const changeSurface = useCallback((s: Surface) => {
    setSurface(s);
    setActivePrinciple(null);
    if (s === 'dashboard') tutorial.emit(TUTORIAL_EVENTS.dashboardOpened);
    if (s === 'sdk') tutorial.emit(TUTORIAL_EVENTS.sdkOpened);
    if (s === 'ci') tutorial.emit(TUTORIAL_EVENTS.ciOpened);
  }, [tutorial]);

  // Command shortcut (from the Commands tab): switch to the CLI and run it.
  const runCommandShortcut = useCallback(
    (command: string) => {
      setActivePrinciple(null);
      setSurface('cli');
      injectCli(command);
    },
    [injectCli],
  );

  // ★ The hand-off centerpiece: run the scenario in the CLI, then auto-switch
  // to the CI gate, where the same engine run either ships the change or
  // visibly blocks the deploy — the governance layer as the demo's climax.
  const handoff = useCallback(() => {
    if (!scenario) return; // hand-off needs a chosen situation to replay
    setActivePrinciple(null);
    setSurface('cli');
    injectCli(`jikken diff --feature ${feature} --scenario ${scenario}`);
    window.setTimeout(() => setSurface('ci'), 1600);
  }, [feature, scenario, injectCli]);

  // Best-effort audit persistence for CLI-tab runs (forward-compatible with
  // the Dashboard's Realtime history; silently ignored if not yet deployed).
  const onCliResult = useCallback(
    (_r: SimulationResult, sc: string | null) => {
      const scenarioId = sc ?? scenario;
      if (!scenarioId) return; // nothing chosen / no scenario to attribute the run to
      tutorial.emit(TUTORIAL_EVENTS.cliRunComplete);
      void supabase.functions
        .invoke('jikken-simulate', { body: { scenario: scenarioId, surface: 'cli' } })
        .catch(() => {});
    },
    [scenario, tutorial],
  );

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden' }}>
      {panelOpen && (
        <NotesPanel
          tab={notesTab}
          onTabChange={changeNotesTab}
          onClose={() => setPanelOpen(false)}
          activePrinciple={activePrinciple?.number ?? null}
          onSelectPrinciple={selectPrinciple}
          onHandoff={handoff}
          onRunCommand={runCommandShortcut}
          features={catalog}
          feature={feature}
          onFeatureChange={changeFeature}
          scenario={scenario}
          onScenarioChange={changeScenario}
          onStartTutorial={tutorial.start}
        />
      )}

      <Stage
        surface={surface}
        onSurfaceChange={changeSurface}
        features={catalog}
        feature={feature}
        onFeatureChange={changeFeature}
        scenario={scenario}
        onScenarioChange={changeScenario}
        cliInject={cliInject}
        onCliResult={onCliResult}
        activePrinciple={activePrinciple}
        panelOpen={panelOpen}
        onOpenPanel={() => setPanelOpen(true)}
        tutorialCompleted={tutorial.completed && !tutorial.active}
        onStartTutorial={tutorial.restart}
      />
    </div>
  );
}
