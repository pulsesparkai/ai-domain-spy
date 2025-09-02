import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScanInterface from '../src/components/ScanInterface';
import { AuthContext } from '../src/contexts/AuthContext';

// Mock the hooks and dependencies
vi.mock('../src/hooks/useMockData', () => ({
  useMockData: () => ({
    devMode: false,
    mockScanResults: {
      aggregates: {
        sentimentBreakdown: {
          positive: 70,
          neutral: 20,
          negative: 10
        }
      }
    }
  })
}));

vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn()
    }
  }
}));

vi.mock('../src/lib/toast', () => ({
  showToast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock analytics
vi.mock('../src/lib/analytics', () => ({
  analytics: {
    track: vi.fn()
  }
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    api_keys: {
      perplexity: 'test-key',
      openai: 'test-key'
    }
  }
};

const mockAuthContext = {
  user: mockUser,
  session: { access_token: 'test-token' },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateProfile: vi.fn(),
  updateUserMetadata: vi.fn(),
  refreshProfile: vi.fn(),
  profile: null
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('ScanInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

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

  it('allows adding and removing queries', () => {
    render(
      <TestWrapper>
        <ScanInterface />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add Query');
    fireEvent.click(addButton);

    // Should now have multiple query inputs
    const inputs = screen.getAllByPlaceholderText('Enter search query...');
    expect(inputs).toHaveLength(2);
  });

  it('validates required fields before scanning', async () => {
    render(
      <TestWrapper>
        <ScanInterface />
      </TestWrapper>
    );

    const scanButton = screen.getByText('Start Scan');
    fireEvent.click(scanButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Start Scan')).toBeInTheDocument();
    });
  });

  it('handles successful scan submission', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        results: [
          {
            query: 'test query',
            sentiment: { sentiment: 'positive' },
            citations: ['https://example.com'],
            visibilityScore: 85
          }
        ],
        aggregates: {
          sentimentBreakdown: {
            positive: 1,
            neutral: 0,
            negative: 0
          }
        }
      })
    });

    render(
      <TestWrapper>
        <ScanInterface />
      </TestWrapper>
    );

    // Fill in required fields
    const queryInput = screen.getByPlaceholderText('Enter search query...');
    fireEvent.change(queryInput, { target: { value: 'test query' } });

    const scanTypeSelect = screen.getByRole('combobox');
    fireEvent.click(scanTypeSelect);
    
    const brandMonitoring = screen.getByText('Brand Monitoring');
    fireEvent.click(brandMonitoring);

    const scanButton = screen.getByText('Start Scan');
    fireEvent.click(scanButton);

    // Should start scanning
    await waitFor(() => {
      expect(screen.getByText('Scanning...')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    });

    render(
      <TestWrapper>
        <ScanInterface />
      </TestWrapper>
    );

    // Fill in required fields
    const queryInput = screen.getByPlaceholderText('Enter search query...');
    fireEvent.change(queryInput, { target: { value: 'test query' } });

    const scanTypeSelect = screen.getByRole('combobox');
    fireEvent.click(scanTypeSelect);
    
    const brandMonitoring = screen.getByText('Brand Monitoring');
    fireEvent.click(brandMonitoring);

    const scanButton = screen.getByText('Start Scan');
    fireEvent.click(scanButton);

    // Should handle error
    await waitFor(() => {
      expect(screen.getByText('Start Scan')).toBeInTheDocument();
    });
  });
});