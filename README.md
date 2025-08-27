# 🧠 AI Test Case Generator

A powerful web-based application that leverages AI to automatically generate comprehensive test cases for software testing. Built with modern web technologies and featuring an intuitive user interface with dark/light mode support.

![TestGen Logo](public/assets/images/testgen.png)

## ✨ Features

### 🎯 Core Functionality

- **AI-Powered Test Case Generation**: Generate detailed test cases using OpenAI's GPT models
- **Template System**: Pre-built templates for quick test case creation
- **Multiple Test Case Types**: Support for positive, negative, and edge test cases
- **Gherkin Syntax**: Automatic formatting using Given-When-Then structure

### 🔧 Advanced Features

- **Test Case Review**: AI-powered review and improvement suggestions
- **Bug Report Generator**: Automated bug report creation from test findings
- **Export Capabilities**: Export test cases to Excel format with proper formatting
- **Copy Functionality**: One-click copy of test cases with multiline support
- **History Management**: Track and manage previously generated test cases

### 🎨 User Interface

- **Modern Design**: Clean, professional interface with smooth animations
- **Dark/Light Mode**: Toggle between themes with persistent settings
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Toast Notifications**: Beautiful colored notifications for user feedback
- **Collapsible Sidebar**: Space-efficient navigation with state persistence

### 🔐 Security & Configuration

- **API Key Management**: Secure storage of OpenAI API keys in localStorage
- **Smart Placeholders**: Dynamic UI feedback for API key status
- **Error Handling**: Comprehensive error management with user-friendly messages

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key (for AI functionality)
- Local web server (optional, for development)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/agusbudbudi/TestGen.git
   cd TestGen
   ```

2. **Install dependencies** (if using Node.js)

   ```bash
   npm install
   ```

3. **Open the application**

   - For direct use: Open `index.html` in your web browser
   - For development: Use a local server like Live Server or `python -m http.server`

4. **Configure API Key**
   - Click on "API Key" in the sidebar
   - Enter your OpenAI API key
   - The key is securely stored in your browser's localStorage

## 📖 Usage Guide

### 1. Generate Test Cases

1. Navigate to "Generate Test Case" section
2. Click "Use Template" to load a pre-built template
3. Fill in the User Story and detailed prompt
4. Click "Generate" to create AI-powered test cases
5. Review the generated table of test cases

### 2. Export and Copy

- **Export to Excel**: Click the Excel export button to download formatted test cases
- **Copy Test Cases**: Use the copy button to copy test cases with proper formatting
- **Add to History**: Save generated test cases for future reference

### 3. Review Test Cases

1. Go to "Review Test Case" section
2. Paste your existing test cases
3. Click "Review Test Case" for AI-powered improvement suggestions

### 4. Generate Bug Reports

1. Navigate to "Bug Report" section
2. Describe the bug you found
3. Click "Generate Bug Report" for structured bug documentation

### 5. Manage History

- View all previously generated test cases
- Delete unwanted entries
- Reuse successful prompts

## 🏗️ Project Structure

```
TestGen/
├── index.html                 # Main application file
├── package.json              # Node.js dependencies
├── README.md                 # Project documentation
├── public/
│   ├── assets/
│   │   ├── icons/           # Favicon and app icons
│   │   └── images/          # Logo and images
│   ├── css/
│   │   ├── style.css        # Main styles
│   │   ├── themes.css       # Dark/light mode themes
│   │   ├── toastStyle.css   # Toast notification styles
│   │   ├── modalStyle.css   # Modal dialog styles
│   │   ├── buttonStyle.css  # Button components
│   │   ├── headerStyle.css  # Header styling
│   │   ├── sidebarStyle.css # Sidebar navigation
│   │   ├── textareaStyle.css# Input field styles
│   │   ├── badgeStyle.css   # Badge components
│   │   ├── historyStyle.css # History section
│   │   └── reviewTestCase.css# Review section
│   └── js/
│       ├── main.js          # Application initialization
│       ├── ui.js            # UI interactions & toast system
│       ├── api.js           # OpenAI API integration
│       ├── table.js         # Table formatting & export
│       ├── theme.js         # Theme management
│       ├── reviewTestCase.js# Test case review logic
│       └── generateBugReport.js# Bug report generation
└── src/
    └── components/          # Modular components
        ├── sidebar.js
        ├── chatHistory.js
        └── testCaseGenerator.js
```

## 🎨 UI Components

### Toast Notification System

- **Success**: Green gradient background for successful operations
- **Error**: Red gradient background for error messages
- **Warning**: Orange gradient background for warnings
- **Info**: Blue gradient background for informational messages

### Theme System

- **Light Mode**: Clean, bright interface for daytime use
- **Dark Mode**: Easy-on-eyes dark theme for low-light environments
- **Persistent Settings**: Theme preference saved across sessions

## 🔧 Technical Details

### Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI Integration**: OpenAI GPT API
- **Export**: XLSX.js for Excel file generation
- **Icons**: Unicons and Font Awesome
- **Fonts**: Inter and Poppins from Google Fonts

### Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance Features

- **Lazy Loading**: Efficient resource loading
- **CSS Animations**: Smooth transitions and micro-interactions
- **Responsive Design**: Optimized for all screen sizes
- **Local Storage**: Client-side data persistence

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Follow coding standards**
   - Use consistent indentation
   - Add comments for complex logic
   - Test your changes thoroughly
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Maintain the existing code style
- Add appropriate comments and documentation
- Test all functionality before submitting
- Update README if adding new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT API that powers the AI functionality
- **Font Awesome & Unicons** for the beautiful icon sets
- **Google Fonts** for the typography
- **XLSX.js** for Excel export functionality

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/agusbudbudi/TestGen/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

---

**Made with ❤️ for the QA community**

_Streamline your testing workflow with AI-powered test case generation!_
