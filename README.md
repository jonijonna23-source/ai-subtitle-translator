<div align="center">
  <a href="https://aisubtitletranslator.vercel.app/" target="_blank">
    <img src="https://raw.githubusercontent.com/jonijonna23-source/ai-subtitle-translator/ec6e0b702f1ccb69115d6b449362dba0ef342506/cc_16913599.png" width="80" height="80" alt="AI Subtitles Translator Logo" />
  </a>
  
  <h1>
    <a href="https://aisubtitletranslator.vercel.app/" target="_blank" style="text-decoration: none; color: inherit;">🎬 AI Subtitles Translator</a>
  </h1>
  <p><b>A professional subtitle translation tool featuring Batch Processing & Smart Retry</b></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/AI_Models-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini/OpenAI/Groq" />
  </p>
</div>

<hr />

### 🚀 Overview
**AI Subtitles Translator** is a specialized web application built to seamlessly translate subtitle files across various formats. Powered by leading AI models (**Google Gemini, OpenAI, and Groq**), it delivers natural, context-aware translations while intelligently managing API rate limits through an automated batching architecture.

---

### ✨ Key Features

<table>
  <tr>
    <td width="50%">
      <h4>📦 Automated Batching</h4>
      Intelligently splits subtitles into optimized chunks (e.g., 15 lines) to maintain context and respect AI token limits.
    </td>
    <td width="50%">
      <h4>🛡️ Resilient API Handling</h4>
      Built-in smart retry mechanism that automatically pauses and re-attempts connections during API rate limits (Error 429).
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h4>📊 Real-time Monitoring</h4>
      Track translation progress with a live percentage indicator, batch counter, and instant text previews.
    </td>
    <td width="50%">
      <h4>⏹️ Granular Process Control</h4>
      Safely halt ongoing translations with a "Stop" function that preserves all successfully processed data.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h4>💾 Secure Local Storage</h4>
      Your API keys are stored securely in your browser's <code>localStorage</code>, eliminating the need for repeated manual entry.
    </td>
    <td width="50%">
      <h4>📋 Frictionless Export</h4>
      Instantly copy translated text to your clipboard or download the final synchronized subtitle file with a single click.
    </td>
  </tr>
</table>

---


### 🛠️ Technical Reference

| Component | Architecture Details |
| :--- | :--- |
| **Translation Engine** | Utilizes custom prompt engineering ("Professional Movie Translator") to ensure culturally relevant and informal/natural dialogues. |
| **State Management** | Leverages React's `useState` and `useRef` for optimal real-time UI updates without unnecessary re-renders. |
| **Reliability Loop** | Implements asynchronous `while(!success)` loops, ensuring zero data loss or skipped lines during API congestion. |
| **Subtitle Parser** | Custom parsing logic to safely extract, translate, and reconstruct subtitle files while strictly preserving timecode synchronization. |
