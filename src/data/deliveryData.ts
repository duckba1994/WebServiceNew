import { DeliveryDocStatus, DeliveryRow } from '../types/delivery';

// ── สไตล์ป้ายสถานะเอกสาร ────────────────────────────────────
export const DELIVERY_STATUS_META: Record<
  DeliveryDocStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  confirmed: { label: 'ผจก.ฝ่ายจัดส่ง ยืนยันการจัดส่ง', color: 'var(--tint-green-fg)', bg: 'var(--tint-green-bg)', border: 'var(--tint-green-bd)' },
  waiting: { label: 'รอ ผจก.ฝ่ายอนุมัติการจัดส่ง', color: 'var(--tint-amber-fg)', bg: 'var(--tint-amber-bg)', border: 'var(--tint-amber-bd)' },
  rejected: { label: 'ผจก.ฝ่ายไม่อนุมัติการจัดส่ง', color: 'var(--tint-pink-fg)', bg: 'var(--tint-pink-bg)', border: 'var(--tint-pink-bd)' },
};

// ── นิยามคอลัมน์ ─────────────────────────────────────────────
export type DeliveryColumnKind = 'delivery' | 'date' | 'status' | 'mono';

export interface DeliveryColumn {
  key: keyof DeliveryRow | 'no';
  label: string;
  width: number;
  align: 'left' | 'center' | 'right';
  kind?: DeliveryColumnKind;
}

export const DELIVERY_COLUMNS: DeliveryColumn[] = [
  { key: 'no', label: 'ลำดับ', width: 52, align: 'center' },
  { key: 'delivery', label: 'เลขที่ใบแจ้งจัดส่ง', width: 124, align: 'left', kind: 'delivery' },
  { key: 'deliveryDate', label: 'วันที่แจ้งจัดส่ง', width: 108, align: 'center', kind: 'date' },
  { key: 'docStatus', label: 'สถานะเอกสาร', width: 210, align: 'left', kind: 'status' },
  { key: 'creator', label: 'ผู้สร้างเอกสาร', width: 120, align: 'left' },
  { key: 'quoteNo', label: 'เลขที่ใบเสนอราคา', width: 130, align: 'left', kind: 'mono' },
  { key: 'bookingNo', label: 'เลขที่ใบจองสินค้า', width: 124, align: 'left', kind: 'mono' },
  { key: 'customer', label: 'ชื่อลูกค้า', width: 230, align: 'left' },
  { key: 'jobType', label: 'ลักษณะงาน', width: 140, align: 'left' },
  { key: 'site', label: 'ที่อยู่ลูกค้า', width: 150, align: 'left' },
  { key: 'startDate', label: 'วันที่เริ่มทำงาน', width: 110, align: 'center', kind: 'date' },
  { key: 'endDate', label: 'วันที่สิ้นสุดการทำงาน', width: 130, align: 'center', kind: 'date' },
  { key: 'duration', label: 'รวมระยะเวลาเช่า', width: 110, align: 'center' },
  { key: 'machine', label: 'ประเภทเครื่องจักร', width: 118, align: 'left', kind: 'mono' },
  { key: 'plReply', label: 'สถานะการตอบกลับ PL', width: 160, align: 'left' },
  { key: 'truckPL', label: 'เบอร์รถที่ PL ระบุ', width: 110, align: 'center', kind: 'mono' },
  { key: 'plOptDate', label: 'วันที่ PL จัดหา อปต.', width: 120, align: 'center', kind: 'date' },
  { key: 'plNote', label: 'หมายเหตุ PL', width: 110, align: 'left' },
];

// ── ตัวเลือกในตัวกรองเพิ่มเติม ────────────────────────────────
export const DELIVERY_FILTER_CUSTOMERS = [
  '-- ทั้งหมด --',
  'บริษัท ไนน์ สตรีม จำกัด',
  'บริษัท แสนสิริ จำกัด (มหาชน)',
  'บริษัท ซินเท็ค คอนสตรัคชั่น จำกัด (มหาชน)',
];
export const DELIVERY_FILTER_DOC_STATUSES = [
  '--- ทั้งหมด ---',
  'รอ ผจก.ฝ่ายอนุมัติการจัดส่ง',
  'ผจก.ฝ่ายจัดส่ง ยืนยันการจัดส่ง',
  'ผจก.ฝ่ายไม่อนุมัติการจัดส่ง',
];

