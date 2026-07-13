/**
 * Dashboard Component Tests
 *
 * Tests UI behavior, validation, and state management.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SimulationResult } from '@jikken/shared';
import FlagEditor from '../pages/FlagEditor';
import SimulationView from '../pages/SimulationView';

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    text: vi.fn(),
    setTextColor: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
  })),
}));

vi.mock('@/store/flagStore', () => ({
  flagStore: {
    listFlags: vi.fn().mockResolvedValue([]),
    getFlag: vi.fn().mockResolvedValue(null),
    saveFlag: vi.fn().mockResolvedValue(undefined),
    deleteFlag: vi.fn().mockResolvedValue(undefined),
    runSimulation: vi.fn().mockResolvedValue(null),
    listSimulations: vi.fn().mockResolvedValue([]),
  },
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockResult: SimulationResult = {
  flag_id: 'dark-mode',
  simulation_id: 'sim_123',
  result: 'all_clear',
  summary: { passed: 25, conflicted: 0, warned: 0, total: 25 },
  decisions: [
    {
      user_id: 'user_001',
      decision: 'receive',
      matched_rules: ['segment:early_adopter'],
      reason: 'User matches segment and rollout',
      rule_sources: ['flags/dark-mode.json:8'],
    },
  ],
  exit_code: 0,
  evaluated_at: '2026-07-13T14:23:01Z',
  total_latency_ms: 4.2,
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FlagEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates flag ID pattern', async () => {
    renderWithRouter(<FlagEditor />);

    const input = screen.getByPlaceholderText('dark-mode');
    fireEvent.change(input, { target: { value: 'Dark Mode!' } });

    await waitFor(() => {
      expect(screen.getByText(/lowercase/i)).toBeInTheDocument();
    });
  });

  it('shows suggestion for invalid flag ID', async () => {
    renderWithRouter(<FlagEditor />);

    const input = screen.getByPlaceholderText('dark-mode');
    fireEvent.change(input, { target: { value: 'DarkMode' } });

    await waitFor(() => {
      expect(screen.getByText(/Try.*dark-mode/i)).toBeInTheDocument();
    });
  });

  it('toggles advanced settings on click', () => {
    renderWithRouter(<FlagEditor />);

    const toggle = screen.getByText(/Show advanced/i);
    fireEvent.click(toggle);

    expect(screen.getByText(/Audience Rules/i)).toBeInTheDocument();
  });

  it('disables Save while the form is invalid', () => {
    renderWithRouter(<FlagEditor />);

    const saveButton = screen.getByText('Save Flag').closest('button');
    expect(saveButton).toBeDisabled();
  });
});

describe('SimulationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary counts correctly', () => {
    renderWithRouter(<SimulationView simulationResult={mockResult} />);

    expect(screen.getAllByText('25')).toHaveLength(2); // passed + total both happen to be 25
    expect(screen.getByText('Included')).toBeInTheDocument();
  });

  it('expands decision on click', () => {
    renderWithRouter(<SimulationView simulationResult={mockResult} />);

    // Initially collapsed
    expect(screen.queryByText(/Reason:/i)).not.toBeInTheDocument();

    // Click to expand
    const row = screen.getByText('user_001');
    fireEvent.click(row);

    // Now visible
    expect(screen.getByText(/Reason:/i)).toBeInTheDocument();
  });

  it('shows copy and PDF export buttons', () => {
    renderWithRouter(<SimulationView simulationResult={mockResult} />);

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('copies a plain-text report to the clipboard', async () => {
    renderWithRouter(<SimulationView simulationResult={mockResult} />);

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('FLAG SIMULATION REPORT'),
      );
    });
  });
});
