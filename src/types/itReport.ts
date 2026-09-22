export interface DateRangeReport<T> {
  dateFrom: string;
  dateTo: string;
  total: number;
  items: T[];
}

export interface ITServiceFormSummaryItem {
  jobNo: string;
  requestDate: string | null;
  requestBy: string | null;
  comName: string | null;
  department: string | null;
  hw: string | null;
  hwDetail: string | null;
  requestDetail: string | null;
  solve: string | null;
  repairDetail: string | null;
  closeDate: string | null;
  closeBy: string | null;
  exPlanDate: string | null;
  remark: string | null;
  jobStatus: string | null;
  wfStep: number | null;
}

export interface ITSurveySummaryItem {
  jobNo: string;
  requestDate: string | null;
  friendlyService: number;
  fastService: number;
  focusService: number;
  directService: number;
  serviceKnowledge: number;
  totalScore: number;
}

export type ITSurveyField =
  | 'friendlyService'
  | 'fastService'
  | 'focusService'
  | 'directService'
  | 'serviceKnowledge';

export type ITServiceFormItem = {
  jobNo: string;
  requestDate: string | null;
  requestBy: string | null;
  comName: string | null;
  department: string | null;
  hw: string | null;
  hwDetail: string | null;
  requestDetail: string | null;
  solve: string | null;
  repairDetail: string | null;
  mgrApproveBy: string | null;
  mgrApproveDate: string | null;
  serviceBy: string | null;
  serviceDate: string | null;
  closeBy: string | null;
  closeDate: string | null;
  serviceTotal: number | null;
  serviceScore: number | null;
  servicePercentage: number | null;
  surveyRemark: string | null;
  surveyBy: string | null;
  surveyDate: string | null;
  remark: string | null;
} & Record<`${ITSurveyField}${1 | 2 | 3 | 4 | 5}`, boolean>;

export type ITServiceFormSummaryResponse = DateRangeReport<ITServiceFormSummaryItem>;
export type ITSurveySummaryResponse = DateRangeReport<ITSurveySummaryItem>;
export type ITReportName = 'service-form-summary' | 'survey-summary';