// ── mock data (รอต่อ API) ────────────────────────────────────
export const MOCK_DELIVERIES: DeliveryRow[] = [
  { id: 1, delivery: 'PDR690163', deliveryDate: '17/07/2026', docStatus: 'confirmed', creator: 'วิชิต เทียนทอง', quoteNo: 'ระหว่างทำใบเสนอราคา', bookingNo: 'PPD690258', customer: 'บริษัท ไนน์ สตรีม จำกัด', jobType: 'งานฐานราก', site: 'อ.นครชัยศรี จ.นครปฐม', startDate: '17/07/2026', endDate: '16/08/2026', duration: '1 เดือน', machine: '04-55CC', plReply: 'เครื่องจักรและอปต. พร้อม', truckPL: '10/28', plOptDate: '—', plNote: '', flag: 'ok' },
  { id: 2, delivery: 'PDR690147', deliveryDate: '24/06/2026', docStatus: 'confirmed', creator: 'วิชิต เทียนทอง', quoteNo: 'B-QUO26000747', bookingNo: 'PPD690222', customer: 'บริษัท อินนิเทียลเอ็นจิเนียริ่ง จำกัด', jobType: 'งานประกอบโครงสร้าง', site: 'โรงงานยูนิลีเวอร์', startDate: '11/05/2026', endDate: '10/06/2026', duration: '1 เดือน', machine: '03-25RC', plReply: 'เครื่องจักรพร้อม', truckPL: '10/29', plOptDate: '—', plNote: 'ppp', flag: 'ok' },
  { id: 3, delivery: 'PDR690146', deliveryDate: '24/06/2026', docStatus: 'waiting', creator: 'วิชิต เทียนทอง', quoteNo: 'B-QUO26000748', bookingNo: 'PPD690223', customer: 'บริษัท แสนสิริ จำกัด (มหาชน) (สาขาที่ 2)', jobType: 'หมู่บ้านติดตั้งเครน', site: 'เศรษฐสิริ จรัญฯ', startDate: '05/07/2026', endDate: '04/09/2026', duration: '2 เดือน', machine: '03-50RC', plReply: 'ไม่มีเครื่องจักรว่าง', truckPL: '—', plOptDate: '—', plNote: '', flag: '' },
  { id: 4, delivery: 'PDR690144', deliveryDate: '19/06/2026', docStatus: 'confirmed', creator: 'วิชิต เทียนทอง', quoteNo: 'B-QUO26000750', bookingNo: 'PPD690225', customer: 'บริษัท แสนสิริ จำกัด (มหาชน) (สาขาที่ 2)', jobType: 'หมู่บ้านติดตั้งเครน', site: 'อณาสิริ ศรีนครินทร์', startDate: '07/04/2026', endDate: '06/06/2026', duration: '2 เดือน', machine: '03-25RC', plReply: 'เครื่องจักรพร้อม', truckPL: '10/26', plOptDate: '—', plNote: '', flag: 'ok' },
  { id: 5, delivery: 'PDR690143', deliveryDate: '19/06/2026', docStatus: 'rejected', creator: 'วิชิต เทียนทอง', quoteNo: '—', bookingNo: 'PPD690234', customer: 'บริษัท ซินเท็ค คอนสตรัคชั่น จำกัด (มหาชน)', jobType: 'ยกติดตั้งโครงสร้าง', site: 'โครงการ One Bangkok', startDate: '20/04/2026', endDate: '19/05/2026', duration: '1 เดือน', machine: '02-080TB', plReply: 'เครื่องจักรพร้อม', truckPL: '10/28', plOptDate: '—', plNote: '', flag: 'rejected' },
];

// ── ตัวเลือกในฟอร์มสร้างใบจัดส่ง (จากหน้าจอ WinForms) ─────────
export const MACHINE_DOC_CHECKS = [
  'สำเนา ปจ.2',
  'สำเนา พรบ',
  'สำเนา ประกันภัยรถยนต์',
  'สำเนาป้ายภาษี',
  'สำเนาทะเบียนรถ',
  'เอกสารส่งมอบเครื่องจักรก่อนเข้างาน',
  'รูปภาพเครื่องจักร',
  'อื่นๆ',
];

