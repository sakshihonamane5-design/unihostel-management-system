import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './pages/LoginPage.jsx';
import { AuthProvider } from './auth.jsx';

vi.stubGlobal(
  'fetch',
  vi.fn(async (url) => {
    if (String(url).includes('/institutions/public/')) {
      return {
        ok: true,
        json: async () => ({
          institution: {
            name: 'Sardar Patel Institute of Technology',
            shortName: 'SPIT',
            supportEmail: 'hostel@spit.ac.in',
            supportPhone: '1',
          },
        }),
      };
    }
    return { ok: false, json: async () => ({}) };
  }),
);

describe('Login page', () => {
  it('renders a welcoming university sign-in form', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /sign in to unihotel|sign in to unihostel/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/institution code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(await screen.findByText(/sardar patel institute of technology/i)).toBeInTheDocument();
  });
});
