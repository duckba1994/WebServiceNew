// Placeholder domain entity — เปลี่ยนชื่อ/ฟิลด์ตามโปรเจกต์ใหม่
// ตัวอย่างแพตเทิร์น union type ตาม variant (ดู PROJECT_STRUCTURE.md §5.7)

export type ItemStatus = 'new' | 'pending' | 'urgent' | 'done';
export type ItemPriority = 'low' | 'normal' | 'high';

export interface BaseItem {
  id: string;
  title: string;
  status: ItemStatus;
  priority: ItemPriority;
  createdAt: string;
  ownerId: string;
}

// ตัวอย่าง variant (ลบ/แก้ได้ตามต้องการ)
export interface Item extends BaseItem {
  description?: string;
  tags?: string[];
}
