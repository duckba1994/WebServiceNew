import * as XLSX from 'xlsx';
import {
  DateRangeReport, ITServiceFormSummaryItem, ITSurveySummaryItem,
} from '../types/itReport';

export const surveyExportRows = (items: ITSurveySummaryItem[]) => items.map((item, index) => ({
  'ลำดับ': index + 1,
  'เลขที่ใบรับเรื่อง': item.jobNo,
  'วันที่รับเรื่อง': item.requestDate,
  'สุภาพและเป็นมิตร': item.friendlyService,
  'ความรวดเร็ว': item.fastService,
  'กระตือรือร้นและตั้งใจ': item.focusService,
  'ตรงตามที่คาดหวัง': item.directService,
  'แนะนำขั้นตอนและให้ความรู้': item.serviceKnowledge,
  'คะแนนรวม': item.totalScore,
}));

export const serviceExportRows = (items: ITServiceFormSummaryItem[]) => items.map((item, index) => ({
  'ลำดับ': index + 1,
  'เลขที่ใบรับเรื่อง': item.jobNo,
  'วันที่รับเรื่อง': item.requestDate,
  'ผู้แจ้ง': item.requestBy,
  'ชื่อคอมพิวเตอร์': item.comName,
  'หน่วยงาน': item.department,
  'Hardware': item.hw,
  'รายละเอียด Hardware': item.hwDetail,
  'รายละเอียดที่แจ้ง': item.requestDetail,
  'การบริการ': item.solve,
  'รายละเอียดดำเนินการ': item.repairDetail,
  'วันที่ปิด': item.closeDate,
  'ผู้ปิดงาน': item.closeBy,
  'วันที่คาดว่าจะเสร็จ': item.exPlanDate,
  'หมายเหตุ': item.remark,
  'สถานะงาน': item.jobStatus,
  'ขั้นตอน Workflow': item.wfStep,
}));

const createReportSheet = (rows: Record<string, unknown>[], title: string, dateFrom: string, dateTo: string) => {
  const sheet = XLSX.utils.aoa_to_sheet([[title], [`ช่วงวันที่ ${dateFrom} ถึง ${dateTo}`], []]);
  XLSX.utils.sheet_add_json(sheet, rows, { origin: 'A4' });
  sheet['!freeze'] = { xSplit: 0, ySplit: 4 };
  return sheet;
};

export function exportSurveyReport(data: DateRangeReport<ITSurveySummaryItem>) {
  const workbook = XLSX.utils.book_new();
  const sheet = createReportSheet(surveyExportRows(data.items), 'รายงานสรุปความพึงพอใจหน่วยงาน IT', data.dateFrom, data.dateTo);
  sheet['!cols'] = [8, 18, 22, 18, 16, 22, 20, 25, 14].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'Survey Summary');
  XLSX.writeFile(workbook, `IT_Survey_Summary_${data.dateFrom}_${data.dateTo}.xlsx`);
}

export function exportServiceReport(data: DateRangeReport<ITServiceFormSummaryItem>) {
  const workbook = XLSX.utils.book_new();
  const sheet = createReportSheet(serviceExportRows(data.items), 'ทะเบียนคุมรับเรื่อง IT', data.dateFrom, data.dateTo);
  sheet['!cols'] = [8, 18, 22, 22, 22, 16, 16, 22, 35, 18, 35, 22, 22, 22, 25, 14, 16].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'Service Register');
  XLSX.writeFile(workbook, `IT_Service_Register_${data.dateFrom}_${data.dateTo}.xlsx`);
}
