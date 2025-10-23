// Toast Notification System
//==========================================
function showToast(message, type = "info", duration = 3000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Add icon based on type
  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="uil uil-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="uil uil-times-circle"></i>';
      break;
    case "warning":
      icon = '<i class="uil uil-exclamation-triangle"></i>';
      break;
    case "info":
    default:
      icon = '<i class="uil uil-info-circle"></i>';
      break;
  }

  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="closeToast(this)">
        <i class="uil uil-times"></i>
      </button>
    </div>
  `;

  // Add toast to container
  toastContainer.appendChild(toast);

  // Show toast with animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  // Auto remove toast after duration
  setTimeout(() => {
    closeToast(toast.querySelector(".toast-close"));
  }, duration);

  return toast;
}

function closeToast(closeButton) {
  const toast = closeButton.closest(".toast");
  if (toast) {
    toast.classList.remove("show");
    toast.classList.add("hide");

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

// Function to switch sections
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
  });

  // Show the selected section
  document.getElementById(sectionId).style.display = "block";

  // Remove 'active' class from all menu items
  document.querySelectorAll(".sidebar ul li").forEach((li) => {
    li.classList.remove("active");
  });

  // Add 'active' class to the clicked menu item
  document
    .querySelector(`.sidebar ul li a[onclick="showSection('${sectionId}')"]`)
    .parentElement.classList.add("active");

  if (sectionId === "history") {
    requestAnimationFrame(() => {
      const historyList = document.getElementById("historyList");
      if (historyList && historyList.lastElementChild) {
        const lastBubble = historyList.lastElementChild;
        lastBubble.scrollIntoView({ behavior: "auto", block: "end" });
      } else if (historyList) {
        historyList.scrollTop = historyList.scrollHeight;
      }
    });
  }
}

// loading state
//==========================================
function showLoading(state) {
  const loading = document.getElementById("loadingAnimation");
  if (state) {
    loading.classList.remove("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

//toggle theme
//==========================================
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("themeIcon");

  // Toggle dark mode
  body.classList.toggle("dark-mode");

  // Simpan tema di localStorage
  const isDarkMode = body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");

  // Tambahkan animasi perubahan ikon
  themeIcon.style.opacity = "0"; // Hilangkan ikon dulu
  setTimeout(() => {
    themeIcon.innerText = isDarkMode ? "☀️" : "🌙"; // Ganti ikon
    themeIcon.style.opacity = "1"; // Tampilkan kembali dengan efek
  }, 300);
}

// Toggle Sidebar
//==========================================
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const content = document.querySelector(".content");
  const toggleButton = document.getElementById("toggleSidebar");
  const toggleIcon = toggleButton.querySelector("i");

  // Toggle collapsed class
  sidebar.classList.toggle("collapsed");

  // Change icon based on sidebar state
  if (sidebar.classList.contains("collapsed")) {
    // Sidebar is collapsed (closed) - show right arrow to indicate it can be opened
    toggleIcon.className = "uil uil-angle-right-b";
  } else {
    // Sidebar is expanded (open) - show left arrow to indicate it can be closed
    toggleIcon.className = "uil uil-angle-left-b";
  }

  // Adjust content width
  content.style.width = sidebar.classList.contains("collapsed") ? "93%" : "85%";

  // Save state in localStorage
  localStorage.setItem(
    "sidebarCollapsed",
    sidebar.classList.contains("collapsed")
  );
}

// Load sidebar state on page load
function loadSidebarState() {
  const sidebar = document.querySelector(".sidebar");
  const content = document.querySelector(".content");
  const toggleButton = document.getElementById("toggleSidebar");
  const toggleIcon = toggleButton?.querySelector("i");

  if (localStorage.getItem("sidebarCollapsed") === "true") {
    sidebar.classList.add("collapsed");
    content.style.width = "93%";
    // Set icon to right arrow when sidebar is collapsed
    if (toggleIcon) {
      toggleIcon.className = "uil uil-angle-right-b";
    }
  } else {
    content.style.width = "85%"; //default width content main
    // Set icon to left arrow when sidebar is expanded
    if (toggleIcon) {
      toggleIcon.className = "uil uil-angle-left-b";
    }
  }
}

function copyTestCase() {
  const resultTable = document.getElementById("resultTable");
  const rows = resultTable.querySelectorAll("tbody tr");

  if (rows.length === 0) {
    showToast("No test cases to copy!", "warning");
    return;
  }

  let copiedText = "";

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    let rowData = [];

    cells.forEach((cell) => {
      let cellText = cell.innerHTML
        .replace(/<br\s*\/?>/gi, "\r\n") // Ganti <br> jadi \r\n
        .replace(/&nbsp;/g, " ") // Ganti &nbsp; jadi spasi biasa
        .replace(/&amp;/g, "&") // UPDATE: Ganti &amp; jadi &
        .replace(/&lt;/g, "<") // UPDATE: Ganti &lt; jadi <
        .replace(/&gt;/g, ">") // UPDATE: Ganti &gt; jadi >
        .replace(/<[^>]*>/g, "") // Hapus tag HTML lain
        .trim();

      // Escape double quotes di dalam cell (jadi double-double quotes "")
      cellText = cellText.replace(/"/g, `""`);

      // Jika ada \r\n (multiline) atau ada double quote, bungkus dengan quote
      if (cellText.includes("\r\n") || cellText.includes('"')) {
        cellText = `"${cellText}"`;
      }

      rowData.push(cellText);
    });

    copiedText += rowData.join("\t") + "\n"; // Tab antar kolom, newline antar baris
  });

  navigator.clipboard
    .writeText(copiedText)
    .then(() => showToast("Test cases copied successfully!", "success"))
    .catch(() => showToast("Failed to copy test cases", "error"));
}

function showApiKeyModal() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const savedKey = localStorage.getItem("OPENAI_API_KEY");

  if (savedKey) {
    apiKeyInput.placeholder = "API Key sudah tersimpan";
    apiKeyInput.value = "";
    apiKeyInput.disabled = true;
  } else {
    apiKeyInput.placeholder = "Enter OpenAI API Key";
    apiKeyInput.value = "";
    apiKeyInput.disabled = false;
  }

  document.getElementById("apiKeyModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeApiKeyModal() {
  document.getElementById("apiKeyModal").classList.add("hidden");
  document.getElementById("modalOverlay").classList.add("hidden");
}

// Save API Key to localStorage
function setApiKey() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem("OPENAI_API_KEY", apiKey);
    showToast("API Key saved successfully!", "success");
    closeApiKeyModal();
    apiKeyInput.placeholder = "API key sudah tersimpan";
    apiKeyInput.value = ""; // Pastikan tidak auto-isi demi keamanan
    apiKeyInput.disabled = true;
  } else {
    showToast("Please enter a valid API Key", "warning");
  }
}

// Load saved API Key (optional: auto-fill input field if key exists)
// document.addEventListener("DOMContentLoaded", () => {
//   const savedKey = localStorage.getItem("OPENAI_API_KEY");
//   if (savedKey) {
//     document.getElementById("apiKeyInput").value = savedKey;
//   }
// });

function clearApiKey() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  localStorage.removeItem("OPENAI_API_KEY"); // Remove from storage
  apiKeyInput.value = ""; // Clear input field
  showToast("API Key has been cleared", "info");
  closeApiKeyModal(); // Auto-close the modal after clicking "OK"
  apiKeyInput.placeholder = "Enter OpenAI API Key";
  apiKeyInput.value = ""; // Pastikan tidak auto-isi demi keamanan
  apiKeyInput.disabled = false;
}

function deleteHistory(index, type) {
  if (type === "prompt") {
    promptHistory.splice(index, 1);
    localStorage.setItem("promptHistory", JSON.stringify(promptHistory));
  } else if (type === "result") {
    resultHistory.splice(index, 1);
    localStorage.setItem("resultHistory", JSON.stringify(resultHistory));
  }
  updateHistory();
}

// Initialize all UI components when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Load sidebar state
  loadSidebarState();

  // Set theme based on saved preference
  const isDarkMode = localStorage.getItem("theme") === "dark";
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
    const themeIcon = document.getElementById("themeIcon");
    if (themeIcon) {
      themeIcon.innerText = "☀️";
    }
  }

  // Attach event listeners
  const toggleButton = document.getElementById("toggleSidebar");
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleSidebar);
  }

  const themeToggle = document.getElementById("toggleTheme");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  const copyButton = document.getElementById("copyTestCaseButton");
  if (copyButton) {
    copyButton.addEventListener("click", copyTestCase);
  }

  // Load history data
  let savedPrompts = localStorage.getItem("promptHistory");
  let savedResults = localStorage.getItem("resultHistory");

  if (savedPrompts) {
    promptHistory = JSON.parse(savedPrompts);
  }
  if (savedResults) {
    resultHistory = JSON.parse(savedResults);
  }

  updateHistory();
});

//how to use modal
//==========================================
function showHowToUseModal() {
  document.getElementById("howToUseModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeHowToUseModal() {
  document.getElementById("howToUseModal").classList.add("hidden");
  document.getElementById("modalOverlay").classList.add("hidden");
}

function showPromptInstructionsModal() {
  const modal = document.getElementById("promptInstructionsModal");
  const overlay = document.getElementById("modalOverlay");
  const input = document.getElementById("promptInstructionsInput");
  const savedInstructions = localStorage.getItem("promptInstructions") || "";

  if (input) {
    input.value = savedInstructions;
  }

  modal?.classList.remove("hidden");
  overlay?.classList.remove("hidden");
}

function closePromptInstructionsModal() {
  document.getElementById("promptInstructionsModal").classList.add("hidden");
  document.getElementById("modalOverlay").classList.add("hidden");
}

function cancelPromptInstructions() {
  const input = document.getElementById("promptInstructionsInput");
  if (input) {
    input.value = localStorage.getItem("promptInstructions") || "";
  }
  closePromptInstructionsModal();
}

function savePromptInstructions() {
  const input = document.getElementById("promptInstructionsInput");
  const value = input?.value.trim() || "";

  if (!value) {
    showToast("Prompt instructions cleared.", "info");
    localStorage.removeItem("promptInstructions");
  } else {
    localStorage.setItem("promptInstructions", value);
    showToast("Prompt instructions saved.", "success");
  }

  closePromptInstructionsModal();
}

// paste template
// function applyTemplate() {
//   const templateUserStory = `**User Story**: `;
//   const templatePrompt = `**Preconditions**:
// **AcceptanceCriteria**:

