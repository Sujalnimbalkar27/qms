// Utility functions for Excel/CSV operations
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

/**
 * Load questions from Excel file.
 */
function loadQuestions() {
  const filePath = path.join(__dirname, "../../excel_data/questions.xlsx");
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

/**
 * Load employees from Excel file.
 */
function loadEmployees() {
  const filePath = path.join(__dirname, "../../excel_data/employee_list.xlsx");
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

/**
 * Save test result to Excel file.
 */
function saveTestResult(result) {
  const filePath = path.join(__dirname, "../../excel_data/results.xlsx");
  let workbook, sheet, data;
  try {
    workbook = xlsx.readFile(filePath);
    sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = xlsx.utils.sheet_to_json(sheet);
  } catch {
    data = [];
    workbook = xlsx.utils.book_new();
    sheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, sheet, "Results");
  }
  data.push(result);
  const newSheet = xlsx.utils.json_to_sheet(data);
  workbook.Sheets[workbook.SheetNames[0]] = newSheet;
  xlsx.writeFile(workbook, filePath);
}

/**
 * Log test assignment to assigned_tests.csv (log style).
 */
function logTestAssignment(employeeId, testName, hrId) {
  const csvPath = path.join(__dirname, "../../excel_data/assigned_tests.csv");
  const assignmentDate = new Date().toISOString();
  const row = `"${employeeId}","${testName}","${hrId}","${assignmentDate}"\n`;
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, "Employee_id,TestName,HR_id,AssignmentDate\n");
  }
  fs.appendFileSync(csvPath, row);
}

/**
 * Aggregate assigned tests for an employee from log-style CSV.
 */
function getAssignedTestsForEmployee(employeeId) {
  const filePath = path.join(__dirname, "../../excel_data/assigned_tests.csv");
  const workbook = xlsx.readFile(filePath, { type: "file", raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data
    .filter((row) => row.Employee_id === employeeId && row.TestName)
    .map((row) => row.TestName);
}

/**
 * Load test links from CSV file.
 * Returns an object: { [TestName]: TestLink }
 */
function loadTestLinks() {
  const filePath = path.join(__dirname, "../../excel_data/test_links.csv");
  if (!fs.existsSync(filePath)) return {};
  const workbook = xlsx.readFile(filePath, { type: "file", raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  const map = {};
  data.forEach((row) => {
    if (row.TestName && row.TestLink) map[row.TestName] = row.TestLink;
  });
  return map;
}

module.exports = {
  loadQuestions,
  loadEmployees,
  saveTestResult,
  logTestAssignment,
  getAssignedTestsForEmployee,
  loadTestLinks,
};
