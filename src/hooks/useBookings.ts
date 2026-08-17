// โหลดรายการใบจองสินค้า (data-fetching แยกออกจาก UI)
// รับ query ค้นหา (server-side) — โหลดใหม่อัตโนมัติเมื่อ query เปลี่ยน
// คืนค่าแถวที่แม็พเป็น BookingRow แล้ว + loading/error/reload
import { useCallback, useEffect, useState } from 'react';
import { fetchBookings, BookingQuery } from '../api/booking';
import { mapBookingApi } from '../data/bookingData';
import { BookingRow } from '../types/booking';

export interface UseBookingsResult {
  bookings: BookingRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useBookings(token?: string, query: BookingQuery = {}): UseBookingsResult {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // serialize query เพื่อใช้เป็น dependency ที่เสถียร (ไม่ refetch จาก object identity ใหม่ทุก render)
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchBookings(JSON.parse(queryKey) as BookingQuery, token)
      .then((data) => {
        if (alive) setBookings(data.map(mapBookingApi));
      })
      .catch((e) => {
        if (!alive) return;
        setBookings([]);
        setError(e instanceof Error ? e.message : 'โหลดรายการใบจองไม่สำเร็จ');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, queryKey, nonce]);

  return { bookings, loading, error, reload };
}