export const EQUIPMENT_STD_CHECKS = [
  'สเก็น : รถ LT (6&10) สเก็น 4 ตัน 2ชิ้น / รถRC25-RC70 สเก็น 8.5 ตัน 2ชิ้น / รถ TS25-TS55 สเก็น 8.59ตัน 2ชิ้น และ 12ตัน 2ชิ้น / รถ TB100-TB400 สเก็น 12 ตัน 2 ชิ้น และ 35 ตัน 2 ชิ้น',
  'แผ่นอลูมิเนียม (กว้างxยาว) : รถ LT 6,10 ล้อ ขนาด 60x45 ซม. / รถ RC25-35,TS25 ขนาด 60x90 ซม. / รถ RC50-RC-70,TS50-55 / TB ขนาด 60 x 120 ซม.',
  'สลิงหัวถัก/หัวตะกั่ว : รถ LT(6,10) สลิง 10 มิล ยาว 8 เมตร 2 เส้น / รถ RC25 สลิง 16 มิล ยาว 8 เมตร 2 เส้น / รถ RC50-RC70 สลิง 19 มิล ยาว 8 เมตร 2 เส้น / รถ TB,TS สลิง 22-24 มิล ยาว 8 เมตร 2 เส้น',
];

// อุปกรณ์ร้องขอเพิ่ม — บางรายการมีช่องกรอกจำนวน/ขนาดพร้อมหน่วย
export interface ExtraEquipmentItem {
  label: string;
  // หน่วยของช่องกรอกแต่ละช่อง (ไม่มี = ไม่มีช่องกรอก, 'wide' = ช่องข้อความยาวไม่มีหน่วย)
  units?: string[];
  wide?: boolean;
}

export const EXTRA_EQUIPMENT: ExtraEquipmentItem[] = [
  { label: 'บักเก็ตเทปูน', units: ['คิว'] },
  { label: 'ผ้าใบขนาด', units: ['ตัน', 'เส้น'] },
  { label: 'สเก็นขนาด', units: ['ตัน', 'เส้น'] },
  { label: 'สลิงขนาด', units: ['ตัน', 'เส้น'] },
  { label: 'โซ่พวง', units: ['ชุด'] },
  { label: 'ตะขอสับขนาด', units: ['ตัน', 'หุน'] },
  { label: 'วิทยุสื่อสาร', units: ['เครื่อง'] },
  { label: 'ถังดับเพลิง', units: ['ปอนด์'] },
  { label: 'ผ้าคลุมรถโฟคลิฟท์' },
  { label: 'กรวยจราจร' },
  { label: 'ใบเซอร์อุปกรณ์', wide: true },
  { label: 'อื่นๆ', wide: true },
];

export const DELIVERY_OPT_CHECKS = [
  'ต้องตรวจสุขภาพ 5 โรคร้าย + สารเสพติด',
  'ต้องตรวจสุขภาพทั่วไป + สารเสพติด',
  'รพ. รัฐบาล',
  'คลีนิค / รพ. เอกชน',
  'ประวัติอาชญกรรม',
  'ประกันสังคม / หลักฐานการชำระประกันสังคม',
  'มาตรฐานเอกสารอปต. : สำเนาบัตรประชาชน/สำเนาใบขับขี่/ใบเซอร์',
  'รูปถ่ายหน้าตรง ขนาด',
  'มาตรฐานการแต่งกายอปต. : ชุดยูนิฟอร์มบริษัทฯ/รองเท้า/หมวก Safety/แว่นตา/เสื้อสะท้อนแสง',
  'ส่ง อปต. อบรมวันที่',
  'วันที่ต้องการเอกสาร ระบุ',
  'ส่งเอกสารทาง Email',
  'อื่นๆ',
];

export const DELIVERY_DOC_CHECKS = [
  'เครื่องจักรใช้ใบงานเดิม (กรณีย้ายไซต์ใช้งบโครงการเดิม)',
  'ค่าขนส่งเปิดใบงานเฉพาะกิจ',
  'งานใหม่ต้องเปิดใบงานใหม่',
  'งาน Support เปิดใบงานเฉพาะกิจ',
  'รถทดแทนต้องเปิดใบงานใหม่',
];

export const DELIVERY_TECH_CHECKS = [
  'แจ้งช่างอบรม วันที่',
  'มาตรฐานการแต่งกายช่าง ชุดยูนิฟอร์มบริษัทฯ/รองเท้า/หมวก Safety/แว่นตา/เสื้อสะท้อนแสง',
  'มาตรฐานเอกสารช่าง สำเนาบัตรประชาชน',
  'ต้องตรวจสุขภาพ 5 โรคร้าย + สารเสพติด',
  'ต้องตรวจสุขภาพทั่วไป + สารเสพติด',
  'รพ.รัฐบาล',
  'คลีนิค/รพ. เอกชน',
  'รูปถ่ายหน้าตรง ขนาด',
  'เอกสารประกันสังคม / หลักฐานการชำระประกันสังคม',
  'ประวัติอาชญกรรม',
  'วันที่ต้องการเอกสาร ระบุ',
  'ส่งเอกสารทาง Email',
  'อื่นๆ',
];
