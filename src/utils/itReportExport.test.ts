import { serviceExportRows, surveyExportRows } from './itReportExport';
import { ITServiceFormSummaryItem, ITSurveySummaryItem } from '../types/itReport';

test('survey export preserves API scores and job number', () => {
  const row = surveyExportRows([{ jobNo: '2600001', requestDate: null, friendlyService: 5, fastService: 4, focusService: 5, directService: 4, serviceKnowledge: 5, totalScore: 23 } as ITSurveySummaryItem])[0];
  expect(row['เลขที่ใบรับเรื่อง']).toBe('2600001');
  expect(row['คะแนนรวม']).toBe(23);
});

test('service export includes every backend detail field used by the report', () => {
  const item = { jobNo: '2600001', requestDate: null, requestBy: 'Somchai', comName: 'PC-001', department: 'ACCOUNT', hw: 'Hardware', hwDetail: 'Notebook', requestDetail: 'เปิดเครื่องไม่ได้', solve: 'Repair', repairDetail: 'เปลี่ยน power supply', closeDate: null, closeBy: 'IT Support', exPlanDate: null, remark: null, jobStatus: '6', wfStep: 6 } as ITServiceFormSummaryItem;
  const row = serviceExportRows([item])[0];
  expect(row['หน่วยงาน']).toBe('ACCOUNT');
  expect(row['รายละเอียดดำเนินการ']).toBe('เปลี่ยน power supply');
  expect(row['ขั้นตอน Workflow']).toBe(6);
});
