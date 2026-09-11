import React from 'react';
import { IconCheck } from '@tabler/icons-react';

type DocumentKey = 'estimate' | 'partBook' | 'photo' | 'samplePart' | 'oldPart' | 'other';

interface RowState {
  selected?: boolean;
  documents?: Partial<Record<DocumentKey, boolean>>;
  province?: string;
  district?: string;
  serviceCenter?: string;
}

type TableState = Record<string, RowState>;

interface FixedRow {
  code: string;
  label: string;
  defaultDocuments?: DocumentKey[];
  location?: 'provinceDistrict' | 'serviceCenter';
  estimateOnly?: boolean;
}

// 14 รายการตามแบบฟอร์ม PS เดิม — ลำดับ 9 มีรายการย่อย 9.1–9.4
export const PS_QUOTE_ROWS: FixedRow[] = [
  { code: '1', label: 'อะไหล่แท้ มือ 1', defaultDocuments: ['estimate', 'partBook', 'photo'] },
  { code: '2', label: 'อะไหล่แท้ มือ 2', defaultDocuments: ['estimate', 'partBook', 'photo'] },
  { code: '3', label: 'อะไหล่เทียบ มือ 1', defaultDocuments: ['estimate', 'partBook', 'photo'] },
  { code: '4', label: 'อะไหล่เทียบ มือ 2', defaultDocuments: ['estimate', 'partBook', 'photo'] },
  { code: '5', label: 'อะไหล่สั่งทำ', defaultDocuments: ['estimate', 'partBook', 'samplePart'] },
  { code: '6', label: 'อะไหล่ส่งซ่อม', defaultDocuments: ['estimate', 'samplePart', 'oldPart'] },
  { code: '7', label: 'ค่าแรงในการซ่อมในบริษัท', defaultDocuments: ['estimate'], estimateOnly: true },
  { code: '8', label: 'ค่าแรงในการซ่อมนอกสถานที่', defaultDocuments: ['estimate'], location: 'provinceDistrict' },
  { code: '9', label: 'อะไหล่ตามหน้างาน (ต่างจังหวัด)', defaultDocuments: ['estimate'], location: 'provinceDistrict' },
  { code: '9.1', label: 'อะไหล่แท้ มือ 1', defaultDocuments: ['partBook', 'photo'] },
  { code: '9.2', label: 'อะไหล่แท้ มือ 2', defaultDocuments: ['partBook', 'photo'] },
  { code: '9.3', label: 'อะไหล่เทียบ มือ 1', defaultDocuments: ['partBook', 'photo'] },
  { code: '9.4', label: 'อะไหล่เทียบ มือ 2', defaultDocuments: ['partBook', 'photo'] },
  { code: '10', label: 'นำรถเข้าศูนย์บริการ', defaultDocuments: ['estimate'], location: 'serviceCenter' },
];

const DOCUMENT_COLUMNS: { key: DocumentKey; label: string }[] = [
  { key: 'estimate', label: 'ใบประเมิน' },
  { key: 'partBook', label: 'Part Book(รูปอะไหล่+ตำแหน่งที่ใส่)' },
  { key: 'photo', label: 'รูปภาพประกอบ' },
  { key: 'samplePart', label: 'อะไหล่ตัวอย่าง' },
  { key: 'oldPart', label: 'อะไหล่เก่าเพื่อเอาไปซ่อม' },
  { key: 'other', label: 'อื่น ๆ' },
];

