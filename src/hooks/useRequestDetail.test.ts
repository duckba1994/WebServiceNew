import { act, renderHook, waitFor } from '@testing-library/react';
import { useRequestDetail } from './useRequestDetail';
import { fetchRequestDetail } from '../api/requests';
import { RequestDetailResponse, RequestListItem } from '../types/requestList';

jest.mock('../api/requests', () => ({ fetchRequestDetail: jest.fn() }));
const fetchDetail = fetchRequestDetail as jest.MockedFunction<typeof fetchRequestDetail>;

test('a late detail GET cannot overwrite the newer item returned by saving', async () => {
  let resolveGet!: (value: RequestDetailResponse) => void;
  fetchDetail.mockReturnValue(new Promise((resolve) => { resolveGet = resolve; }));
  const { result } = renderHook(() => useRequestDetail('GA', 'GA-003', 'token'));
  await waitFor(() => expect(result.current.loading).toBe(true));
  const saved = { module: 'GA', docNo: 'GA-003', remark: 'new saved value' } as RequestListItem;
  act(() => result.current.applyItem(saved));
  await act(async () => { resolveGet({ item: { ...saved, remark: 'old value' }, logs: [], workflow: null, attachments: [] }); });
  expect(result.current.detail?.item).toBe(saved);
  expect(result.current.loading).toBe(false);
});
