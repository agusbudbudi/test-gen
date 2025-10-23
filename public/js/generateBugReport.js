async function generateBugReport() {
  const bugDetails = document.getElementById("bugReportInput").value;
  const loading = document.getElementById("loadingBugReport");
  const bugTable = document.getElementById("bugReportTable");
  const tbody = bugTable.querySelector("tbody");

  const combinedPrompt = `You are a QA specialist. Based on the following bug details, generate a **bug report** in a **Markdown table format** with the following columns:
| Summary | Description | Severity & Retest Result |

**Instructions for each column:**
- **Summary**: A concise yet comprehensive title that clearly describes the bug, including the actual behavior and the expected behavior. Format: "[Component or Feature] - [Brief description of issue and what the expected behavior should be]".
- **Description**: Use the format below:
  **Steps to Reproduce:**
  1. Step one
  2. Step two
  3. Step three

  **Actual Result:**
  Clearly state what actually happened in the application.

  **Expected Result:**
  Clearly state what should have happened.

- **Severity & Retest Result**: Indicate the severity level (e.g., Minor, Major, Critical) and whether the issue has been retested and fixed or not (e.g., "Retest Passed", "Still Failing", "Not Yet Retested").

Use clear, professional QA language in your response.

Bug Details:
${bugDetails}`;

  if (!bugDetails.trim()) {
    showToast("Please enter bug details!", "warning");
    return;
  }

  loading.classList.remove("hidden");
  bugTable.classList.add("hidden");
  tbody.innerHTML = "";

  //API Key from local storage currently not use server proxy
  const apiKey = localStorage.getItem("OPENAI_API_KEY");
  if (!apiKey) {
    loading.classList.add("hidden");
    alert("API Key is missing! Please set it in the sidebar.");
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: combinedPrompt }],
        temperature: 0.7,
      }),
    });

    //BE Impmlementation using server proxy not use for now
    // try {
    //   const response = await fetch("/api/chat", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       model: "gpt-4o-mini",
    //       messages: [{ role: "user", content: combinedPrompt }],
    //       temperature: 0.7,
    //     }),
    //   });

    if (!response.ok) {
      throw new Error("Gagal mengambil data dari OpenAI!");
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content || "";
    const parsedData = parseBugReportTable(resultText);

    if (parsedData.length > 1) {
      bugTable.classList.remove("hidden");

      parsedData.slice(1).forEach((row) => {
        const tr = document.createElement("tr");

        // Pastikan ada minimal 3 kolom, jika tidak cukup tambahkan kolom kosong
        const processedRow =
          row.length >= 3
            ? row.slice(0, 3)
            : [...row, ...Array(3 - row.length).fill("")];

        processedRow.forEach((cell) => {
          const td = document.createElement("td");
          td.innerHTML = cell.replace(/\n/g, "<br>");
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      loading.classList.add("hidden");
    } else {
      alert("Tidak ada bug report yang dihasilkan.");
      loading.classList.add("hidden");
    }
  } catch (error) {
    alert(error.message);
    loading.classList.add("hidden");
  }
}

// Updated parseBugReportTable function
function parseBugReportTable(gptResponse) {
  const lines = gptResponse
    .trim()
    .split("\n")
    .filter((line) => line.includes("|") && !/^[-| ]+$/.test(line));

  const table = [];

  lines.forEach((line, index) => {
    const columns = line
      .split("|")
      .map((col) => col.trim())
      .filter((col) => col !== "");

    if (index === 0) {
      const headerColumns =
        columns.length >= 3
          ? columns.slice(0, 3)
          : [...columns, ...Array(3 - columns.length).fill("")];
      table.push(headerColumns);
    } else {
      const formattedColumns = [];

      // Column 1: Summary
      formattedColumns[0] = formatMultiLine(columns[0] || "");

      // Column 2: Description with special formatting
      formattedColumns[1] = formatDescription(columns[1] || "");

      // Column 3: Severity & Retest Result
      formattedColumns[2] = formatMultiLine(columns[2] || "");

      table.push(formattedColumns);
    }
  });

  showToast("Bug report generated successfully!", "success");

  return table;
}

// Format multiline text
function formatMultiLine(text) {
  if (!text) return "";

  return text
    .replace(/<br\s*\/?>/gi, "\n") // Replace all <br> variants with newline
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "") // Remove empty lines
    .join("\n");
}

// New function to format description column specifically
function formatDescription(text) {
  if (!text) return "";

  let formatted = text.trim();

  // Replace section headers
  formatted = formatted
    .replace(
      /\*\*Steps to Reproduce:\*\*/gi,
      "<strong>📋 Steps to Reproduce:</strong>"
    )
    .replace(
      /\*\*Step to Reproduce:\*\*/gi,
      "<strong>📋 Steps to Reproduce:</strong>"
    )
    .replace(
      /\*\*Actual Result:\*\*/gi,
      "<strong>❌ Actual Result:</strong><br>"
    )
    .replace(
      /\*\*Expected Result:\*\*/gi,
      "<strong>✅ Expected Result:</strong><br>"
    );

  // Clean up <br> tags
  formatted = formatted
    .replace(/(<br\s*\/?>){3,}/gi, "<br><br>")
    .replace(/(<br\s*\/?>)*(\s*<strong>)/gi, "<br><br>$2")
    .replace(/(<\/strong>)(\s*<br\s*\/?>)+/gi, "$1<br>")
    .replace(/^(<br\s*\/?>)+/gi, "")
    .replace(/(<br\s*\/?>)+$/gi, "")
    .replace(/^<br><br>/, "");

  return formatted;
}

function copyBugReport() {
  const bugReportTable = document.getElementById("bugReportTable");
  const rows = bugReportTable.querySelectorAll("tbody tr");

  if (rows.length === 0) {
    showToast("No bug report to copy!", "warning");
    return;
  }

  let copiedText = "";

  // Tambahkan header di baris pertama
  const headers = ["Summary", "Description", "Severity & Retest Result"];
  copiedText += headers.join("\t") + "\n";

  // Proses setiap baris data
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    let rowData = [];

    cells.forEach((cell) => {
      let cellText = cell.innerHTML
        .replace(/<br\s*\/?>/gi, "\r\n") // Ganti <br> dengan newline
        .replace(/&nbsp;/g, " ") // Ganti &nbsp; dengan spasi
        .replace(/&amp;/g, "&") // UPDATE: Ganti &amp; jadi &
        .replace(/&lt;/g, "<") // UPDATE: Ganti &lt; jadi <
        .replace(/&gt;/g, ">") // UPDATE: Ganti &gt; jadi >
        .replace(/<[^>]*>/g, "") // Hapus tag HTML lain
        .trim();

      // Escape double quotes
      cellText = cellText.replace(/"/g, `""`);

      // Bungkus dengan tanda kutip jika ada newline atau kutip
      if (cellText.includes("\r\n") || cellText.includes('"')) {
        cellText = `"${cellText}"`;
      }

      rowData.push(cellText);
    });

    copiedText += rowData.join("\t") + "\n";
  });

  // Salin ke clipboard
  navigator.clipboard
    .writeText(copiedText)
    .then(() => showToast("Bug report copied!", "success"))
    .catch(() => showToast("Failed to copy bug report.", "error"));
}
