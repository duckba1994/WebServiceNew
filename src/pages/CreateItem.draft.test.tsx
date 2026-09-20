import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { CreateItem } from './CreateItem';
import { DEPT_FORMS } from '../data/requestForm';
import { DraftScope } from '../hooks/useSessionDraft';
import { clearDraftSession, draftGeneration, startDraftSession, suspendDraftSession, writeDraft } from '../utils/sessionDrafts';

jest.mock('../components/layout/Layout', () => ({ Layout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice', name: 'Alice', token: 'token' }, isAuthenticated: true }) }));
jest.mock('../hooks/useDepartments', () => ({ useDepartments: () => ({ departments: [], loading: false, error: null }) }));
jest.mock('../hooks/usePlMasterData', () => ({ usePlMasterData: () => ({ typeOptions: [], requestTypeOptions: [], unitNames: [], loading: false }) }));
jest.mock('../hooks/useCrMasterData', () => ({ useCrMasterData: () => ({ sectionOptions: [], requestTypeOptions: () => [], requestSubTypeOptions: () => [], loading: false }) }));
jest.mock('../hooks/useDeptMasterData', () => ({ useDeptMasterData: () => ({ typeOptions: () => [], requestTypeOptions: () => [], subTypeOptions: () => [], unitNames: [], loading: false }) }));
jest.mock('../hooks/usePsPrelims', () => ({ usePsPrelims: () => ({ options: [], loading: false }) }));
jest.mock('../hooks/useAddressMaster', () => ({ useAddressMaster: () => ({ provinceOptions: [], districtsByProvince: new Map(), loading: false }) }));

beforeEach(() => { clearDraftSession(); startDraftSession('alice'); });
afterEach(() => clearDraftSession());

test.each(Object.keys(DEPT_FORMS))('actual %s create form reopens the selected department with unsaved text', departmentShort => {
  const department = { departid: departmentShort, departmentShort, departmentName: departmentShort };
  writeDraft('/%2Fcreate/CreateItem.dep', department, true, draftGeneration());
  const app = <DraftScope name="/create"><CreateItem /></DraftScope>;
  const first = render(app);
  const inputs = screen.getAllByRole('textbox');
  const textarea = inputs.find(input => input.tagName === 'TEXTAREA') ?? inputs.find(input => !(input as HTMLInputElement).readOnly && !(input as HTMLInputElement).disabled);
  expect(textarea).toBeDefined();
  fireEvent.change(textarea!, { target: { value: `ร่าง ${departmentShort} ยังไม่ได้ส่ง` } });
  suspendDraftSession('/create');
  first.unmount();
  expect(startDraftSession('alice', true)).toBe('/create');
  render(app);
  expect(screen.getByDisplayValue(`ร่าง ${departmentShort} ยังไม่ได้ส่ง`)).toBeInTheDocument();
});
