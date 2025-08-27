// Parse GPT response into a structured table format
function parseGPTTable(gptResponse) {
  var rows = gptResponse.trim().split("\n");
  var table = [
    [
      "No",
      "Section",
      "Case Type",
      "Title",
      "Precondition",
      "Step",
      "Expected Result",
    ],
  ];

  rows.forEach(function (row) {
    var parts = row.split("|").map((cell) => cell.trim());

    // if (parts.length < 8) return;
    if (parts.length < 8 || isNaN(parts[1])) return; // Skip header or malformed rows

    // Extract test case details
    var no = parts[1];
    var section = parts[2];
    var CaseType = parts[3];
    var title = parts[4];
    // Convert <br> into properly formatted bullet points
    var precondition = formatMultiLine(parts[5]);
    var step = formatMultiLine(parts[6]);
    var expectedResult = formatMultiLine(parts[7]);

    table.push([
      no,
      section,
      CaseType,
      title,
      precondition,
      step,
      expectedResult,
    ]);
  });

  showToast("Success generate Test Case!", "success");

  return table;
}

// Format multiline text
function formatMultiLine(text) {
  return (
    text
      // .split("<br>")

      .replace(/<br\s*\/?>/gi, "\n") // Replace all <br> variants with newline

      .split("\n")
      .map((line) => line.trim())
      .join("\n")
  );
}

// Export table to Excel
function exportToExcel() {
  const table = document.getElementById("resultTable");
  if (table.classList.contains("hidden")) {
    showToast("No data to export!", "warning");

    return;
  }

  let wb = XLSX.utils.book_new();
  let ws = XLSX.utils.table_to_sheet(table);

  XLSX.utils.book_append_sheet(wb, ws, "TestCases");
  XLSX.writeFile(wb, "Test_Cases.xlsx");

  showToast("Success Downloading to Excel!", "success");
}
