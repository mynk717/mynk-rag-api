
***

```markdown
# RAG Notebook (NotebookLM-style UI)
A minimal, modern Retrieval-Augmented Generation (RAG) client inspired by NotebookLM, built with React, Vite, Tailwind CSS, and a custom backend API—optimized for knowledge integration from user-uploaded documents and website links.

---

## 🚀 Features

- **Upload Source Files**: Drag & drop or browse local files (PDF, CSV, TXT, MD) for knowledge ingestion.
- **Ask Contextual Questions**: Query an assistant using chat, grounded in your uploaded sources.
- **Session Isolation**: Each session uses its own uploaded files and context. Start fresh anytime.
- **Chat and File Persistence**: Chat history and uploaded sources persist across browser refreshes via `localStorage`.
- **Modern UI**: Clean, NotebookLM-inspired interface, responsive layout, and polished experience.
- **API Integration**: Connects to your backend for both file uploads and queries.
- **(Coming Soon)** Website Link Ingestion (Stage 3).

---

## 🧑‍💻 Tech Stack

- **Frontend**: React + Vite, Tailwind CSS
- **Backend**: Node.js API (`/api/upload`, `/api/query`), Vercel serverless
- **Vector DB**: Qdrant/other integration (Stage 2+)
- **Deployment**: Vercel, automatic from GitHub

---

## 🛠️ Setup & Usage

### 1. Clone the repo

```
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name/rag-notebook
```

### 2. Install dependencies

```
npm install
```

### 3. Development

```
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production build

```
npm run build
npm run preview
```

### 5. Deployment (Vercel)

- Make sure your Vercel project’s root directory is set to `rag-notebook` in project settings.
- Push your latest commits to the connected branch.
- Vercel will auto-deploy.

---

## ✨ How It Works

- **File Upload:**  
  Sequential upload, one request per file, to `/api/upload` (`multipart/form-data: file`).  
  File size max: 4MB (front-end check; adjust in code if your backend supports more).

- **Chat Query:**  
  POST to `/api/query` with `{ question, sessionId, files: [filenames] }`.  
  Response shows answer and optional citations.

- **Session Isolation:**  
  Clicking "New Session" rotates the session ID and clears both files and chat.  
  "New Chat" keeps your uploaded files, resets only chat messages.

- **Persistence:**  
  Uses browser `localStorage` for files, chat, session ID.  
  Data hydrates instantly after refresh.

- **UI Components:**  
  - **Sidebar:** Sources file list, file removal.
  - **Dropzone:** Drag & drop/browse file upload.
  - **ChatPanel:** Chat history, input, action buttons.
  - **DetailsPanel:** Reserved for sources/citations view.

---

## 🔒 Limitations

- **File Size:**  
  Hardcoded front-end limit (4MB); may require lowering for Vercel backend.
- **File Types:**  
  Accepts PDF, CSV, TXT, MD only.
- **Persistence:**  
  Data is local to one browser; clearing storage or cache wipes files and chat.
- **Session Isolation:**  
  Backend must support per-session scoping. Answers may "leak" content from previous sessions unless backend filters by sessionId.
- **Error Handling:**  
  429 (rate limit), 413 (too large), 415 (file type), and 500 errors handled gracefully with user-friendly messages in UI.
- **Browser Compatibility:**  
  Chrome/Edge/Firefox latest recommended.

---

## 📝 Troubleshooting

- **App not deploying on Vercel**  
  - Check that your Vercel project's Root Directory is set to `/rag-notebook` in Project Settings > Build and Deployment.
  - Trigger a redeploy after changing settings.

- **API not returning results**  
  - Confirm backend API is live (visit `/api/upload` and `/api/query` endpoints directly).
  - Check CORS settings in your backend.

- **UI doesn’t update after file upload or question sent**  
  - Open browser console for errors.
  - Confirm `localStorage` is not disabled.

- **Line ending (LF/CRLF) warnings during git operations**  
  - These can be ignored for most cases (related to Windows vs UNIX); do not affect deployment.

---

## 📌 Roadmap

- **Stage 3**: Website Link Ingestion—add a URL field in the UI, backend `/api/scrape-url` endpoint, parse & ingest website content as new source.
- **Stage 4**: Site/mobile crawler support, embedding storage, project summary reporting.
- **Advanced**: Dark mode toggle, animated background (particles), citation chips in chat, accessibility improvements.

---

## 🙏 Credits

- UI inspired by Google’s NotebookLM
- RAG backend architecture reference: [OpenAI Cookbook](https://github.com/openai/openai-cookbook)
- Built by [Your Name or Team], 2025

---

## 🚫 License & Usage

- This codebase is intended for educational and evaluation purposes.  
- For commercial/research use, check each dependency’s license.

---

## 💬 Feedback & Support

For issues and feedback, open an issue in this repo or contact 

---

```

***
