import React, { useCallback, useRef, useState, useEffect } from "react";
import { uploadFile, askQuestion } from "./utils/apiClient";

const API_BASE = "https://mynk-rag-api.vercel.app";

// Upload schema: your API worked with a single file under "file"
const UPLOAD_SCHEMA = "A";

// LocalStorage keys
const LS_CHAT = "chat";
const LS_FILES = "files";
const LS_SESSION = "rag-sessionId";

// Helpers
function classNames(...c) {
  return c.filter(Boolean).join(" ");
}
const makeId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));

function Header() {
  return (
    <header className="h-14 border-b bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-indigo-600" />
          <h1 className="text-xl font-semibold tracking-tight">RAG Notebook</h1>
        </div>
        <div className="text-sm text-gray-500">NotebookLM-style UI</div>
      </div>
    </header>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin text-indigo-600" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Sidebar({ files, onRemove }) {
  return (
    <aside className="w-72 shrink-0 border-r bg-white">
      <div className="p-4 border-b">
        <h2 className="text-sm font-medium text-gray-700">Sources</h2>
        <p className="text-xs text-gray-500 mt-1">Manage uploaded files used for answers.</p>
      </div>
      <div className="p-4 space-y-3">
        {files.length === 0 ? (
          <div className="text-sm text-gray-500">No files uploaded yet.</div>
        ) : (
          <ul className="space-y-2">
            {files.map((f, idx) => (
              <li key={f.id || f.name + idx} className="group flex items-center justify-between rounded border bg-white px-3 py-2 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  {f.size != null && <p className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)}KB</p>}
                </div>
                <button onClick={() => onRemove(f)} className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function Dropzone({ onFiles, isUploading }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const dt = e.dataTransfer;
      const files = dt?.files ? Array.from(dt.files) : [];
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const onSelect = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) onFiles(files);
    e.target.value = null;
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={classNames(
        "relative rounded-lg border-2 border-dashed p-6 text-center transition",
        dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white"
      )}
    >
      <input ref={inputRef} type="file" accept=".pdf,.csv,.txt,.md,.mdx" className="hidden" multiple onChange={onSelect} />
      <div className="flex flex-col items-center gap-2">
        <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center">⬆️</div>
        <p className="text-sm">
          Drag & drop files here, or{" "}
          <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()} className="text-indigo-600 font-medium hover:underline disabled:opacity-50">
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">Accepted: PDF, CSV, TXT, MD. Upload multiple at once.</p>
      </div>
      {isUploading && (
        <div className="absolute inset-0 bg-white/70 grid place-items-center rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Spinner />
            <span>Uploading…</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatMessage({ role, content, sources }) {
  return (
    <div className={(role === "user" ? "bg-white" : "bg-gray-50") + " rounded-xl px-4 py-3 border"}>
      <div className="flex items-center gap-2 mb-1">
        <div className={(role === "user" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800") + " size-6 rounded-full grid place-items-center text-[10px] font-semibold"}>
          {role === "user" ? "U" : "AI"}
        </div>
        <span className="text-[11px] uppercase tracking-wide text-gray-500">{role === "user" ? "You" : "Assistant"}</span>
      </div>
      <div className="text-[13px] leading-6 text-gray-800 whitespace-pre-wrap">{content}</div>
      {Array.isArray(sources) && sources.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] text-gray-500 mb-1">Sources</p>
          <ul className="flex flex-wrap gap-2">
            {sources.map((s, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                {typeof s === "string" ? s : s && s.name ? s.name : `Source ${i + 1}`}
              </span>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    onSend(q);
    setValue("");
    textareaRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = value.trim();
      if (!q) return;
      onSend(q);
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-3 flex items-end gap-2">
      <textarea
        ref={textareaRef}
        className="min-h-[44px] max-h-40 flex-1 resize-y rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Ask about your sources…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        Send
      </button>
    </form>
  );
}

function DetailsPanel() {
  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="rounded-lg border bg-white p-4 sticky top-20">
        <h3 className="text-sm font-medium text-gray-700">Details</h3>
        <p className="text-xs text-gray-500 mt-1">This panel can show message context, citations, or studio outputs.</p>
      </div>
    </aside>
  );
}

export default function App() {
  // Session
  const [sessionId, setSessionId] = useState(() => {
    let id = localStorage.getItem(LS_SESSION);
    if (!id) {
      id = makeId();
      localStorage.setItem(LS_SESSION, id);
    }
    return id;
  });

  // Upload state (load from LS synchronously)
  const [files, setFiles] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_FILES) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [uploading, setUploading] = useState(false);

  // Chat state (load from LS synchronously)
  const [chat, setChat] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_CHAT) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  // Global error
  const [error, setError] = useState(null);

  // Persist on change (guarded)
  useEffect(() => {
    try {
      if (Array.isArray(chat)) localStorage.setItem(LS_CHAT, JSON.stringify(chat));
    } catch {}
  }, [chat]);

  useEffect(() => {
    try {
      if (Array.isArray(files)) localStorage.setItem(LS_FILES, JSON.stringify(files));
    } catch {}
  }, [files]);

  useEffect(() => {
    try {
      if (sessionId) localStorage.setItem(LS_SESSION, sessionId);
    } catch {}
  }, [sessionId]);

  const removeFile = (f) => {
    setFiles((prev) => prev.filter((x) => (x.id || x.name) !== (f.id || f.name)));
  };

  const handleNewSession = () => {
    setChat([]);
    setFiles([]);
    try {
      localStorage.removeItem(LS_CHAT);
      localStorage.removeItem(LS_FILES);
      const newId = makeId();
      setSessionId(newId);
      localStorage.setItem(LS_SESSION, newId);
    } catch {}
  };

  const okType = (f) => {
    const allowed = ["application/pdf", "text/csv", "text/plain", "text/markdown", "application/vnd.ms-excel", ""];
    if (allowed.includes(f.type)) return true;
    const n = f.name.toLowerCase();
    return n.endsWith(".pdf") || n.endsWith(".csv") || n.endsWith(".txt") || n.endsWith(".md") || n.endsWith(".mdx");
  };

  // Upload multiple files sequentially (key: "file")
  const handleFiles = useCallback(async (picked) => {
  setError(null);
  if (!picked?.length) return;

  const MAX = 4 * 1024 * 1024;
  for (const f of picked) {
    if (!okType(f)) {
      setError(`Invalid file type for "${f.name}". Accepted: PDF, CSV, TXT, MD.`);
      return;
    }
    if (f.size > MAX) {
      setError(`"${f.name}" is larger than ${MAX / (1024 * 1024)}MB. Please upload a smaller file.`);
      return;
    }
  }

  setUploading(true);
  try {
    const uploadedItems = [];

    for (let i = 0; i < picked.length; i++) {
      const f = picked[i];
      await uploadFile(f, sessionId);

      uploadedItems.push({ id: f.name + "-" + Date.now() + "-" + i, name: f.name, size: f.size });
    }

    setFiles((prev) => [...prev, ...uploadedItems]);
  } catch (e) {
    setError(e.message || "Upload error");
  } finally {
    setUploading(false);
  }
}, [sessionId]);

  const addMessage = (m) => setChat((prev) => [...prev, m]);

  const handleAsk = useCallback(async (question) => {
  setError(null);
  addMessage({ role: "user", content: question });
  setLoadingAnswer(true);

  try {
    const data = await askQuestion(question, sessionId, files.map((f) => f.name));

    const answer = data.answer || data.response || data.output || data.message || "No answer field found in response.";
    const sources = data.sources || data.citations || [];

    addMessage({ role: "assistant", content: answer, sources });
  } catch (e) {
    setError(e.message || "Query error");
    addMessage({ role: "assistant", content: "Sorry, I ran into an error fetching the answer." });
  } finally {
    setLoadingAnswer(false);
  }
}, [files, sessionId]);

  // Auto-scroll chat
  const chatRef = useRef(null);
  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat, loadingAnswer]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto w-full flex gap-0 md:gap-6 px-0 md:px-6 py-4">
        <Sidebar files={files} onRemove={removeFile} />
        <main className="flex-1 flex flex-col gap-4">
          <div className="px-4">
            <Dropzone onFiles={handleFiles} isUploading={uploading} />
            {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>}
          </div>

          <section className="flex-1 flex flex-col rounded-lg border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-700">Chat</h2>
                <p className="text-xs text-gray-500">Ask questions grounded in your uploaded sources.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setChat([])} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50" title="Clear chat">
                  New Chat
                </button>
                <button onClick={handleNewSession} className="text-xs rounded-md border px-2 py-1 hover:bg-red-50 text-red-600" title="Clear chat, files, and start new session">
                  New Session
                </button>
              </div>
            </div>

            <div ref={chatRef} className="flex-1 overflow-auto px-3 sm:px-4 py-4 space-y-3">
              {chat.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Start by uploading files, then ask:
                  <span className="ml-1 font-medium text-gray-700">“Summarize the main points from the documents.”</span>
                </div>
              ) : (
                chat.map((m, i) => <ChatMessage key={i} role={m.role} content={m.content} sources={m.sources} />)
              )}
              {loadingAnswer && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Spinner />
                  Generating answer…
                </div>
              )}
            </div>

            <ChatInput onSend={handleAsk} disabled={uploading || loadingAnswer} />
          </section>
        </main>

        <DetailsPanel />
      </div>
    </div>
  );
}