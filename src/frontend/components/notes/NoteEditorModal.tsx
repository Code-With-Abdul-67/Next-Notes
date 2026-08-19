"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea } from "@nextui-org/react";
import { Pin, Lock, Unlock, Loader2, Save, Eye, EyeOff, Palette, Download, Tag, X, FileText, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { NoteColor } from "./NoteCard";

interface Note {
  id: string;
  title: string;
  content: string;
  color?: NoteColor;
  tags?: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
}

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  defaultLocked?: boolean;
  onSave: (
    id: string | null,
    title: string,
    content: string,
    isPinned: boolean,
    isLocked: boolean,
    color: NoteColor,
    tags: string
  ) => Promise<void>;
  isSaving: boolean;
}

const COLOR_OPTIONS: { value: NoteColor; label: string; cls: string }[] = [
  { value: null,     label: "None",   cls: "bg-white/10 border-white/20" },
  { value: "red",    label: "Red",    cls: "bg-red-500" },
  { value: "orange", label: "Orange", cls: "bg-orange-500" },
  { value: "yellow", label: "Yellow", cls: "bg-yellow-400" },
  { value: "green",  label: "Green",  cls: "bg-green-500" },
  { value: "blue",   label: "Blue",   cls: "bg-blue-500" },
  { value: "purple", label: "Purple", cls: "bg-purple-500" },
  { value: "pink",   label: "Pink",   cls: "bg-pink-500" },
];

const TEMPLATES: { label: string; icon: string; title: string; content: string }[] = [
  {
    label: "Meeting Notes",
    icon: "📋",
    title: "Meeting Notes",
    content: `## Attendees\n- \n\n## Agenda\n1. \n\n## Notes\n\n\n## Action Items\n- [ ] \n\n## Next Meeting\n`,
  },
  {
    label: "To-Do List",
    icon: "✅",
    title: "To-Do List",
    content: `## Tasks\n- [ ] \n- [ ] \n- [ ] \n\n## In Progress\n- [ ] \n\n## Done\n- [x] `,
  },
  {
    label: "Journal Entry",
    icon: "📓",
    title: "Journal",
    content: `## How I'm feeling\n\n\n## What happened today\n\n\n## Gratitude\n- \n- \n- \n\n## Tomorrow's intention\n`,
  },
  {
    label: "Quick Idea",
    icon: "💡",
    title: "Idea",
    content: `## The Idea\n\n\n## Why it matters\n\n\n## Next steps\n- \n`,
  },
];

const DRAFT_KEY = "note-editor-draft";

function saveDraft(title: string, content: string, tags: string) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, tags, savedAt: Date.now() }));
  } catch { /* localStorage unavailable */ }
}

function loadDraft(): { title: string; content: string; tags: string } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    // Discard drafts older than 7 days
    if (Date.now() - d.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return { title: d.title || "", content: d.content || "", tags: d.tags || "" };
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
}

