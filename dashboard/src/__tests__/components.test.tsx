/**
 * Dashboard Component Tests
 *
 * Tests UI behavior, validation, and state management.
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FlagConfig, SimulationResult } from '@jikken/shared';
import FlagEditor from '../pages/FlagEditor';
import SimulationView from '../pages/SimulationView';
import { filterFlags } from '../pages/FlagList';
import HistoryPage, { filterSimulations } from '../pages/HistoryPage';
import { flagStore } from '@/store/flagStore';

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
    subscribeSimulations: vi.fn(() => () => {}),
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

const warningResult: SimulationResult = {
  ...mockResult,
  simulation_id: 'sim_review_123',
  result: 'warning',
  summary: { passed: 1, conflicted: 0, warned: 1, total: 2 },
  exit_code: 2,
  decisions: [
    mockResult.decisions[0],
    {
      user_id: 'user_002',
      decision: 'partial',
      matched_rules: ['segment:early_adopter'],
      reason: 'User matches only one of two audience rules',
      rule_sources: ['flags/dark-mode.json:9'],
    },
  ],
};

const mockFlags: FlagConfig[] = [
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Theme controls',
    enabled: true,
    rollout_percentage: 100,
    environment: 'production',
    created_at: '2026-07-13T14:23:01Z',
    updated_at: '2026-07-13T14:23:01Z',
  },
  {
    id: 'beta-dashboard',
    name: 'Beta Dashboard',
    enabled: false,
    rollout_percentage: 0,
    environment: 'development',
    created_at: '2026-07-13T14:23:01Z',
    updated_at: '2026-07-13T14:23:01Z',
  },
];

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
    const { container } = renderWithRouter(<SimulationView simulationResult={mockResult} />);
    const summary = container.querySelector('[data-tutorial="simulation-summary"]');

    expect(summary).not.toBeNull();
    expect(within(summary as HTMLElement).getAllByText('25')).toHaveLength(2); // passed + total both happen to be 25
    expect(within(summary as HTMLElement).getByText('Included')).toBeInTheDocument();
    expect(screen.getByText('Decision mix')).toBeInTheDocument();
    expect(screen.getByText('Governance signal')).toBeInTheDocument();
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

  it('labels bundled audience provenance and its freshness', async () => {
    render(
      <MemoryRouter initialEntries={['/flags/simulate/dark-mode?scenario=warning']}>
        <Routes>
          <Route path="/flags/simulate/:id" element={<SimulationView />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Deterministic demo data')).toBeInTheDocument();
    expect(screen.getByText(/Bundled fixture users/)).toBeInTheDocument();
    expect(screen.getByText('10 users')).toBeInTheDocument();
    expect(screen.getByText('account_type, country, segment')).toBeInTheDocument();
    expect(screen.getByText(/Fixed snapshot/)).toBeInTheDocument();
  });
});

describe('dashboard search', () => {
  it('filters flags by ID, environment, and status', () => {
    expect(filterFlags(mockFlags, 'dark-mode')).toHaveLength(1);
    expect(filterFlags(mockFlags, 'development')[0]?.id).toBe('beta-dashboard');
    expect(filterFlags(mockFlags, 'inactive')[0]?.id).toBe('beta-dashboard');
  });

  it('filters history by flag and human result label', () => {
    expect(filterSimulations([mockResult], 'dark-mode')).toHaveLength(1);
    expect(filterSimulations([{ ...mockResult, result: 'warning' }], 'needs review')).toHaveLength(1);
    expect(filterSimulations([mockResult], 'missing')).toHaveLength(0);
  });
});

describe('HistoryPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('expands a simulation row to show metadata and decisions', async () => {
    vi.mocked(flagStore.listSimulations).mockResolvedValueOnce([mockResult]);
    renderWithRouter(<HistoryPage />);

    fireEvent.click(await screen.findByText('sim_123'));

    expect(screen.getByText('Exit code')).toBeInTheDocument();
    expect(screen.getByText('4.2 ms')).toBeInTheDocument();
    expect(screen.getByText('Decision details')).toBeInTheDocument();
    expect(screen.getByText('User matches segment and rollout')).toBeInTheDocument();
  });

  it('denies an unresolved production action and persists a named approval', async () => {
    vi.mocked(flagStore.listSimulations).mockResolvedValueOnce([warningResult]);
    renderWithRouter(<HistoryPage />);

    fireEvent.click(await screen.findByText('sim_review_123'));
    expect(screen.getByText('Pending review')).toBeInTheDocument();
    expect(screen.getByText('targeting-safety/v1.3')).toBeInTheDocument();
    expect(screen.getByText('Maya Chen · Release Manager')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Check production deploy access'));
    expect(screen.getByRole('alert')).toHaveTextContent('Production deployment denied');
    expect(screen.getByRole('alert')).toHaveTextContent('Recovery:');

    fireEvent.change(screen.getByLabelText('Resolution reason'), {
      target: { value: 'Country exceptions verified with the release owner.' },
    });
    fireEvent.click(screen.getByText('Approve'));

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getAllByText(/Country exceptions verified/)).toHaveLength(2);
    expect(localStorage.getItem('jikken-governance-reviews-v1')).toContain('Maya Chen');
  });
});
