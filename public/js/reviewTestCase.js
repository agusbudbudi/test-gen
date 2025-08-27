async function reviewTestCase() {
  const input = document.getElementById("testCaseInput").value.trim();
  const result = document.getElementById("reviewResult");

  if (!input) {
    showToast("Please input a test case to review.", "warning");
    return;
  }

  const apiKey = localStorage.getItem("OPENAI_API_KEY");
  if (!apiKey) {
    result.innerHTML = `<p class="text-red-500">OpenAI API key is not set.</p>`;
    return;
  }

  result.innerHTML = `<p class="text-gray-500 italic">Reviewing test case with AI...</p>`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a senior QA. Analyze the provided test cases according to:
- Completeness (are all scenarios covered?)
- Clarity (are the steps understandable?)
- Coverage of edge and negative cases
- Suggestions for improvements`,
          },
          {
            role: "user",
            content: `Please review the following test case and give a summary, strengths, suggestions, and List Any missing important cases:\n\n${input}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "No response received.";

    result.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 class="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-3 flex items-center">
          🤖 AI Review Result
        </h2>
        <div class="text-sm space-y-6">
          ${formatGPTReview(reply)}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error reviewing test case:", error);
    result.innerHTML = `<p class="text-red-500">Failed to fetch review. Please try again.</p>`;
  }
}

function formatGPTReview(rawText) {
  // Split by ### to get sections
  const sections = rawText.split(/###\s*/).filter((section) => section.trim());
  let formatted = "";

  sections.forEach((section) => {
    const lines = section
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    if (lines.length === 0) return;

    const title = lines[0].replace(":", "").trim();
    const content = lines.slice(1);

    // Determine section type and format accordingly
    if (title.toLowerCase().includes("summary")) {
      formatted += formatSummarySection(content);
    } else if (title.toLowerCase().includes("strength")) {
      formatted += formatStrengthsSection(content);
    } else if (title.toLowerCase().includes("suggest")) {
      formatted += formatSuggestionsSection(content);
    } else if (title.toLowerCase().includes("missing")) {
      formatted += formatMissingSection(content);
    }
  });

  return (
    formatted ||
    `<div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${rawText}</div>`
  );
}

function formatSummarySection(content) {
  return `
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400 flex items-center">
        📋 Summary
      </h3>
      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          ${content
            .join(" ")
            .replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-medium text-blue-700 dark:text-blue-300">$1</strong>'
            )}
        </div>
      </div>
    </div>
  `;
}

function formatStrengthsSection(content) {
  let html = `
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3 text-green-600 dark:text-green-400 flex items-center">
        ✅ Strengths
      </h3>
      <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div class="space-y-2">
  `;

  content.forEach((line) => {
    if (line.match(/^\d+\./)) {
      // Numbered item
      const cleanLine = line.replace(/^\d+\.\s*/, "");
      html += `
        <div class="flex items-start space-x-2">
          <span class="text-green-600 dark:text-green-400 font-medium mt-0.5">•</span>
          <span class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            ${cleanLine.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-medium">$1</strong>'
            )}
          </span>
        </div>
      `;
    } else if (line.trim()) {
      html += `
        <div class="flex items-start space-x-2">
          <span class="text-green-600 dark:text-green-400 font-medium mt-0.5">•</span>
          <span class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            ${line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-medium">$1</strong>'
            )}
          </span>
        </div>
      `;
    }
  });

  html += `</div></div></div>`;
  return html;
}

function formatSuggestionsSection(content) {
  let html = `
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3 text-orange-600 dark:text-orange-400 flex items-center">
        💡 Suggestions for Improvement
      </h3>
      <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <div class="space-y-3">
  `;

  content.forEach((line) => {
    if (line.match(/^\d+\./)) {
      // Numbered item
      const cleanLine = line.replace(/^\d+\.\s*/, "");
      html += `
        <div class="flex items-start space-x-2">
          <span class="text-orange-600 dark:text-orange-400 font-medium mt-0.5">•</span>
          <span class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            ${cleanLine.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-medium text-orange-700 dark:text-orange-300">$1</strong>'
            )}
          </span>
        </div>
      `;
    } else if (line.trim()) {
      html += `
        <div class="flex items-start space-x-2">
          <span class="text-orange-600 dark:text-orange-400 font-medium mt-0.5">•</span>
          <span class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            ${line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-medium text-orange-700 dark:text-orange-300">$1</strong>'
            )}
          </span>
        </div>
      `;
    }
  });

  html += `</div></div></div>`;
  return html;
}

function formatMissingSection(content) {
  let html = `
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3 text-red-600 dark:text-red-400 flex items-center">
        ⚠️ Missing Important Cases
      </h3>
      <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <div class="space-y-4">
  `;

  let currentCategory = "";
  let categoryItems = [];

  content.forEach((line, index) => {
    if (line.match(/^\d+\.\s*\*\*.*\*\*/) || line.match(/^\*\*.*\*\*:/)) {
      // Save previous category
      if (currentCategory && categoryItems.length > 0) {
        html += formatMissingCategory(currentCategory, categoryItems);
        categoryItems = [];
      }

      // New category
      currentCategory = line
        .replace(/^\d+\.\s*/, "")
        .replace(/\*\*(.*?)\*\*:?/, "$1")
        .trim();
    } else if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
      // Category item
      categoryItems.push(line.replace(/^\s*[-•]\s*/, "").trim());
    } else if (line.trim() && !line.match(/^\d+\./)) {
      // Regular missing case
      html += `
        <div class="flex items-start space-x-2">
          <span class="text-red-600 dark:text-red-400 font-medium mt-0.5">•</span>
          <span class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            ${line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-medium text-red-700 dark:text-red-300">$1</strong>'
            )}
          </span>
        </div>
      `;
    }
  });

  // Add the last category
  if (currentCategory && categoryItems.length > 0) {
    html += formatMissingCategory(currentCategory, categoryItems);
  }

  html += `</div></div></div>`;
  return html;
}

function formatMissingCategory(category, items) {
  let html = `
    <div class="border-l-4 border-red-400 pl-3">
      <h4 class="font-medium text-sm text-red-700 dark:text-red-300 mb-2">
        ${category}
      </h4>
      <div class="space-y-1">
  `;

  items.forEach((item) => {
    html += `
      <div class="flex items-start space-x-2 ml-2">
        <span class="text-red-500 text-xs mt-1">▸</span>
        <span class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          ${item.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-medium">$1</strong>'
          )}
        </span>
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}
