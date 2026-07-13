/**
 * CLI surface — a real xterm.js terminal running the shared engine in-browser.
 *
 * The ANSI palette is themed to the EXACT hex values in @jikken/shared/COLORS,
 * so the green a user sees here is byte-for-byte the green the Dashboard paints
 * and the hex the color-parity test asserts (success metric #1, live).
 */
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { COLORS, type SimulationResult } from '@jikken/shared';
import { runCommand, colorizeCommand, PRESET_COMMANDS } from '../cli-runtime';
import { TerminalWindow } from '../TerminalWindow';

const PROMPT = '\x1b[1m\x1b[38;5;232mjikken\x1b[0m \x1b[38;5;244m$\x1b[0m ';

export interface CliInject {
  command: string;
  nonce: number;
}

export function CliSurface({
  inject,
  onResult,
}: {
  inject: CliInject | null;
  onResult?: (r: SimulationResult, scenario: string | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const lineRef = useRef('');
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  // ── Terminal lifecycle ──
  // Deferred init: React StrictMode (dev) mounts → unmounts → remounts effects.
  // Building xterm synchronously then disposing it leaves an orphaned Viewport
  // timer that fires after dispose and throws "reading 'dimensions'". Deferring
  // creation by a tick lets StrictMode's synchronous probe-unmount cancel the
  // timer before any terminal is ever built. (StrictMode is a no-op in prod.)
  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const initTimer = setTimeout(() => {
      if (cancelled || !hostRef.current) return;
      cleanup = buildTerminal();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      cleanup?.();
    };

    function buildTerminal(): () => void {
    const host = hostRef.current!;
    const term = new Terminal({
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.35,
      cursorBlink: true,
      convertEol: false,
      theme: {
        background: '#f5f5f4', // stone-100
        foreground: '#292524', // stone-800
        cursor: '#78716c',     // stone-500
        green: COLORS.RECEIVE.hex,
        red: COLORS.EXCLUDE.hex,
        yellow: COLORS.PARTIAL.hex,
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    termRef.current = term;
    fitRef.current = fit;

    // FitAddon.fit() throws ("reading 'dimensions'") when the terminal element
    // is hidden or zero-size — which happens every time we switch away from the
    // CLI tab (it stays mounted with display:none). Only fit when visible.
    const safeFit = () => {
      if (host.offsetParent === null || host.clientWidth === 0 || host.clientHeight === 0) return;
      try {
        fit.fit();
      } catch {
        /* transient layout — ignore */
      }
    };
    safeFit();

    term.writeln('\x1b[1m\x1b[38;5;232mjikken v1.0.0\x1b[0m\x1b[38;5;244m — feature flag lifecycle tool\x1b[0m');
    term.writeln('\x1b[38;5;245mType a command, or use a chip below. `help` for options.\x1b[0m');
    term.write('\r\n' + PROMPT);

    const runLine = (line: string) => {
      const { text, result, scenario } = runCommand(line);
      term.write('\r\n');
      if (text) term.write(text);
      if (result && onResultRef.current) onResultRef.current(result, scenario);
      term.write('\r\n' + PROMPT);
      lineRef.current = '';
    };

    term.onData((data) => {
      switch (data) {
        case '\r': // Enter
          runLine(lineRef.current);
          break;
        case '': // Backspace
          if (lineRef.current.length > 0) {
            lineRef.current = lineRef.current.slice(0, -1);
            term.write('\b \b');
          }
          break;
        case '': // Ctrl-C
          term.write('^C\r\n' + PROMPT);
          lineRef.current = '';
          break;
        default:
          if (data >= ' ') {
            lineRef.current += data;
            term.write(data);
          }
      }
    });

    // expose a programmatic runner for chips / scenario picker / hand-off
    (term as unknown as { _runLine: (l: string) => void })._runLine = runLine;

    const ro = new ResizeObserver(() => safeFit());
    ro.observe(host);
    return () => {
      ro.disconnect();
      term.dispose();
      termRef.current = null;
    };
    }
  }, []);

  // ── React to injected commands (chips, scenario picker, ★ hand-off) ──
  useEffect(() => {
    if (!inject || !termRef.current) return;
    const term = termRef.current;
    // echo the command as if typed (with keyword/flag hierarchy), then run it
    term.write(colorizeCommand(inject.command));
    (term as unknown as { _runLine: (l: string) => void })._runLine(inject.command);
  }, [inject]);

  // The window floats on the stage with breathing room on every side, so it
  // reads as a real terminal app rather than a full-bleed console. Command
  // shortcuts now live in the Commands tab (left panel), not a bottom bar.
  return (
    <div style={{ height: '100%', minHeight: 0, padding: '2rem', boxSizing: 'border-box' }}>
      <TerminalWindow title="jikken — zsh" titleBarBg="#e5e5e5">
        <div
          ref={hostRef}
          onClick={() => termRef.current?.focus()}
          style={{ flex: 1, minHeight: 0, background: '#f5f5f4', padding: '0.6rem 0.4rem 0.4rem 0.6rem' }}
        />
      </TerminalWindow>
    </div>
  );
}
