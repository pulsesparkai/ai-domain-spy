import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import ScanInterface from '../src/components/ScanInterface';
import { AuthContext } from '../src/contexts/AuthContext';

// Setup MSW server
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock the hooks and dependencies
const mockMockData = {
  devMode: false,
  mockScanResults: {
    aggregates: {
      sentimentBreakdown: {
        positive: 70,
        neutral: 20,
        negative: 10
      },
      primaryRank: 5,
      secondaryRank: 3,
      noRank: 2,
      visibilityScore: 85
    },
    results: [
      {
        query: 'test query',
        sentiment: { sentiment: 'positive' },
        citations: ['https://example.com'],
        visibilityScore: 85
      }
    ]
  }
};

vi.mock('../src/hooks/useMockData', () => ({
  useMockData: () => mockMockData
}));

const mockSupabase = {
  auth: {
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null })
  }
};

vi.mock('../src/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

const mockToast = {
  error: vi.fn(),
  success: vi.fn()
};

vi.mock('../src/lib/toast', () => ({
  showToast: mockToast
}));

const mockAnalytics = {
  track: vi.fn()
};

vi.mock('../src/lib/analytics', () => ({
  analytics: mockAnalytics
}));

// Mock dependency hooks
vi.mock('../src/lib/dependency-hooks', () => ({
  useSupabaseReady: () => ({ isReady: true, error: null }),
  withDependencyCheck: vi.fn((deps, fn) => fn())
}));

// Mock recharts
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="pie-cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    scans_count: 5,
    subscribed: false
  }
};

const mockProfile = {
  id: 'profile-id',
  user_id: 'test-user-id',
  api_keys: {},
  encrypted_api_keys: {}
};

const createMockAuthContext = (apiKeys = { perplexity: 'test-key', openai: 'test-key' }) => ({
  user: mockUser,
  session: { access_token: 'test-token' },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateProfile: vi.fn(),
  updateUserMetadata: vi.fn(),
  refreshProfile: vi.fn(),
  profile: mockProfile,
  apiKeys
});

