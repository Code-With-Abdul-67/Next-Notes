"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea } from "@nextui-org/react";
import { Pin, Lock, Unlock, Loader2, Save, Eye, EyeOff, Palette } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { NoteColor } from "./NoteCard";

interface Note {
  id: string;
  title: string;
  content: string;
  color?: NoteColor;
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
    color: NoteColor
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
  const [previewMode, setPreviewMode]   = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewNote = !note;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsPinned(note.isPinned);
      setIsLocked(note.isLocked);
      setColor(note.color ?? null);
    } else {
      setTitle("");
      setContent("");
      setIsPinned(false);
      setIsLocked(defaultLocked);
      setColor(null);
    }
    setAutoSaveStatus("idle");
    setPreviewMode(false);
    setShowColorPicker(false);
  }, [note, isOpen, defaultLocked]);

  const triggerAutoSave = useCallback(() => {
    if (isNewNote || !isOpen) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus("saving");
    autoSaveTimer.current = setTimeout(async () => {
      await onSave(note!.id, title, content, isPinned, isLocked, color);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500);
  }, [isNewNote, isOpen, note, title, content, isPinned, isLocked, color, onSave]);

  useEffect(() => {
    if (!isNewNote && isOpen) triggerAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [triggerAutoSave]);

  const handleSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await onSave(note ? note.id : null, title, content, isPinned, isLocked, color);
    onClose();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === color);

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
