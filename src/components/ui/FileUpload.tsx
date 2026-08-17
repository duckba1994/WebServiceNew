import React, { useRef, useState } from 'react';
import { IconUpload, IconFile, IconX } from '@tabler/icons-react';

interface FileUploadProps {
  label?: string;
  accentColor?: string;
  onChange?: (files: File[]) => void;
}

// อัปโหลดไฟล์ + แสดงรายการ — reusable
export function FileUpload({ label, accentColor = '#1a5fb4', onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const update = (next: File[]) => {
    setFiles(next);
    onChange?.(next);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    update([...files, ...Array.from(e.target.files)]);
    e.target.value = '';
  };

  const remove = (i: number) => update(files.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ borderColor: accentColor, color: accentColor }}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 text-sm hover:bg-gray-50"
      >
        <IconUpload size={18} /> คลิกเพื่อเลือกไฟล์
      </button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handlePick} />
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-1.5 text-sm">
              <span className="flex items-center gap-2 truncate">
                <IconFile size={16} className="text-gray-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                <IconX size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