// **Constraints**: cover positive, negative, and edge cases

// **Formatting table**
// create in table format only show content without header column section
// use <br> line breaks in the generated test case text
// use Gherkin syntax (Given, When, Then) for test case columns: Preconditions, Step, and Expected Result.

// **Example of Precondition using Gherkin syntax:**
// - Given user has one voucher to send
// - And user email is valid

// **Example of Step using Gherkin syntax:**
// 1. When triggering email for single voucher
// 2. And check recipient email

// **Example of Expected Result using Gherkin syntax:**
// - Then email is sent to recipient with one voucher as attachment
// - And attachment is a PNG image of the voucher

// Test cases should follow this structure:
// - Column A: No (numbering)
// - Column B: Section (feature name)
// - Column C: Case Type (positive/negative/edge case)
// - Column D: Title (concise comprehensive summary contains the item to be verified)
// - Column E: Precondition (dash list)
// - Column F: Step (numbered list)
// - Column G: Expected Result (dash list)
// `;

//   document.getElementById("userStory").value = templateUserStory;
//   document.getElementById("prompt").value = templatePrompt;
// }

// function applyTemplate() {
//   const templateUserStory = `**User Story**: `;

//   const templatePrompt = `You are a QA expert. Based on the provided User Story, generate a comprehensive **test case list** that covers:

