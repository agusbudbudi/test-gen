import { useState } from 'react'
import { Key, Layers, Eye, EyeOff, CheckCircle2, Trash2, ExternalLink, Zap } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'

type Tab = 'general' | 'jira'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showJiraToken, setShowJiraToken] = useState(false)
  const toast = useToast()

  const {
    apiKey, setApiKey, clearApiKey,
    selectedModel, setSelectedModel,
    defaultTestCaseCount, setDefaultTestCaseCount,
    jiraUrl, setJiraUrl,
    jiraEmail, setJiraEmail,
    jiraToken, setJiraToken,
    jiraProjectKey, setJiraProjectKey,
  } = useUIStore()

  // ─── General handlers ───────────────────────────────────────────
  const handleSaveGeneral = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim())
      setApiKeyInput('')
    }
    toast.success('General settings saved!')
  }

  const handleClearApiKey = () => {
    clearApiKey()
    setApiKeyInput('')
    toast.info('API Key cleared.')
  }

  // ─── Jira handlers ─────────────────────────────────────────────
  const handleSaveJira = () => {
    if (!jiraUrl.trim() || !jiraEmail.trim() || !jiraToken.trim() || !jiraProjectKey.trim()) {
      toast.warning('Please fill in all Jira fields.')
      return
    }
    // Values are already bound via onChange — just confirm
    toast.success('Jira settings saved!')
  }

  const handleClearJira = () => {
    setJiraUrl('')
    setJiraEmail('')
    setJiraToken('')
    setJiraProjectKey('')
    toast.info('Jira settings cleared.')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Key size={16} /> },
    { id: 'jira', label: 'Jira Integration', icon: <Layers size={16} /> },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure your API keys, AI model, and integrations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Sidebar */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary dark:bg-primary/15'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-primary/10 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {/* ── General Tab ── */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 space-y-6 animate-slide-up">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">General</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">OpenAI configuration for AI-powered features.</p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={apiKey ? '••••••••  (key saved)' : 'sk-...'}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {apiKey && !apiKeyInput && (
                  <p className="text-xs text-green-500 font-medium flex items-center gap-1 pt-0.5">
                    <CheckCircle2 size={12} /> API Key is saved.
                  </p>
                )}
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  OpenAI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
                >
                  <option value="gpt-4o">gpt-4o — Most Capable</option>
                  <option value="gpt-4o-mini">gpt-4o-mini — Faster & Cheaper</option>
                  <option value="gpt-4-turbo">gpt-4-turbo — Reliable & Powerful</option>
                  <option value="o3-mini">o3-mini — Advanced Reasoning</option>
                  <option value="o1">o1 — Complex Reasoning</option>
                </select>
              </div>

              {/* Default test count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Default Test Case Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={defaultTestCaseCount}
                  onChange={(e) => setDefaultTestCaseCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveGeneral}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20 text-sm"
                >
                  Save Settings
                </button>
                {apiKey && (
                  <button
                    onClick={handleClearApiKey}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium rounded-xl transition-colors text-sm"
                  >
                    <Trash2 size={15} />
                    Clear Key
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Jira Integration Tab ── */}
          {activeTab === 'jira' && (
            <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 space-y-6 animate-slide-up">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">Jira Integration</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect to Jira to export bug reports directly as issues.
                  </p>
                </div>
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium flex-shrink-0"
                >
                  <ExternalLink size={12} />
                  Get API Token
                </a>
              </div>

              {/* Jira Domain */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Jira Domain
                </label>
                <input
                  type="url"
                  placeholder="https://yourcompany.atlassian.net"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Atlassian Email
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                />
              </div>

              {/* API Token */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  API Token
                </label>
                <div className="relative">
                  <input
                    type={showJiraToken ? 'text' : 'password'}
                    placeholder={jiraToken ? '••••••••  (token saved)' : 'ATATT3xFfGF0...'}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
                    value={jiraToken}
                    onChange={(e) => setJiraToken(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowJiraToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showJiraToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {jiraToken && (
                  <p className="text-xs text-green-500 font-medium flex items-center gap-1 pt-0.5">
                    <CheckCircle2 size={12} /> API Token is saved.
                  </p>
                )}
              </div>

              {/* Project Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Project Key <span className="text-slate-400 font-normal">(e.g. QA, BUG)</span>
                </label>
                <input
                  type="text"
                  placeholder="QA"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200 uppercase"
                  value={jiraProjectKey}
                  onChange={(e) => setJiraProjectKey(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-slate-400">
                  Must exactly match a project key in your Jira workspace.
                </p>
              </div>

              {/* Connection status */}
              {jiraUrl && jiraEmail && jiraToken && jiraProjectKey && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl">
                  <Zap size={15} className="text-green-500 flex-shrink-0" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    Jira is configured — ready to export bug reports!
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveJira}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20 text-sm"
                >
                  Save Jira Settings
                </button>
                {(jiraUrl || jiraEmail || jiraToken || jiraProjectKey) && (
                  <button
                    onClick={handleClearJira}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium rounded-xl transition-colors text-sm"
                  >
                    <Trash2 size={15} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
