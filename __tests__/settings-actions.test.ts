import { updateProfileInfo, updatePreferences } from '@/lib/actions/settings-actions';

// Mock the Next.js dependencies
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// We'll mock the Supabase client creation
const mockUpdate = jest.fn();
const mockEq = jest.fn().mockReturnValue({ update: mockUpdate });
const mockSingle = jest.fn();
const mockEqSelect = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEqSelect });
const mockFrom = jest.fn().mockImplementation((table) => {
  return {
    select: mockSelect,
    update: mockUpdate,
  };
});

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe('Settings Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
  });

  describe('updateProfileInfo', () => {
    it('returns unauthorized if no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const formData = new FormData();
      const result = await updateProfileInfo(formData);
      
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('updates profile info and revalidates on success', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSingle.mockResolvedValue({ data: { id: 'owner-123' } });

      const formData = new FormData();
      formData.append('full_name', 'Test Owner');
      formData.append('country_of_residence', 'USA');

      const result = await updateProfileInfo(formData);
      
      expect(mockFrom).toHaveBeenCalledWith('owners');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        full_name: 'Test Owner',
        country_of_residence: 'USA',
      }));
      expect(result).toEqual({ success: true });
    });
  });

  describe('updatePreferences', () => {
    it('updates preferences successfully', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSingle.mockResolvedValue({ data: { id: 'owner-123' } });

      const formData = new FormData();
      formData.append('preferred_language', 'fr');
      formData.append('email_notifications_enabled', 'false');

      const result = await updatePreferences(formData);
      
      expect(mockUpdate).toHaveBeenCalledWith({
        preferred_language: 'fr',
        email_notifications_enabled: false,
      });
      expect(result).toEqual({ success: true });
    });
  });
});
