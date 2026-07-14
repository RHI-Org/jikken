/**
 * The presentation shell — Retailor-style split screen. Left: collapsible
 * project-notes panel (Overview / Principles / Tech). Right: the live demo
 * stage (CLI / Dashboard / SDK) driven by the notes.
 *
 * Owns the cross-surface state so one intent — a scenario, a principle, the
 * hand-off — commands every surface coherently.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeatureDef, FeatureId, ScenarioId, SimulationResult } from '@jikken/shared';
import { NotesPanel, type NotesTab } from './NotesPanel';
import { Stage } from './Stage';
import { setActiveCatalog } from './cli-runtime';
import { loadCatalog, BUNDLED_CATALOG } from './catalog';
import type { CliInject } from './surfaces/CliSurface';
import type { Surface, Principle } from './types';
import type { RunProvenance, RunRecord } from './run-context';
import { supabase } from '@/integrations/supabase/client';
import { TUTORIAL_EVENTS, useTutorial } from '@/tutorial';

export function Shell() {
  const tutorial = useTutorial();
  const [panelOpen, setPanelOpen] = useState(true);
  const [notesTab, setNotesTab] = useState<NotesTab>('overview');
  const [surface, setSurface] = useState<Surface>('cli');
  const [catalog, setCatalog] = useState<FeatureDef[]>(BUNDLED_CATALOG);
  const [feature, setFeature] = useState<FeatureId | null>(null);
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [lastRun, setLastRun] = useState<RunRecord | null>(null);

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
  const persistenceNonce = useRef(0);
  const tutorialCliRan = useRef(false);
  const [narrowScreen, setNarrowScreen] = useState(() => window.matchMedia('(max-width: 760px)').matches);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const update = () => setNarrowScreen(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const injectCli = useCallback((command: string) => {
    setSurface('cli');
    nonce.current += 1;
    setCliInject({ command, nonce: nonce.current });
  }, []);

  // Keep the manual walkthrough deterministic while leaving command entry to
  // the viewer. Later steps prepare their surface when Next is used.
  useEffect(() => {
    if (!tutorial.active) return;
    const step = tutorial.currentStep?.id;
    if (step === 'app-overview') {
      tutorialCliRan.current = false;
      setPanelOpen(true);
      setNotesTab('overview');
      setSurface('cli');
      setFeature('dark-mode');
      setScenario('conflict');
      setActivePrinciple(null);
    } else if (narrowScreen && step) {
      // The notes are a drawer on phones. Close it as the walkthrough hands
      // off to the stage so the highlighted target is never hidden behind it.
      setPanelOpen(false);
    }
    if (step === 'inspect-cli-result' && !tutorialCliRan.current) {
      injectCli('jikken diff --feature dark-mode --scenario conflict');
    } else if (step === 'open-dashboard' || step === 'dashboard-scenario') {
      setSurface('dashboard');
    } else if (step === 'sdk-contract') {
      setSurface('sdk');
    } else if (step === 'ci-verdict') {
      setSurface('ci');
    }
  }, [tutorial.active, tutorial.currentStep?.id, tutorial.state.session, injectCli, narrowScreen]);

  // Input selection is intentionally side-effect free: it updates the shared
  // context without changing surfaces or executing a command.
  const changeScenario = useCallback(
    (s: ScenarioId) => {
      if (!feature) return;
      setScenario(s);
      setActivePrinciple(null);
      if (s === 'conflict') tutorial.emit(TUTORIAL_EVENTS.excludeEmployeesSelected);
    },
    [feature, tutorial],
  );

  // Feature selection follows the same rule: choose now, execute explicitly.
  const changeFeature = useCallback(
    (f: FeatureId) => {
      setFeature(f);
      setActivePrinciple(null);
      if (f === 'dark-mode') tutorial.emit(TUTORIAL_EVENTS.darkModeSelected);
    },
    [tutorial],
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

  const runSelected = useCallback(() => {
    if (!feature || !scenario) return;
    setActivePrinciple(null);
    injectCli(`jikken diff --feature ${feature} --scenario ${scenario}`);
  }, [feature, injectCli, scenario]);

  // The hand-off centerpiece: run the scenario in the CLI, then auto-switch
  // to the CI gate, where the same engine run either ships the change or
  // visibly blocks the deploy — the governance layer as the demo's climax.
  const handoff = useCallback(() => {
    if (!feature || !scenario) return; // hand-off needs both inputs to replay
    setActivePrinciple(null);
    setSurface('cli');
    injectCli(`jikken diff --feature ${feature} --scenario ${scenario}`);
    window.setTimeout(() => setSurface('ci'), 1600);
  }, [feature, scenario, injectCli]);

  // Best-effort audit persistence for CLI-tab runs (forward-compatible with
  // the Dashboard's Realtime history; silently ignored if not yet deployed).
  const recordRun = useCallback((
    result: SimulationResult,
    runFeature: FeatureId,
    runScenario: ScenarioId | null,
    provenance: RunProvenance,
  ) => {
    const definition = catalog.find((candidate) => candidate.id === runFeature);
    const environment = runScenario
      ? definition?.situations[runScenario].flag.environment
      : undefined;
    setLastRun({
      environment: environment ?? 'staging',
      feature: runFeature,
      provenance,
      result,
      scenario: runScenario,
    });
  }, [catalog]);

  const onCliResult = useCallback(
    (result: SimulationResult, sc: ScenarioId | null) => {
      const scenarioId = sc;
      const resultFeature = catalog.find((candidate) => candidate.id === result.flag_id)?.id;
      const runFeature = resultFeature ?? feature;
      if (!runFeature) return;
      tutorialCliRan.current = true;
      if (resultFeature) setFeature(resultFeature);
      setScenario(sc);
      tutorial.emit(TUTORIAL_EVENTS.cliRunComplete);
      recordRun(result, runFeature, scenarioId, 'local-replay');

      // The deployed scenario shorthand currently contains the canonical
      // Dark Mode fixtures. Other catalog features remain exact local replays
      // until the remote contract accepts a feature dimension.
      if (runFeature !== 'dark-mode' || !scenarioId) return;
      const request = ++persistenceNonce.current;
      void supabase.functions
        .invoke('jikken-simulate', { body: { scenario: scenarioId, surface: 'cli' } })
        .then(({ data, error }) => {
          if (error || !data || request !== persistenceNonce.current) return;
          recordRun(data as SimulationResult, runFeature, scenarioId, 'live-persisted');
        })
        .catch(() => {});
    },
    [catalog, feature, recordRun, tutorial],
  );

  const onSurfaceResult = useCallback((
    result: SimulationResult,
    provenance: RunProvenance,
  ) => {
    if (!feature || !scenario) return;
    recordRun(result, feature, scenario, provenance);
  }, [feature, recordRun, scenario]);

  return (
    <div className="jk-shell" style={{ position: 'relative', height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden' }}>
      {panelOpen && (
        <>
          <button className="jk-notes-backdrop" type="button" aria-label="Close project notes" onClick={() => setPanelOpen(false)} />
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
          onRunSelected={runSelected}
          onStartTutorial={tutorial.start}
          />
        </>
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
        onSurfaceResult={onSurfaceResult}
        run={lastRun}
        activePrinciple={activePrinciple}
        panelOpen={panelOpen}
        onOpenPanel={() => setPanelOpen(true)}
        tutorialCompleted={tutorial.completed && !tutorial.active}
        onStartTutorial={tutorial.restart}
      />
    </div>
  );
}
