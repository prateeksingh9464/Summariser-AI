"use client";

import { useState, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Link2,
  FileText,
  Sparkles,
  Clipboard,
  Download,
  Moon,
  Sun,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [urlInput, setUrlInput] = useState("");
  const [rawText, setRawText] = useState("");
  const [length, setLength] = useState<"brief" | "balanced" | "detailed">("balanced");
  const [tone, setTone] = useState<"technical" | "explanatory" | "actionable">("actionable");
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [apiStatus, setApiStatus] = useState({ google: false, jina: false });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    } else {
      setTheme("dark");
      document.documentElement.classList.remove("light");
    }

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setApiStatus({ google: data.googleConfigured, jina: data.jinaConfigured });
        }
      } catch {
        setApiStatus({ google: false, jina: false });
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      setTheme("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/summarize",
    onError: (err) => {
      try {
        const parsed = JSON.parse(err.message);
        toast.error(parsed.error || "Failed to generate summary");
      } catch {
        toast.error(err.message || "Failed to generate summary");
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "url") {
      if (!urlInput.trim()) {
        toast.error("Please enter a URL");
        return;
      }
    } else {
      if (rawText.trim().length < 10) {
        toast.error("Text is too short to summarize");
        return;
      }
    }

    try {
      await complete("", {
        body: {
          url: activeTab === "url" ? urlInput.trim() : "",
          text: activeTab === "text" ? rawText.trim() : "",
          length,
          tone
        }
      });
      toast.success("Summary generation started!");
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  const copyToClipboard = () => {
    if (!completion) return;
    navigator.clipboard.writeText(completion);
    toast.success("Summary copied to clipboard!");
  };

  const downloadSummary = () => {
    if (!completion) return;
    const blob = new Blob([completion], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded as .txt!");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 select-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mouseCoords.x}px ${mouseCoords.y}px, var(--glass-glow-from), transparent 80%)`
        }}
      />
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] z-0 h-[60%] w-[60%] rounded-full bg-purple-500/10 glow-bg" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] z-0 h-[60%] w-[60%] rounded-full bg-blue-500/10 glow-bg" />

      <header className="relative z-10 border-b border-border bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 p-0.5 shadow-lg shadow-purple-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-white dark:to-slate-400">
              DISTILL
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:scale-105"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:scale-105"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="text-center mb-16">
          <h1 className="bg-gradient-to-r from-purple-400 via-sky-400 to-indigo-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            Distill the Web
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Instantly transform long articles, blog posts, and raw text into clear, high-density bullet points.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="glass-card glass-card-glow lg:col-span-2 rounded-2xl p-6 shadow-xl">
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => setActiveTab("url")}
                className={`flex items-center space-x-2 pb-3 px-4 font-semibold transition-all ${
                  activeTab === "url"
                    ? "border-b-2 border-purple-500 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="h-4 w-4" />
                <span>Paste URL</span>
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`flex items-center space-x-2 pb-3 px-4 font-semibold transition-all ${
                  activeTab === "text"
                    ? "border-b-2 border-purple-500 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Raw Text</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === "url" ? (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                      Article URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/blog/great-article"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                      Source Text
                    </label>
                    <textarea
                      placeholder="Paste your content here to summarize..."
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={8}
                      className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-y"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3.5 px-6 font-semibold text-white transition-all hover:opacity-95 focus:outline-none disabled:opacity-50 group hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-purple-500/10 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Processing Content...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 text-purple-200 group-hover:animate-pulse" />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="glass-card glass-card-glow rounded-2xl p-6 shadow-xl">
              <h3 className="flex items-center space-x-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Configuration</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Summary Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["brief", "balanced", "detailed"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLength(l)}
                        className={`rounded-lg py-2 text-xs font-medium border capitalize transition-all cursor-pointer ${
                          length === l
                            ? "bg-purple-500/10 border-purple-500 text-purple-400"
                            : "border-border bg-background/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Tone & Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["technical", "explanatory", "actionable"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`rounded-lg py-2 text-xs font-medium border capitalize transition-all cursor-pointer ${
                          tone === t
                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                            : "border-border bg-background/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card glass-card-glow rounded-2xl p-6 shadow-xl">
              <h3 className="flex items-center space-x-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
                <KeyRound className="h-4 w-4 text-sky-400" />
                <span>System Status</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gemini API Key</span>
                  <div className="flex items-center space-x-1.5">
                    {apiStatus.google ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400 font-medium text-xs">Connected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-500 font-medium text-xs">Unset (Local env)</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jina Reader API</span>
                  <div className="flex items-center space-x-1.5">
                    {apiStatus.jina ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400 font-medium text-xs">Auth Connected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-sky-400" />
                        <span className="text-sky-400 font-medium text-xs">Free Tier</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {completion && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <div className="glass-card glass-card-glow rounded-2xl p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 mb-6 gap-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
                    <h2 className="text-lg font-bold">Generated Summary</h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2 rounded-lg border border-border bg-background/50 px-3.5 py-2 text-sm font-medium transition-all hover:scale-105 cursor-pointer text-foreground hover:bg-background"
                    >
                      <Clipboard className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={downloadSummary}
                      className="flex items-center space-x-2 rounded-lg border border-border bg-background/50 px-3.5 py-2 text-sm font-medium transition-all hover:scale-105 cursor-pointer text-foreground hover:bg-background"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{completion}</ReactMarkdown>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
