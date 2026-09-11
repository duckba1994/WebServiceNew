import { moduleOfDepartment } from './requestListData';

test.each([
  ['SV-HV', 'SV'],
  ['sv-fl', 'SV'],
  ['HR-PR', 'HR_PR'],
  ['SA', 'SQA'],
  ['IT', 'IT'],
])('maps departmentShort %s to request module %s', (departmentShort, module) => {
  expect(moduleOfDepartment(departmentShort)).toBe(module);
});
