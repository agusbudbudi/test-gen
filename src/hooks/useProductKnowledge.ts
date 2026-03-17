import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToastStore } from '@/stores/toastStore'
import { useResultStore } from '@/stores/resultStore'
import { fetchChatStream } from '@/lib/api'

export interface JiraTicketData {
  url: string
  summary: string
  description: string
}

export function useProductKnowledge() {
  const [generating, setGenerating] = useState(false)
  const [importingUrls, setImportingUrls] = useState<Record<string, boolean>>({}) // Track importing state by URL
  
  const { jiraUrl, jiraEmail, jiraToken, apiKey, selectedModel } = useUIStore()
  const addToast = useToastStore((state) => state.addToast)
  
  const { 
    productKnowledgeResult: result, 
    setProductKnowledgeResult: setResult,
    productKnowledgeUrls: urls,
    setProductKnowledgeUrls: setUrls
  } = useResultStore()

  const extractJiraKey = (url: string): string | null => {
    if (!url) return null
    const match = url.match(/\/browse\/([A-Z0-9]+-[0-9]+)/i) || url.match(/^([A-Z0-9]+-[0-9]+)$/i)
    return match ? match[1].toUpperCase() : null
  }

  const fetchJiraDetails = async (url: string): Promise<JiraTicketData | null> => {
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      addToast('Please configure Jira settings first (Settings → Jira Integration).', 'warning')
      return null
    }

    const key = extractJiraKey(url)
    if (!key) {
      addToast(`Invalid Jira URL provided: ${url}`, 'error')
      return null
    }

    try {
      const res = await fetch(`/api/jira/issue/${key}?jiraUrl=${encodeURIComponent(jiraUrl)}&email=${encodeURIComponent(jiraEmail)}&token=${encodeURIComponent(jiraToken)}`)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = errData?.details?.errorMessages
          ? errData.details.errorMessages.join(', ')
          : errData?.error || `HTTP ${res.status}`
        addToast(`Failed to fetch ${key}: ${msg}`, 'error')
        return null
      }
      
      const data = await res.json()
      const summary = data.fields?.summary || ''
      let description = ''
      const descField = data.fields?.description
      if (descField) {
           if (typeof descField === 'string') {
               description = descField
           } else if (descField.type === 'doc' && Array.isArray(descField.content)) {
               const extractText = (node: any): string => {
                  if (node.type === 'text') return node.text || ''
                  if (node.type === 'hardBreak') return '\n'
                  if (Array.isArray(node.content)) {
                     const text = node.content.map(extractText).join('')
                     return node.type === 'paragraph' ? text + '\n' : text
                  }
                  return ''
               }
               description = descField.content.map(extractText).join('').trim()
           }
      }
      return { url, summary, description }
    } catch (err: any) {
      addToast(`Network error for ${url}: ${err.message}`, 'error')
      return null
    }
  }

  const generateProductKnowledge = useCallback(async (inputUrls: string[]) => {
    const validUrls = inputUrls.filter(u => u.trim() !== '')
    if (validUrls.length === 0) {
      addToast('Please provide at least one Jira ticket URL.', 'warning')
      return
    }

    if (!apiKey) {
      addToast('API Key is missing! Please set it in the sidebar.', 'warning')
      return
    }

    setGenerating(true)
    setResult('')
    
    const initialImportingState: Record<string, boolean> = {}
    validUrls.forEach(url => initialImportingState[url] = true)
    setImportingUrls(initialImportingState)

    try {
      const ticketPromises = validUrls.map(async (url) => {
        const ticketData = await fetchJiraDetails(url)
        setImportingUrls(prev => ({ ...prev, [url]: false }))
        return ticketData
      })
      
      const tickets = await Promise.all(ticketPromises)
      const successfulTickets = tickets.filter((t): t is JiraTicketData => t !== null)
      
      if (successfulTickets.length === 0) {
         addToast('Failed to retrieve data from all provided Jira tickets.', 'error')
         setGenerating(false)
         return
      }

      let contextBuilder = "Here are the details from the Jira tickets:\n\n"
      successfulTickets.forEach((ticket, index) => {
        contextBuilder += `### Ticket ${index + 1} (${extractJiraKey(ticket.url) || 'Unknown'})\n`
        contextBuilder += `**Summary**: ${ticket.summary}\n`
        contextBuilder += `**Description/AC**: \n${ticket.description}\n\n`
      })

      const systemPrompt = `You are an Expert Technical Writer and Lead QA Engineer. 
Your task is to analyze the provided Acceptance Criteria (AC) and descriptions from multiple Jira tickets and combine them into a single, cohesive, comprehensive, and VERY easy-to-understand Product Knowledge Document.

This document is intended to be copied into Confluence to share knowledge with the QA team, developers, and other stakeholders.

CRITICAL INSTRUCTIONS FOR FORMATTING & TONE:
- Tone: Professional but Playful and engaging.
- Emojis: Use relevant emojis abundantly for headings, lists, and key points to make it visually appealing.
- Elements: Use bold text (**bold**), tables (| Col | Col |), numbered lists (1., 2.), bullet points (-), and clean spacing.
- Formatting: Use standard Markdown ONLY. 
- Structure: Ensure the flow is logical, merged cleanly (not just copy-pasted ticket by ticket), and refined.
- DO NOT output any markdown code blocks (e.g. \`\`\`markdown) wrapping the entire response. Start directly with the first heading.

Please structure the output exactly like this (but adapt the content based on the provided AC):

---
# 📘 QA Product Knowledge — [Generate a catchy title based on the features]
---

# 📌 1. Feature Overview
[Detailed executive summary of what these features collectively achieve]

---
# 🎯 2. Objectives
[Bullet points with emojis summarizing the main goals and what it prevents/ensures]

---
# 📍 3. Location in System
[Create a Markdown Table showing where these features are located/available]

---
# ⚙️ 4. Key Rules & Display Conditions
[Detailed explanation of the logic, rules, and conditions for the features to appear or work. Use subheadings (###) and tables if necessary]

---
# 🔍 5. Detailed Capabilities & Workflow
[A structured breakdown based on the ACs. Use tables, bolding, and clear steps to explain the expected behavior. Be extremely thorough.]

---
# ⚠️ 6. Error Handling & Edge Cases
[Highlight any important constraints, error messages, or edge cases. Use tables or blockquotes for error messages if applicable]

---
# 📊 7. Summary
[A wrap-up table summarizing Key Areas and their Behaviors]

---
# ✅ Document Info
**Version:** 1.0
**Owner:** QA Team
**Purpose:** Product Knowledge & QA Reference
---

${contextBuilder}
`

      setResult('') // Reset result for new generation
      
      let fullResult = ''
      let hasSkippedMarkdownBlock = false

      await fetchChatStream({
        model: selectedModel,
        messages: [{ role: 'user', content: systemPrompt }],
        ...(selectedModel.startsWith('o') ? {} : { temperature: 0.2 }),
        stream: true
      }, apiKey, (chunk) => {
        fullResult += chunk
        
        let displayResult = fullResult
        if (!hasSkippedMarkdownBlock) {
           if (displayResult.startsWith('```markdown')) {
              displayResult = displayResult.replace(/^```markdown\n?/, '')
              hasSkippedMarkdownBlock = true
           } else if (displayResult.startsWith('```')) {
              displayResult = displayResult.replace(/^```\n?/, '')
              hasSkippedMarkdownBlock = true
           }
        }
        setResult(displayResult)
      })

      // Final cleanup after stream ends
      const finalResult = fullResult.replace(/```$/, '').trim()
      setResult(finalResult)
      
      addToast('Product Knowledge generated successfully!', 'success')

    } catch (error: any) {
      console.error('Generation failed:', error)
      addToast(error.message || 'Failed to generate product knowledge', 'error')
    } finally {
      setGenerating(false)
      setImportingUrls({})
    }
  }, [apiKey, jiraUrl, jiraEmail, jiraToken, selectedModel, addToast, setResult])

  return { 
    generateProductKnowledge, 
    generating, 
    result, 
    importingUrls, 
    urls, 
    setUrls 
  }
}
