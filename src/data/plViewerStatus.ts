import type { SearchOption } from '../components/ui/SearchSelect';

const FIRST_PERIOD = [
  'Approved-Request', 'Receive-Request', 'Approved-Request', 'Service',
  'Received-Service', 'Close-Job', 'Cancel',
];
const SECOND_PERIOD = [
  'Approved-Request', 'Receive-Request', 'Service-Close-Job', 'Service',
  'Received-Service', 'Close-Job', 'Cancel',
];
const CURRENT_PERIOD = [
  'Approved-Request', 'Receive-Request', 'Service-Close-Job',
  'Request-Close-Job', 'Close-Job', 'Cancel',
];

export function plViewerStatusOptions(dateFrom: string, dateTo: string): SearchOption[] {
  const labels = dateTo < '2019-01-04'
    ? FIRST_PERIOD
    : dateFrom >= '2019-01-04' && dateTo <= '2021-05-08'
      ? SECOND_PERIOD
      : CURRENT_PERIOD;
  return [
    { value: '0', label: 'ทุกสถานะ' },
    ...labels.map((label, index) => ({ value: String(index + 1), label: `${index + 1} · ${label}` })),
  ];
}
