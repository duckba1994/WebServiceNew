import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAddresses } from '../api/masterData';
import { AddressProvinceApi } from '../types/masterData';

export function useAddressMaster(token?: string, enabled = true) {
  const [provinces, setProvinces] = useState<AddressProvinceApi[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    setProvinces([]);
    setError(null);
    setLoading(enabled);
    if (!enabled) return;
    fetchAddresses(token).then(data => {
      if (alive) setProvinces(data.provinces);
    }).catch((err: unknown) => {
      if (alive) setError(err instanceof Error ? err.message : 'โหลดจังหวัดและอำเภอไม่สำเร็จ');
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [token, enabled, version]);

  // PS stores Thai names in its existing City/Area string fields, not master IDs.
  const provinceOptions = useMemo(() => provinces.map(p => ({ value: p.nameTH, label: p.nameTH })), [provinces]);
  const districtsByProvince = useMemo(() => new Map(provinces.map(p => [
    p.nameTH, p.districts.map(d => ({ value: d.nameTH, label: d.nameTH })),
  ])), [provinces]);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  return { provinceOptions, districtsByProvince, loading, error, reload };
}
