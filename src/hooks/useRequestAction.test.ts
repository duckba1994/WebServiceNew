import { act, renderHook } from '@testing-library/react';
import { useRequestAction } from './useRequestAction';
import { postRequestAction } from '../api/requests';
import { ApiError } from '../api/client';
import { RequestAction, RequestActionResult, RequestListItem } from '../types/requestList';

jest.mock('../api/requests', () => ({ postRequestAction: jest.fn() }));
const post = postRequestAction as jest.MockedFunction<typeof postRequestAction>;
const item = { module: 'GA', docNo: 'GA/003' } as RequestListItem;
const action = { code: 'receive' } as RequestAction;
beforeEach(() => post.mockReset());

test('receive sends only the API action and retains the returned item and Thai message', async () => {
  const response = { item, message: 'รับเรื่องเรียบร้อย' } as RequestActionResult;
  post.mockResolvedValue(response);
  const { result } = renderHook(() => useRequestAction('token'));
  await act(async () => { expect(await result.current.run(item, action, '')).toBe(response); });
  expect(post).toHaveBeenCalledWith('GA', 'GA/003', { action: 'receive' }, 'token');
  expect(result.current.notice?.text).toBe('รับเรื่องเรียบร้อย');
});

test('409 is reported as stale with the server message and is never retried', async () => {
  post.mockRejectedValue(new ApiError('ใบนี้ถูกดำเนินการแล้ว', 409, 'trace'));
  const { result } = renderHook(() => useRequestAction('token'));
  await act(async () => { expect(await result.current.run(item, action, '')).toBeNull(); });
  expect(post).toHaveBeenCalledTimes(1);
  expect(result.current.notice).toEqual({ kind: 'error', text: 'ใบนี้ถูกดำเนินการแล้ว', stale: true, status: 409 });
});
