import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Search from './Search';

// Mock the speeches utility
vi.mock('../utils/speeches', () => ({
  searchSpeeches: vi.fn((query: string) => {
    if (query === 'audrey') {
      return [
        {
          filename: '2024-02-22-audrey-first-visit',
          title: 'Audrey First Visit',
          date: '2024-02-22',
          messages: []
        }
      ];
    }
    return [];
  })
}));

describe('Search Component', () => {
  it('renders search input', () => {
    render(<Search />);
    const searchInput = screen.getByPlaceholderText(/搜尋演講內容/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('shows results when typing', async () => {
    const user = userEvent.setup();
    render(<Search />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋演講內容/i);
    await user.type(searchInput, 'audrey');
    
    await waitFor(() => {
      expect(screen.getByText('Audrey First Visit')).toBeInTheDocument();
    });
  });

  it('shows no results message when no matches', async () => {
    const user = userEvent.setup();
    render(<Search />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋演講內容/i);
    await user.type(searchInput, 'nonexistent');
    
    await waitFor(() => {
      expect(screen.getByText(/沒有找到相關結果/i)).toBeInTheDocument();
    });
  });

  it('clears results when input is cleared', async () => {
    const user = userEvent.setup();
    render(<Search />);
    
    const searchInput = screen.getByPlaceholderText(/搜尋演講內容/i);
    await user.type(searchInput, 'audrey');
    
    await waitFor(() => {
      expect(screen.getByText('Audrey First Visit')).toBeInTheDocument();
    });
    
    await user.clear(searchInput);
    
    await waitFor(() => {
      expect(screen.queryByText('Audrey First Visit')).not.toBeInTheDocument();
    });
  });
});