const parseState = (value?: string): TableState => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const CheckButton = ({
  checked,
  disabled = false,
  onClick,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={checked}
    className={`mx-auto flex h-[18px] w-[18px] items-center justify-center rounded border transition ${
      disabled
        ? checked
          ? 'border-slate-300 bg-slate-200 text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
          : 'cursor-not-allowed border-slate-200 bg-slate-100 text-transparent dark:border-slate-700 dark:bg-slate-800'
        : checked
          ? 'border-purple-600 bg-purple-600 text-white'
          : 'border-gray-300 bg-white text-transparent hover:border-purple-400 dark:border-slate-600 dark:bg-slate-900'
    }`}
  >
    <IconCheck size={12} stroke={3} />
  </button>
);

const EXTRA_INPUT =
  'min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-800 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export function PsQuoteAttachmentTable({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const state = parseState(value);

  const updateRow = (code: string, patch: Partial<RowState>) =>
    onChange(JSON.stringify({ ...state, [code]: { ...state[code], ...patch } }));

  const setSelected = (row: FixedRow) => {
    if (state[row.code]?.selected) {
      // ปิดลำดับ = ทิ้งทั้ง checkbox เอกสารและข้อความสถานที่ของแถวนั้น
      onChange(JSON.stringify({ ...state, [row.code]: { selected: false } }));
      return;
    }

    const documents = (row.defaultDocuments ?? []).reduce<Partial<Record<DocumentKey, boolean>>>(
      (result, key) => ({ ...result, [key]: true }),
      {}
    );
    // เปิดลำดับใหม่ทุกครั้งด้วย default เท่านั้น ไม่คืนค่าที่เคยแก้ก่อนปิด
    onChange(JSON.stringify({ ...state, [row.code]: { selected: true, documents } }));
  };

  const toggleDocument = (row: FixedRow, key: DocumentKey) => {
    const rowState = state[row.code] ?? {};
    updateRow(row.code, {
      documents: { ...rowState.documents, [key]: !rowState.documents?.[key] },
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse">
          <thead className="text-[11px] font-semibold text-slate-200">
            <tr className="bg-[#0b1220]">
              <th rowSpan={2} className="w-14 border-r border-slate-700 px-2 py-2 text-center">เลือก</th>
              <th rowSpan={2} className="w-14 border-r border-slate-700 px-2 py-2 text-center">ลำดับ</th>
              <th rowSpan={2} className="min-w-[245px] border-r border-slate-700 px-3 py-2 text-left">
                รายการที่ต้องขอราคา
              </th>
              <th colSpan={DOCUMENT_COLUMNS.length} className="px-3 py-1.5 text-center">
                เอกสารแนบการขอราคา
              </th>
            </tr>
            <tr className="border-t border-slate-700 bg-[#111a2b]">
              {DOCUMENT_COLUMNS.map((column) => (
                <th key={column.key} className="w-[135px] border-l border-slate-700 px-2 py-2 text-center leading-snug">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PS_QUOTE_ROWS.map((row) => {
              const rowState = state[row.code] ?? {};
              const selected = !!rowState.selected;
              return (
                <tr key={row.code} className="border-b border-gray-100 bg-white last:border-b-0 dark:border-slate-800 dark:bg-slate-900">
                  <td className="border-r border-gray-100 px-2 py-2 text-center dark:border-slate-800">
                    <CheckButton
                      checked={selected}
                      onClick={() => setSelected(row)}
                      label={`เลือกลำดับ ${row.code} ${row.label}`}
                    />
                  </td>
                  <td className="mono border-r border-gray-100 px-2 py-2 text-center text-[12px] text-slate-500 dark:border-slate-800">
                    {row.code}
                  </td>
                  <td className="border-r border-gray-100 px-3 py-2 text-[12.5px] font-semibold text-gray-700 dark:border-slate-800 dark:text-slate-200">
                    {row.label}
                  </td>
                  {row.location || row.estimateOnly ? (
                    <>
                      {/* แถวค่าแรงคงเฉพาะใบประเมิน ส่วนแถวสถานที่ใช้พื้นที่เอกสารที่เหลือกรอกรายละเอียด */}
                      <td className="border-l border-gray-100 px-2 py-2 text-center dark:border-slate-800">
                        <CheckButton
                          checked={selected && !!rowState.documents?.estimate}
                          disabled={!selected}
                          onClick={() => toggleDocument(row, 'estimate')}
                          label={`ใบประเมิน — ลำดับ ${row.code} ${row.label}`}
                        />
                      </td>
                      <td colSpan={DOCUMENT_COLUMNS.length - 1} className="border-l border-gray-100 px-3 py-1.5 dark:border-slate-800">
                        {row.estimateOnly ? null : row.location === 'provinceDistrict' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">จังหวัด</span>
                            <input
                              aria-label={`จังหวัด — ลำดับ ${row.code}`}
                              value={rowState.province ?? ''}
                              onChange={(e) => updateRow(row.code, { province: e.target.value })}
                              disabled={!selected}
                              className={`${EXTRA_INPUT} disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                            />
                            <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">อำเภอ</span>
                            <input
                              aria-label={`อำเภอ — ลำดับ ${row.code}`}
                              value={rowState.district ?? ''}
                              onChange={(e) => updateRow(row.code, { district: e.target.value })}
                              disabled={!selected}
                              className={`${EXTRA_INPUT} disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap text-[12px] font-semibold text-slate-600 dark:text-slate-300">ชื่อศูนย์บริการ</span>
                            <input
                              aria-label={`ชื่อศูนย์บริการ — ลำดับ ${row.code}`}
                              value={rowState.serviceCenter ?? ''}
                              onChange={(e) => updateRow(row.code, { serviceCenter: e.target.value })}
                              disabled={!selected}
                              className={`${EXTRA_INPUT} disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                            />
                            <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">จังหวัด</span>
                            <input
                              aria-label={`จังหวัด — ลำดับ ${row.code}`}
                              value={rowState.province ?? ''}
                              onChange={(e) => updateRow(row.code, { province: e.target.value })}
                              disabled={!selected}
                              className={`${EXTRA_INPUT} disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                            />
                          </div>
                        )}
                      </td>
                    </>
                  ) : (
                    DOCUMENT_COLUMNS.map((column) => {
                      return (
                        <td key={column.key} className="border-l border-gray-100 px-2 py-2 text-center dark:border-slate-800">
                          <CheckButton
                            checked={selected && !!rowState.documents?.[column.key]}
                            disabled={!selected}
                            onClick={() => toggleDocument(row, column.key)}
                            label={`${column.label} — ลำดับ ${row.code} ${row.label}`}
                          />
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 bg-slate-50 px-3 py-2 text-[11.5px] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
        เลือกลำดับก่อนจึงจะระบุเอกสารและข้อมูลในแถวนั้นได้ เมื่อยกเลิกการเลือก ระบบจะล้างข้อมูลทั้งแถว
      </div>
    </div>
  );
}
