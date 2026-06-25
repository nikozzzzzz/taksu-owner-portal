import { POST } from '@/app/api/auth/logout/route';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

describe('POST /api/auth/logout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:3000' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('signs out and redirects to login', async () => {
    const request = new Request('http://localhost:3000/api/auth/logout');
    const response = await POST(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('http://localhost:3000/login');
  });
});
