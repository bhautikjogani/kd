function doGet(e) {

  const action = e.parameter.action;
  if (action === "getMonthlyAttendance") {
    return ContentService.createTextOutput(
      JSON.stringify(getMonthlyAttendance())
    ).setMimeType(ContentService.MimeType.JSON);
  } else if (action === "submitAttendance") {
    const employeeName = e.parameter.employeeName;
    const status = e.parameter.status;

    const result = submitAttendance(employeeName, status);
    return ContentService.createTextOutput(
      JSON.stringify({ message: result })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(
    JSON.stringify({ message: "test-2" })
  ).setMimeType(ContentService.MimeType.JSON);
}

// function doPost(e) {
//   const data = JSON.parse(e.postData.contents);
//   const result = submitAttendance(data.employeeName, data.status);
//   return ContentService.createTextOutput(
//     JSON.stringify({ message: result })
//   ).setMimeType(ContentService.MimeType.JSON);
// }

function formatDateKey(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function getMonthlyAttendance() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const empSheet = ss.getSheetByName("DATA");
  const attSheet = ss.getSheetByName("Attendance Log");

  const employees = empSheet.getRange("N2:N" + empSheet.getLastRow())
    .getValues().flat().filter(String);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const dates = [];
  for (let d = new Date(today); d >= firstDay; d.setDate(d.getDate() - 1)) {
    dates.push(formatDateKey(new Date(d)));
  }

  const rows = attSheet.getDataRange().getValues();
  const statusMap = {};
  employees.forEach(emp => statusMap[emp] = {});

  for (let i = 1; i < rows.length; i++) {
    const rowDate = new Date(rows[i][0]);
    rowDate.setHours(0, 0, 0, 0);
    const dateKey = formatDateKey(rowDate);
    const name = rows[i][1];
    const status = rows[i][2];
    if (statusMap[name]) statusMap[name][dateKey] = status;
  }

  return { employees, dates, statusMap, today: formatDateKey(today) };
}

function submitAttendance(employeeName, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance Log");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowDate = new Date(data[i][0]);
    rowDate.setHours(0, 0, 0, 0);
    if (formatDateKey(rowDate) === todayKey && data[i][1] === employeeName) {
      sheet.getRange(i + 1, 3).setValue(status);
      return "Updated attendance for " + employeeName;
    }
  }
  sheet.appendRow([new Date(), employeeName, status]);
  return "Marked attendance for " + employeeName;
}
