# 🌌 SoulSpace: AI-Powered Sentimental Diary

**SoulSpace** is a modern, privacy-focused digital diary that uses Artificial Intelligence to help users track their emotional well-being. Built on the network edge for near-zero latency, SoulSpace doesn't just store memories—it understands them.

## 🚀 The Tech Stack

| Layer | Technology | Why we chose it |
| :--- | :--- | :--- |
| **API Framework** | **Hono** | Ultra-lightweight and designed for the Edge. |
| **Runtime** | **Cloudflare Workers** | Global scalability with zero "cold start" lag. |
| **Brain (AI)** | **Google Gemini API** | Advanced sentiment analysis and context awareness. |
| **Database** | **Cloudflare D1** | High-performance Serverless SQL for structured logs. |
| **Security** | **Google OAuth** | Industry-standard secure authentication. |



## ✨ Key Features

* **Real-time Sentiment Analysis:** As you write, our Hono-powered API processes text via Gemini to identify emotional trends.
* **Edge Performance:** By running on the "Edge," SoulSpace responds instantly, no matter where in the world the user is.
* **Secure & Private:** User entries are isolated at the database level and secured via encrypted JWT validation.
* **Pattern Recognition (Beta):** Comparing current entries against historical data to provide insights into emotional growth over time.

## 🛠️ Infrastructure Overview

SoulSpace uses a **Decoupled Architecture** to ensure speed and security:

1.  **Hono Middleware:** Validates user identity and cleanses input.
2.  **AI Orchestration:** The API communicates with Gemini to generate "Mood Vectors."
3.  **Hybrid Storage:** Structured data (dates/entries) lives in **D1**, while emotional "vibe" embeddings are stored for semantic search.

## ⚙️ Development & Security

We follow strict security protocols:
* **No Hard-coded Secrets:** All API keys are injected via Mocha's secure environment variables (`c.env`).
* **Type Safety:** Built with TypeScript to ensure data integrity across the platform.

---
*Created for the [Hackathon Name] - 2026*