// - Functional behavior (core feature functionality)
// - UI interactions (buttons, fields, input formats, visual feedback)
// - Validation (required fields, data format, input length)
// - Error handling (API failures, incorrect input, timeouts)
// - Edge cases (empty states, boundary values, rare conditions)
// - Positive, negative, and edge case scenarios

// **Requirements:**
// - Be exhaustive: explore all logical flows, error states, and alternate paths.
// - Use proper Gherkin syntax for Preconditions, Steps, and Expected Results.
// - Ensure each test case is clear, atomic, and testable.

// **Output Formatting (in Markdown table):**
// - Column A: No (Test case number)
// - Column B: Section (Feature/module/component being tested)
// - Column C: Case Type (Positive / Negative / Edge Case)
// - Column D: Title (short but comprehensive summary of what's tested)
// - Column E: Precondition (Gherkin-style bullet list, use <br> for line breaks)
// - Column F: Step (Gherkin-style numbered list, use <br> for line breaks)
// - Column G: Expected Result (Gherkin-style bullet list, use <br> for line breaks)

// **Examples:**

// **Precondition (Gherkin-style):**
// - Given user is logged in<br>
// - And user has one voucher available

// **Step (Gherkin-style):**
// 1. When user clicks "Send Voucher"<br>
// 2. And enters recipient email

// **Expected Result (Gherkin-style):**
// - Then email is sent to recipient<br>
// - And voucher is attached as PNG

// **Constraints:**
// - Cover **happy path**, **alternate flows**, and **error cases**
// - Consider both **client-side** and **server-side** behaviors
// - Focus also on **UI components**, including their state and transitions

// Generate test cases only in table format, no explanation or extra text.`;

//   document.getElementById("userStory").value = templateUserStory;
//   document.getElementById("prompt").value = templatePrompt;
// }

function applyTemplate() {
  const templateUserStory = `**User Story**:
[Masukkan user story di sini]`;

  const templatePrompt = `**Preconditions**:
- [Masukkan precondition di sini]

**Acceptance Criteria**:
- [Masukkan acceptance criteria di sini]`;

  document.getElementById("userStory").value = templateUserStory;
  document.getElementById("prompt").value = templatePrompt;
}
