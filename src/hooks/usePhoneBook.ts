import { useCallback, useEffect, useState } from 'react';
import {
  createPhoneBookEntry,
  deletePhoneBookEntry,
  fetchPhoneBook,
  updatePhoneBookEntry,
} from '../api/phoneBook';
import { apiErrorText } from '../api/client';
import { PhoneBookEntry, PhoneBookPayload } from '../types/phoneBook';

export function usePhoneBook(token?: string) {
  const [items, setItems] = useState<PhoneBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchPhoneBook(token)
      .then((rows) => {
        if (!cancelled) setItems(Array.isArray(rows) ? rows : []);
      })
      .catch((reason) => {
        if (!cancelled) setError(apiErrorText(reason, 'โหลดสมุดโทรศัพท์ไม่สำเร็จ'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, reloadKey]);

  const mutate = useCallback(async (operation: () => Promise<void>) => {
    setPending(true);
    setError('');
    try {
      await operation();
      reload();
    } catch (reason) {
      setError(apiErrorText(reason, 'บันทึกข้อมูลสมุดโทรศัพท์ไม่สำเร็จ'));
      throw reason;
    } finally {
      setPending(false);
    }
  }, [reload]);

  const create = useCallback(
    (payload: PhoneBookPayload) => mutate(() => createPhoneBookEntry(payload, token)),
    [mutate, token]
  );
  const update = useCallback(
    (recId: number, payload: PhoneBookPayload) =>
      mutate(() => updatePhoneBookEntry(recId, payload, token)),
    [mutate, token]
  );
  const remove = useCallback(
    (recId: number) => mutate(() => deletePhoneBookEntry(recId, token)),
    [mutate, token]
  );

  return { items, loading, pending, error, create, update, remove, reload };
}