const TestWrapper = ({ 
  children, 
  authContextValue = createMockAuthContext() 
}: { 
  children: React.ReactNode;
  authContextValue?: any;
}) => {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('ScanInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    mockMockData.devMode = false;
  });

  describe('Basic Rendering', () => {
    it('renders scan interface correctly', () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      expect(screen.getByText('AI Visibility Scan')).toBeInTheDocument();
      expect(screen.getByText('Search Queries')).toBeInTheDocument();
      expect(screen.getByText('Scan Type')).toBeInTheDocument();
      expect(screen.getByText('Start Scan')).toBeInTheDocument();
    });

    it('renders with dev mode indicator when enabled', () => {
      mockMockData.devMode = true;
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      expect(screen.getByText('AI Visibility Scan')).toBeInTheDocument();
    });
  });

  describe('Query Management', () => {
    it('allows adding and removing queries', () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const addButton = screen.getByText('Add Query');
      fireEvent.click(addButton);

      const inputs = screen.getAllByPlaceholderText('Enter search query...');
      expect(inputs).toHaveLength(2);

      // Test removing query
      const removeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(removeButton);
      
      const inputsAfterRemove = screen.getAllByPlaceholderText('Enter search query...');
      expect(inputsAfterRemove).toHaveLength(1);
    });

    it('updates query values correctly', () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      expect(queryInput).toHaveValue('test query');
    });

    it('prevents removing the last query', () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const inputs = screen.getAllByPlaceholderText('Enter search query...');
      expect(inputs).toHaveLength(1);
      
      // Should not show remove button for single query
      const removeButtons = screen.queryAllByRole('button', { name: /trash/i });
      expect(removeButtons).toHaveLength(0);
    });
  });

  describe('Form Validation', () => {
    it('validates required fields before scanning', async () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Please fill in all required fields');
      });
    });

    it('shows validation errors for empty queries', async () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
        expect(screen.getByText('Query 1 is required')).toBeInTheDocument();
      });
    });

    it('validates scan type selection', async () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Scan type is required')).toBeInTheDocument();
      });
    });

    it('validates multiple empty queries', async () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      // Add multiple empty queries
      const addButton = screen.getByText('Add Query');
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Query 1 is required')).toBeInTheDocument();
        expect(screen.getByText('Query 2 is required')).toBeInTheDocument();
        expect(screen.getByText('Query 3 is required')).toBeInTheDocument();
      });
    });
  });

  describe('API Key Validation', () => {
    it('shows error when no API keys are provided', async () => {
      const authContext = createMockAuthContext({});
      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('API keys required. Please add Perplexity or OpenAI keys in Settings.');
      });
    });

    it('shows warning when only OpenAI key is provided', async () => {
      const authContext = createMockAuthContext({ openai: 'test-key' });
      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Perplexity API key recommended for best results. Add it in Settings.');
      });
    });

    it('proceeds with scan when Perplexity key is provided', async () => {
      const authContext = createMockAuthContext({ perplexity: 'test-key' });
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: mockMockData.mockScanResults })
      });

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Scanning...')).toBeInTheDocument();
      });
    });
  });

  describe('Scan Progress', () => {
    it('shows progress bar during scanning', async () => {
      mockMockData.devMode = true;
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Scanning...')).toBeInTheDocument();
      });
    });

    it('disables scan button during scanning', async () => {
      mockMockData.devMode = true;
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(scanButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network failures gracefully', async () => {
      const authContext = createMockAuthContext({ perplexity: 'test-key' });
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('handles API rate limiting (429)', async () => {
      const authContext = createMockAuthContext({ perplexity: 'test-key' });
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' })
      });

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Monthly scan limit reached');
      });
    });

    it('handles invalid API keys (401)', async () => {
      const authContext = createMockAuthContext({ perplexity: 'invalid-key' });
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid API key. Please check your API keys in Settings.');
      });
    });

    it('handles malformed API responses', async () => {
      const authContext = createMockAuthContext({ perplexity: 'test-key' });
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Scan failed');
      });
    });

    it('prevents scans when user is not logged in', async () => {
      const authContext = { ...createMockAuthContext(), user: null };
      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Please log in to perform scans');
      });
    });
  });

  describe('Results Display', () => {
    beforeEach(() => {
      mockMockData.devMode = true;
    });

    it('displays results after successful scan', async () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Sentiment Analysis')).toBeInTheDocument();
        expect(screen.getByText('AI Visibility Score')).toBeInTheDocument();
      });
    });

    it('renders sentiment analysis chart', async () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('displays visibility score metrics', async () => {
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Primary Mentions')).toBeInTheDocument();
        expect(screen.getByText('Secondary Mentions')).toBeInTheDocument();
        expect(screen.getByText('No Ranking')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument(); // Visibility score
      });
    });

    it('handles missing results data gracefully', async () => {
      mockMockData.mockScanResults = { aggregates: null };
      
      render(
        <TestWrapper>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Default values
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks scan_run event with correct parameters', async () => {
      const authContext = createMockAuthContext({ perplexity: 'test-key' });
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: mockMockData.mockScanResults })
      });

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockAnalytics.track).toHaveBeenCalledWith('scan_run', {
          scan_type: 'brand-monitoring',
          query_count: 1,
          user_id: 'test-user-id'
        });
      });
    });
  });

  describe('Subscription Limits', () => {
    it('prevents scans when limit is reached for non-subscribed users', async () => {
      const userWithLimit = {
        ...mockUser,
        user_metadata: { scans_count: 100, subscribed: false }
      };
      const authContext = { ...createMockAuthContext(), user: userWithLimit };

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Monthly scan limit reached (100 scans). Please upgrade your plan.');
      });
    });

    it('allows scans for subscribed users regardless of count', async () => {
      const subscribedUser = {
        ...mockUser,
        user_metadata: { scans_count: 150, subscribed: true }
      };
      const authContext = { ...createMockAuthContext(), user: subscribedUser };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ results: mockMockData.mockScanResults })
      });

      render(
        <TestWrapper authContextValue={authContext}>
          <ScanInterface />
        </TestWrapper>
      );

      const queryInput = screen.getByPlaceholderText('Enter search query...');
      fireEvent.change(queryInput, { target: { value: 'test query' } });

      const scanTypeSelect = screen.getByRole('combobox');
      fireEvent.click(scanTypeSelect);
      const brandMonitoring = screen.getByText('Brand Monitoring');
      fireEvent.click(brandMonitoring);

      const scanButton = screen.getByText('Start Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('Scanning...')).toBeInTheDocument();
      });
    });
  });
});