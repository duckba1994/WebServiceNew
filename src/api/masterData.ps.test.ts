import { apiGet } from './client';
import { fetchPsActions, fetchPsWorkResults } from './masterData';

jest.mock('./client', () => ({ apiGet: jest.fn(), apiFetch: jest.fn(), ApiError: class extends Error {} }));

test('PS service comboboxes use their dedicated master endpoints', async () => {
  (apiGet as jest.Mock).mockResolvedValue([]);
  await fetchPsActions('token');
  await fetchPsWorkResults('token');
  expect(apiGet).toHaveBeenNthCalledWith(1, '/MasterData/ps/actions', 'token');
  expect(apiGet).toHaveBeenNthCalledWith(2, '/MasterData/ps/work-results', 'token');
});