export default function NoteEditorModal({
  isOpen,
  onClose,
  note,
  defaultLocked = false,
  onSave,
  isSaving,
}: NoteEditorModalProps) {
  const [title, setTitle]               = useState("");
  const [content, setContent]           = useState("");
  const [isPinned, setIsPinned]         = useState(false);
  const [isLocked, setIsLocked]         = useState(false);
  const [color, setColor]               = useState<NoteColor>(null);
  const [tags, setTags]                 = useState<string[]>([]);
  const [tagInput, setTagInput]         = useState("");
  const [previewMode, setPreviewMode]   = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "draft">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewNote = !note;

  // Load note or draft on open
  useEffect(() => {
    setTimeout(() => {
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setIsPinned(note.isPinned);
        setIsLocked(note.isLocked);
        setColor(note.color ?? null);
        setTags(note.tags ? note.tags.split(",").filter(Boolean) : []);
      } else {
        // New note — try to restore draft
        const draft = loadDraft();
        if (draft && (draft.title || draft.content)) {
          setTitle(draft.title);
          setContent(draft.content);
          setTags(draft.tags ? draft.tags.split(",").filter(Boolean) : []);
          setAutoSaveStatus("draft");
          setTimeout(() => setAutoSaveStatus("idle"), 2500);
        } else {
          setTitle("");
          setContent("");
          setTags([]);
        }
        setIsPinned(false);
        setIsLocked(defaultLocked);
        setColor(null);
      }
      setTagInput("");
      setAutoSaveStatus("idle");
      setPreviewMode(false);
      setShowColorPicker(false);
      setShowTemplates(false);
    }, 0);
  }, [note, isOpen, defaultLocked]);

  // Auto-save for existing notes
  const triggerAutoSave = useCallback(() => {
    if (isNewNote || !isOpen) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      await onSave(note!.id, title, content, isPinned, isLocked, color, tags.join(","));
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500);
  }, [isNewNote, isOpen, note, title, content, isPinned, isLocked, color, tags, onSave]);

  useEffect(() => {
    if (!isNewNote && isOpen) triggerAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [triggerAutoSave, isNewNote, isOpen]);

  // Draft auto-save for new notes
  useEffect(() => {
    if (!isNewNote || !isOpen) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      if (title || content) saveDraft(title, content, tags.join(","));
    }, 1000);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [isNewNote, isOpen, title, content, tags]);

  // Ctrl+S to save
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, title, content, isPinned, isLocked, color, tags]);

  async function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    clearDraft();
    await onSave(note ? note.id : null, title, content, isPinned, isLocked, color, tags.join(","));
    onClose();
  }

  const handleAddTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 24);
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleExport = (format: "md" | "txt") => {
    const ext = format === "md" ? "md" : "txt";
    const body = format === "md"
      ? `# ${title || "Untitled"}\n\n${content}`
      : `${title || "Untitled"}\n${"=".repeat((title || "Untitled").length)}\n\n${content}`;
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "note").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyTemplate = (tpl: typeof TEMPLATES[number]) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    setShowTemplates(false);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      size="3xl"
      backdrop="blur"
      classNames={{
        base: "glass-panel border border-white/10 rounded-2xl bg-black/40 text-white max-h-[90vh]",
        header: "border-b border-white/5 py-4",
        footer: "border-t border-white/5 py-3",
        closeButton: "hover:bg-white/5 text-white/50 hover:text-white rounded-full",
        body: "overflow-y-auto",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex justify-between items-center gap-4">
              <span className="font-semibold text-lg">
                {note ? "Edit Note" : "Create Note"}
              </span>
              <div className="flex items-center gap-1.5 mr-6">

                {/* Templates (new notes only) */}
                {isNewNote && (
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Use a template"
                      onClick={() => setShowTemplates((v) => !v)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                        showTemplates ? "text-purple-400 bg-purple-500/10" : "text-white/30 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <FileText size={15} />
                    </button>
                    {showTemplates && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                        <div className="absolute right-0 top-10 z-20 glass-panel border border-white/10 rounded-xl p-1.5 shadow-xl w-44 space-y-0.5">
                          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 pb-1">Templates</p>
                          {TEMPLATES.map((tpl) => (
                            <button
                              key={tpl.label}
                              type="button"
                              onClick={() => applyTemplate(tpl)}
                              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors text-left"
                            >
                              <span>{tpl.icon}</span>
                              <span>{tpl.label}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Export */}
                <div className="relative group/export">
                  <button
                    type="button"
                    aria-label="Export note"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 text-white/30 hover:text-white hover:bg-white/5"
                  >
                    <Download size={15} />
                  </button>
                  <div className="absolute right-0 top-10 z-20 hidden group-hover/export:flex glass-panel border border-white/10 rounded-xl p-1 shadow-xl flex-col w-28">
                    <button
                      type="button"
                      onClick={() => handleExport("md")}
                      className="px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors text-left"
                    >
                      Export as .md
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport("txt")}
                      className="px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors text-left"
                    >
                      Export as .txt
                    </button>
                  </div>
                </div>

                {/* Color picker */}
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Note color"
                    onClick={() => setShowColorPicker((v) => !v)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                      color ? "bg-white/10" : "text-white/30 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {color ? (
                      <span className={`w-3.5 h-3.5 rounded-full ${COLOR_OPTIONS.find(c => c.value === color)?.cls}`} />
                    ) : (
                      <Palette size={15} />
                    )}
                  </button>
                  {showColorPicker && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
                      <div className="absolute right-0 top-10 z-20 glass-panel border border-white/10 rounded-xl p-2.5 shadow-xl flex gap-1.5 flex-wrap w-[168px]">
                        {COLOR_OPTIONS.map((opt) => (
                          <button
                            key={String(opt.value)}
                            type="button"
                            aria-label={opt.label}
                            onClick={() => { setColor(opt.value); setShowColorPicker(false); }}
                            className={`w-7 h-7 rounded-lg border-2 transition-all duration-150 ${opt.cls} ${
                              color === opt.value ? "border-white scale-110" : "border-transparent hover:scale-105"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Preview toggle */}
                <button
                  type="button"
                  aria-label={previewMode ? "Edit mode" : "Preview markdown"}
                  onClick={() => setPreviewMode((v) => !v)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                    previewMode ? "text-purple-400 bg-purple-500/10" : "text-white/30 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {previewMode ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>

                {/* Pin */}
                <button
                  type="button"
                  aria-label={isPinned ? "Unpin Note" : "Pin Note"}
                  onClick={() => setIsPinned(!isPinned)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                    isPinned ? "text-purple-400 bg-purple-500/10" : "text-white/30 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                </button>

                {/* Lock */}
                <button
                  type="button"
                  aria-label={isLocked ? "Unlock Note" : "Lock Note"}
                  onClick={() => setIsLocked(!isLocked)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                    isLocked ? "text-amber-400 bg-amber-500/10" : "text-white/30 hover:text-amber-400 hover:bg-amber-500/10"
                  }`}
                >
                  {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>
              </div>
            </ModalHeader>

            <ModalBody className="py-6 gap-4">
              <Input
                label="Title"
                placeholder="Enter note title..."
                variant="flat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                classNames={{
                  inputWrapper: "glass-input text-white",
                  input: "text-white text-base font-semibold placeholder:text-white/30",
                  label: "text-purple-300/70",
                }}
              />

              {/* Tags input */}
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl glass-input min-h-[40px]">
                <Tag size={13} className="text-white/30 shrink-0" />
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-[11px] text-purple-300 font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove tag ${tag}`}
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="text-purple-400/60 hover:text-purple-300 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput && handleAddTag(tagInput)}
                  placeholder={tags.length === 0 ? "Add tags (press Enter or comma)…" : ""}
                  className="flex-1 min-w-[120px] bg-transparent text-xs text-white/70 placeholder:text-white/20 outline-none"
                  maxLength={25}
                />
              </div>

              {previewMode ? (
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                  {content ? (
                    <div className="prose prose-invert prose-sm max-w-none
                      prose-headings:text-white prose-headings:font-bold
                      prose-p:text-white/75 prose-p:leading-relaxed
                      prose-strong:text-white prose-em:text-white/80
                      prose-code:text-purple-300 prose-code:bg-purple-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                      prose-blockquote:border-l-purple-500 prose-blockquote:text-white/60
                      prose-ul:text-white/75 prose-ol:text-white/75
                      prose-li:marker:text-purple-400
                      prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                      prose-hr:border-white/10
                      prose-table:text-white/75 prose-th:text-white prose-th:border-white/10 prose-td:border-white/10">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-white/20 text-sm italic">Nothing to preview yet…</p>
                  )}
                </div>
              ) : (
                <Textarea
                  label="Note Content"
                  placeholder={`Type your notes here… Markdown is supported.\n\n# Heading\n**bold** *italic* \`code\`\n- list item`}
                  variant="flat"
                  minRows={10}
                  maxRows={18}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  classNames={{
                    inputWrapper: "glass-input text-white",
                    input: "text-white text-sm placeholder:text-white/20 leading-relaxed font-mono",
                    label: "text-purple-300/70",
                  }}
                />
              )}

              {/* Word / char count + markdown hint */}
              <div className="flex items-center justify-between text-[11px] text-white/30">
                <span className="text-white/20">
                  {previewMode ? "Preview mode" : "Markdown supported"}
                </span>
                <div className="flex items-center gap-3">
                  <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                  <span>·</span>
                  <span>{charCount} {charCount === 1 ? "char" : "chars"}</span>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="flex justify-between items-center">
              <span className="text-xs text-white/40">
                {autoSaveStatus === "saving" || isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-purple-400" />
                    <span>Saving…</span>
                  </span>
                ) : autoSaveStatus === "saved" ? (
                  <span className="text-green-400/70">✓ Saved</span>
                ) : autoSaveStatus === "draft" ? (
                  <span className="text-amber-400/70">Draft restored</span>
                ) : (
                  <span className="text-white/20">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-sheen px-4 h-9 rounded-xl text-sm font-semibold text-white/60 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-sheen px-4 h-9 rounded-xl text-sm font-semibold text-white bg-primary shadow-lg shadow-purple-500/20 hover:brightness-110 hover:shadow-purple-500/40 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save Note
                </button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
