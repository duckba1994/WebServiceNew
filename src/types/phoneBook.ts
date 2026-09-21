export interface PhoneBookEntry {
  recId: number;
  phoneNumber: string;
  userName: string;
  type: string;
  departId: string;
  department: string;
  departmentName: string;
  remark: string | null;
  createDate: string | null;
  createBy: string | null;
  editDate: string | null;
  editBy: string | null;
  activeStatus: boolean;
}

export interface PhoneBookPayload {
  phoneNumber: string;
  userName: string;
  type: string;
  departId: string;
  remark: string | null;
}
