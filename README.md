# 🧠 AI Test Gen V2

A powerful AI-driven test case generator and management platform. Build, organize, and execute test cases with the speed of AI and the precision of a professional QA suite.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)


## ✨ New in V2

### 🎯 AI Test Case Generation
- **Intelligent Creation**: Generate comprehensive test cases (Positive, Negative, Edge cases) using OpenAI GPT models.
- **Jira Integration**: Import user stories and acceptance criteria directly from Jira URLs.
- **Dynamic Templates**: Quick-start with pre-configured templates for common features.
- **Global Prompting**: Configure global instructions to refine AI output across all generations.

### 📂 Test Management & Organization
- **Smart Folders**: Organize your testing library into hierarchical project folders.
- **Drag & Drop**: Seamlessly move test cases and folders with a modern drag-and-drop interface.
- **Advanced Search**: Filter and find test cases instantly across large project trees.
- **IDB Persistence**: Client-side storage via IndexedDB for high-performance data persistence.

### 🚀 Test Execution (Test Runs)
- **Execution Tracking**: Create Test Runs to track your testing progress.
- **Status Management**: Mark results as Passed, Failed, Blocked, or Skipped.
- **Activity Logs**: Automatic history of all status changes and execution notes.
- **Visual Analytics**: Professional pie charts and progress bars for execution reports.
- **Report Export**: Download test execution reports as PNG images for easy sharing.

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS V4, Lucide React
- **State Management**: Zustand
- **Storage**: IndexedDB (client-side persistence)
- **AI Backend**: Node.js/Express (Vercel Serverless Functions)
- **Export**: XLSX.js for Excel, html-to-image for PNG reports

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/agusbudbudi/test-gen.git
   cd test-gen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root:
   ```env
   OPENAI_API_KEY=your_key_here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
test-gen/
├── api/                  # Vercel Serverless Functions (Backend)
├── src/
│   ├── components/       # Shared UI components (Modals, Tables, Toast)
│   ├── hooks/            # Custom React hooks (API, Jira, Export)
│   ├── lib/              # Utility functions and API clients
│   ├── pages/            # Feature pages (Generate, Review, Test Mgmt)
│   ├── stores/           # Zustand state management
│   └── styles/           # Tailwind CSS configuration
├── public/               # Static assets & icons
└── vercel.json           # Vercel deployment configuration
```

## 🌐 Deployment

The project is pre-configured for **Vercel**:

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add `OPENAI_API_KEY` to Vercel Environment Variables.
4. Vercel will automatically handle the static frontend and the serverless backend.

---

**Made with ❤️ for the QA community**
_Streamline your testing workflow with AI-powered test case generation!_
