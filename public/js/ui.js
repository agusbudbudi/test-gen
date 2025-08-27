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

// paste template
function applyTemplate() {
  const templateUserStory = `**User Story**: As a user a want to ...`;
  const templatePrompt = `**Preconditions**: 
**AcceptanceCriteria**: 

**Constraints**: 

**Formatting table**
- create in table format only show content without header column section
- use <br> line breaks in the generated test case text
- Use Gherkin syntax (Given, When, Then) for test case preconditions, steps, and expected results.

Test cases should follow this structure:
- Column A: No (numbering)
- Column B: Section (feature name)
- Column C: Case Type (positive/negative/edge case)
- Column D: Title (concise comprehensive summary contains the item to be verified)  
- Column E: Precondition (dash list)  
- Column F: Step (numbered list)
- Column G: Expected Result (dash list)
`;

  document.getElementById("userStory").value = templateUserStory;
  document.getElementById("prompt").value = templatePrompt;
}
