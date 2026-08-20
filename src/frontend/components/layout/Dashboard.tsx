"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useIsMac } from "@/frontend/lib/useIsMac";

import { Input } from "@nextui-org/react";
import CustomSpinner from "@/frontend/components/ui/CustomSpinner";
import { Search, FileText, Trash2, Lock, Trash, Plus, LockKeyhole, ArrowUpDown, Tag, X, CheckSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/frontend/components/layout/Sidebar";
import NoteCard from "@/frontend/components/notes/NoteCard";
import type { NoteColor } from "@/frontend/components/notes/NoteCard";
import NoteEditorModal from "@/frontend/components/notes/NoteEditorModal";
import VaultLock from "@/frontend/components/vault/VaultLock";
import VaultUnlockModal from "@/frontend/components/vault/VaultUnlockModal";
import InstallPrompt from "@/frontend/components/layout/InstallPrompt";
import ConfirmationModal from "@/frontend/components/ui/ConfirmationModal";
import Toast, { useToast } from "@/frontend/components/ui/Toast";
import SessionGuard from "@/frontend/components/layout/SessionGuard";
import ShortcutsModal from "@/frontend/components/ui/ShortcutsModal";
import CommandPalette from "@/frontend/components/ui/CommandPalette";

import SettingsModal from "@/frontend/components/ui/SettingsModal";
import TodoList from "@/frontend/components/todos/TodoList";
import { encryptNote, decryptNote } from "@/frontend/lib/crypto";

type SortOption = "updated" | "created" | "title";

interface Note {
  id: string;
  title: string;
  content: string;
  color?: NoteColor;
  tags?: string;
  encryptedData?: string | null;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  updatedAt: string;
  createdAt?: string;
}

export default function Dashboard() {
  const { data: session, update: updateSession } = useSession();
  const isMac = useIsMac();
  const [currentView, setCurrentView] = useState<"all" | "vault" | "bin" | "todos">("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletedTodos, setDeletedTodos] = useState<{ id: string; title: string; description?: string | null; priority: string; isCompleted: boolean; createdAt?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    if (session?.user?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);


  // Vault
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [hasVaultPassword, setHasVaultPassword] = useState(false);
  const [vaultChecked, setVaultChecked] = useState(false);
  const vaultPasswordRef = useRef<string | null>(null);
  const [vaultUnlockModalOpen, setVaultUnlockModalOpen] = useState(false);
  const pendingVaultLockRef = useRef<{ id: string; title: string; content: string } | null>(null);

  const setVaultPasswordSync = (pwd: string | null) => {
    vaultPasswordRef.current = pwd;
  };

  const { toasts, addToast, removeToast } = useToast();

  const [confirmAction, setConfirmAction] = useState<{
    type: "vault" | "unlock" | "bin" | "delete" | "deleteVault" | "deleteAccount" | "emptyBin";
    id: string;
    currentVal?: boolean;
  } | null>(null);

  const [lockVaultConfirm, setLockVaultConfirm] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("updated");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");

  const handleNewNote = useCallback(() => { setEditingNote(null); setEditorOpen(true); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "V") {
        e.preventDefault();
        handleViewChange("vault");
      }
      if (e.key === "?" && !isTyping) {
        setShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNewNote]);


  const userId = (session?.user as { id?: string })?.id as string | undefined;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const checkVault = async () => {
      try {
        const res = await fetch("/api/vault/status");
        if (res.status === 401) return;
        if (!res.ok) {
          if (!cancelled) { setHasVaultPassword(false); setVaultChecked(true); }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setHasVaultPassword(data.hasVaultPassword === true);
          setVaultChecked(true);
        }
      } catch {
        if (!cancelled) { setHasVaultPassword(false); setVaultChecked(true); }
      }
    };
    checkVault();
    return () => { cancelled = true; };
  }, [userId]);

  const fetchNotes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentView === "bin") params.set("trash", "true");
      if (currentView === "vault") params.set("vault", "true");
      // Server-side search only for non-vault views
      if (debouncedQuery && currentView !== "vault") params.set("search", debouncedQuery);
      // Server-side tag filter for non-vault views
      if (activeTag && currentView !== "vault") params.set("tag", activeTag);

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (!res.ok) {
        addToast("error", "Failed to load notes. Please refresh.");
        return;
      }
      const data: Note[] = await res.json();

      if (currentView === "vault" && vaultPasswordRef.current) {
        const decrypted = await Promise.all(
          data.map(async (note) => {
            if (note.isLocked && note.encryptedData) {
              try {
                const { title, content } = await decryptNote(note.encryptedData, vaultPasswordRef.current!);
                return { ...note, title, content };
              } catch {
                return { ...note, title: "⚠️ Decryption failed", content: "" };
              }
            }
            return note;
          })
        );
        setNotes(decrypted);
      } else {
        setNotes(data);
      }
    } catch {
      addToast("error", "Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, debouncedQuery, activeTag]);

  // Fetch deleted todos when entering bin view
  useEffect(() => {
    if (currentView !== "bin") { setDeletedTodos([]); return; }
    fetch("/api/todos?trash=true")
      .then((r) => r.json())
      .then((data) => setDeletedTodos(Array.isArray(data) ? data : []))
      .catch(() => setDeletedTodos([]));
  }, [currentView]);

  const handleRestoreTodo = async (id: string) => {
    setDeletedTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDeleted: false }),
    });
  };

  const handleDeleteTodoPermanent = async (id: string) => {
    setDeletedTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  };

  useEffect(() => {
    if (!userId) return;
    if (currentView === "vault" && !vaultUnlocked) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes();
  }, [userId, currentView, debouncedQuery, activeTag, vaultUnlocked, fetchNotes]);

  const handleSaveNote = async (
    id: string | null,
    title: string,
    content: string,
    isPinned: boolean,
    isLocked: boolean,
    color: NoteColor,
    tags: string
  ) => {
    setIsSaving(true);
    try {
      const pwd = vaultPasswordRef.current;
      let encryptedData: string | null = null;
      let storedTitle = title;
      let storedContent = content;

      if (isLocked && pwd) {
        encryptedData = await encryptNote(title, content, pwd);
        storedTitle = "";
        storedContent = "";
      } else if (isLocked && !pwd) {
        addToast("error", "Vault is locked. Cannot save encrypted note.");
        setIsSaving(false);
        return;
      }

      const payload = { title: storedTitle, content: storedContent, encryptedData, isPinned, isLocked, color, tags };
      const res = await fetch(id ? `/api/notes/${id}` : "/api/notes", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast("error", data.error || "Failed to save note.");
        return;
      }
      const saved = await res.json().catch(() => null);
      if (id && saved) {
        // Update the note in-place — no loading flash, modal stays open for auto-save
        setNotes((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  title: saved.title ?? storedTitle,
                  content: saved.content ?? storedContent,
                  isPinned: saved.isPinned ?? isPinned,
                  isLocked: saved.isLocked ?? isLocked,
                  color: saved.color ?? color,
                  tags: saved.tags ?? tags,
                  updatedAt: saved.updatedAt ?? n.updatedAt,
                }
              : n
          )
        );
      } else {
        // New note — silent fetch so no loading spinner interrupts the UI
        fetchNotes(true);
      }
    } catch {
      addToast("error", "Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinToggle = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentVal }),
      });
      if (!res.ok) { addToast("error", "Failed to update note"); return; }
      fetchNotes();
    } catch {
      addToast("error", "Failed to update note");
    }
  };

  const executeLockToggle = async (id: string, currentVal: boolean) => {
    try {
      const movingToVault = !currentVal;
      const pwd = vaultPasswordRef.current;

      if (movingToVault && pwd) {
        const note = notes.find((n) => n.id === id);
        if (note) {
          const encryptedData = await encryptNote(note.title, note.content, pwd);
          const res = await fetch(`/api/notes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "", content: "", encryptedData, isLocked: true }),
          });
          if (!res.ok) { addToast("error", "Failed to move note to vault"); return; }
          fetchNotes();
          return;
        }
      }

      if (!movingToVault) {
        const note = notes.find((n) => n.id === id);
        if (note && pwd && note.encryptedData) {
          try {
            const { title, content } = await decryptNote(note.encryptedData, pwd);
            const res = await fetch(`/api/notes/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, content, encryptedData: null, isLocked: false }),
            });
            if (!res.ok) { addToast("error", "Failed to remove note from vault"); return; }
            fetchNotes();
            return;
          } catch {
            addToast("error", "Failed to decrypt note");
            return;
          }
        }
      }

      if (movingToVault) { addToast("error", "Vault is locked"); return; }
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: false }),
      });
      fetchNotes();
    } catch {
      addToast("error", "Failed to update note");
    }
  };

  const handleLockToggle = (id: string, currentVal: boolean) => {
    if (!currentVal) {
      if (!hasVaultPassword) { handleViewChange("vault"); return; }
      if (!vaultPasswordRef.current) {
        const note = notes.find((n) => n.id === id);
        if (note) pendingVaultLockRef.current = { id: note.id, title: note.title, content: note.content };
        setVaultUnlockModalOpen(true);
        return;
      }
      setConfirmAction({ type: "vault", id, currentVal });
    } else {
      setConfirmAction({ type: "unlock", id, currentVal });
    }
  };

  const executeDeleteToggle = async (id: string, currentVal: boolean) => {
    try {
      const movingToBin = !currentVal;
      const note = notes.find((n) => n.id === id);
      const isVaultNote = note?.isLocked ?? false;

      if (movingToBin && isVaultNote) {
        const pwd = vaultPasswordRef.current;
        if (pwd && note?.encryptedData) {
          try {
            const { title, content } = await decryptNote(note.encryptedData, pwd);
            await fetch(`/api/notes/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, content, encryptedData: null, isLocked: false, isDeleted: true }),
            });
            fetchNotes();
            return;
          } catch { /* fall through */ }
        }
        await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isLocked: false, isDeleted: true }),
        });
      } else {
        await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDeleted: !currentVal }),
        });
      }
      fetchNotes();
    } catch {
      addToast("error", "Failed to update note");
    }
  };

  const handleDeleteToggle = (id: string, currentVal: boolean) => {
    if (!currentVal) setConfirmAction({ type: "bin", id, currentVal });
    else executeDeleteToggle(id, currentVal);
  };

  const handleDeletePermanent = (id: string) => setConfirmAction({ type: "delete", id });

  const executeDeletePermanent = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) { addToast("error", "Failed to delete note"); return; }
      fetchNotes();
    } catch {
      addToast("error", "Failed to delete note");
    }
  };

  const executeEmptyBin = async () => {
    try {
      const res = await fetch("/api/notes/empty-bin", { method: "DELETE" });
      if (!res.ok) { addToast("error", "Failed to empty bin"); return; }
      // Also permanently delete all soft-deleted todos
      await Promise.all(
        deletedTodos.map((t) => fetch(`/api/todos/${t.id}`, { method: "DELETE" }))
      );
      setDeletedTodos([]);
      fetchNotes();
    } catch {
      addToast("error", "Failed to empty bin");
    }
  };

  const handleDeleteVault = () => setConfirmAction({ type: "deleteVault", id: "" });
  const handleDeleteAccount = () => setConfirmAction({ type: "deleteAccount", id: "" });
  const handleEmptyBin = () => setConfirmAction({ type: "emptyBin", id: "" });

  const handleLockVault = () => {
    setVaultUnlocked(false);
    setVaultPasswordSync(null);
    if (currentView === "vault") setCurrentView("all");
  };

  // Export note from card (quick export as .md)
  const handleCardExport = (id: string, format: "md" | "txt") => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const ext = format;
    const body = format === "md"
      ? `# ${note.title || "Untitled"}\n\n${note.content}`
      : `${note.title || "Untitled"}\n${"=".repeat((note.title || "Untitled").length)}\n\n${note.content}`;
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(note.title || "note").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", `Exported as .${ext}`);
  };

  // Vault auto-lock after 10 minutes of inactivity
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_MS = 10 * 60 * 1000;

  const resetInactivityTimer = useCallback(() => {
    if (!vaultUnlocked) return;
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setVaultUnlocked(false);
      setVaultPasswordSync(null);
      if (currentView === "vault") setCurrentView("all");
      addToast("vault", "Vault locked due to inactivity");
    }, INACTIVITY_MS);
  }, [vaultUnlocked, currentView, addToast, INACTIVITY_MS]);

  useEffect(() => {
    if (!vaultUnlocked) return;
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [vaultUnlocked, resetInactivityTimer]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}/duplicate`, { method: "POST" });
      if (res.ok) { addToast("duplicate", "Note duplicated"); fetchNotes(); }
      else { const d = await res.json(); addToast("error", d.error || "Failed to duplicate note"); }
    } catch { addToast("error", "Failed to duplicate note"); }
  };

  const handleEditNote = (note: Note) => { setEditingNote(note); setEditorOpen(true); };
  function handleViewChange(view: "all" | "vault" | "bin" | "todos") {
    setCurrentView(view);
    setSearchQuery("");
    setActiveTag(null);
    setVaultSearchQuery("");
  }

  const handleUpdateNoteTags = async (noteId: string, newTags: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) { addToast("error", "Failed to move note"); return; }
      fetchNotes();
    } catch {
      addToast("error", "Failed to move note");
    }
  };

  // Collect all unique tags from current notes (for tag filter bar)
  const allTags = Array.from(
    new Set(
      notes
        .flatMap((n) => (n.tags ? n.tags.split(",").filter(Boolean) : []))
    )
  );

  // Client-side vault search filter
  const displayedNotes = currentView === "vault" && vaultSearchQuery
    ? notes.filter((n) => {
        const q = vaultSearchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
        );
      })
    : notes;

  const viewConfig = {
    all:   { title: "All Notes",    icon: FileText,    iconColor: "text-blue-400",    emptyText: "No notes yet. Create your first note!" },
    todos: { title: "To-Do Lists",  icon: CheckSquare, iconColor: "text-emerald-400", emptyText: "No tasks found." },
    vault: { title: "Secret Vault", icon: Lock,        iconColor: "text-amber-400",   emptyText: "Your vault is empty. Lock notes to keep them private." },
    bin:   { title: "Recycle Bin",  icon: Trash2,      iconColor: "text-red-400",     emptyText: "Recycle bin is empty." },
  };

  const sortedNotes = [...displayedNotes].sort((a, b) => {
    if (sortOption === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortOption === "created") return new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime();
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const pinnedNotes = sortedNotes.filter((n) => n.isPinned);
  const unpinnedNotes = sortedNotes.filter((n) => !n.isPinned);
  const hasPinnedDivider = pinnedNotes.length > 0 && unpinnedNotes.length > 0 && currentView !== "bin";
  const ViewIcon = viewConfig[currentView].icon;

  // Note counts for sidebar
  const noteCounts: { all: number; vault: number; bin: number; todos?: number } = { all: 0, vault: 0, bin: 0 };
  if (currentView === "all") noteCounts.all = notes.length;
  else if (currentView === "vault") noteCounts.vault = notes.length;
  else if (currentView === "bin") noteCounts.bin = notes.length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewNote={handleNewNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasVaultPassword={hasVaultPassword}
        onDeleteVault={handleDeleteVault}
        onDeleteAccount={handleDeleteAccount}
        user={{ name: userName || session?.user?.name, email: session?.user?.email }}
        noteCounts={noteCounts}
      />


      <main className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <ViewIcon size={22} className={viewConfig[currentView].iconColor} />
              <h1 className="text-xl font-bold text-white">{viewConfig[currentView].title}</h1>
              {!loading && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-medium">
                  {displayedNotes.length}
                </span>
              )}
              {currentView === "vault" && vaultUnlocked && (
                <button onClick={() => setLockVaultConfirm(true)}
                  className="group relative overflow-hidden ml-2 flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 transition-all duration-200 hover:bg-amber-500/20 hover:border-amber-500/40">
                  <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-amber-400/[0.15] to-transparent skew-x-12 transform -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
                  </div>
                  <LockKeyhole size={13} className="relative z-10" />
                  <span className="relative z-10">Lock Vault</span>
                </button>
              )}
              {currentView === "bin" && !loading && (notes.length > 0 || deletedTodos.length > 0) && (
                <button onClick={handleEmptyBin}
                  className="group relative overflow-hidden ml-2 flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/40">
                  <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-red-400/[0.15] to-transparent skew-x-12 transform -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
                  </div>
                  <Trash size={13} className="relative z-10" />
                  <span className="relative z-10">Empty Bin</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Unified search bar — the single focal point of the header */}
              {currentView !== "vault" && (
                <div className="relative flex items-center w-full sm:w-80">
                  {/* Sort — quiet icon tucked left of search, only on note views */}
                  {currentView !== "bin" && currentView !== "todos" && (
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setShowSortMenu((v) => !v)}
                        title="Sort"
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      {showSortMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                          <div className="absolute left-0 top-12 z-20 glass-panel border border-white/10 rounded-xl p-1 min-w-[150px] shadow-xl">
                            {(["updated", "created", "title"] as SortOption[]).map((opt) => (
                              <button key={opt} onClick={() => { setSortOption(opt); setShowSortMenu(false); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortOption === opt ? "text-purple-300 bg-purple-500/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                                {opt === "updated" ? "Last edited" : opt === "created" ? "Date created" : "Title A–Z"}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Input
                    placeholder={currentView === "todos" ? "Search notes..." : "Search notes..."}
                    variant="flat"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    classNames={{
                      inputWrapper: `glass-input h-10 ${currentView !== "bin" && currentView !== "todos" ? "pl-8" : ""}`,
                      input: "text-white text-sm placeholder:text-white/25",
                    }}
                  />

                  {/* ⌘K hint — opens command palette, lives inside search bar right edge */}
                  <button
                    onClick={() => setIsCommandPaletteOpen(true)}
                    title={`Command Palette (${isMac ? "⌘" : "Ctrl"}+K)`}
                    className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-white/20 bg-white/[0.04] border border-white/[0.06] hover:text-white/50 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-150 cursor-pointer z-10"
                  >
                    {isMac ? "⌘" : "Ctrl"} K
                  </button>
                </div>
              )}

              {/* Vault search — shown when vault is unlocked */}
              {currentView === "vault" && vaultUnlocked && (
                <div className="relative flex items-center w-full sm:w-80">
                  <Input
                    placeholder="Search vault..."
                    variant="flat"
                    value={vaultSearchQuery}
                    onChange={(e) => setVaultSearchQuery(e.target.value)}
                    startContent={<Search size={14} className="text-white/25" />}
                    classNames={{
                      inputWrapper: "glass-input h-10",
                      input: "text-white text-sm placeholder:text-white/25",
                    }}
                  />
                  <button
                    onClick={() => setIsCommandPaletteOpen(true)}
                    title={`Command Palette (${isMac ? "⌘" : "Ctrl"}+K)`}
                    className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-white/20 bg-white/[0.04] border border-white/[0.06] hover:text-white/50 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-150 cursor-pointer z-10"
                  >
                    {isMac ? "⌘" : "Ctrl"} K
                  </button>
                </div>
              )}

              {/* Vault locked — still show command palette hint */}
              {currentView === "vault" && !vaultUnlocked && (
                <button
                  onClick={() => setIsCommandPaletteOpen(true)}
                  title={`Command Palette (${isMac ? "⌘" : "Ctrl"}+K)`}
                  className="hidden sm:flex items-center gap-1.5 px-3 h-10 rounded-xl text-white/20 bg-white/[0.03] border border-white/[0.06] hover:text-white/40 hover:bg-white/[0.06] transition-all duration-200 shrink-0"
                >
                  <Search size={13} className="text-white/20" />
                  <kbd className="text-[10px] font-medium">{isMac ? "⌘" : "Ctrl"} K</kbd>
                </button>
              )}
            </div>
          </div>

          {/* Tag filter bar — shown when tags exist in current view */}
          {currentView !== "bin" && allTags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              <Tag size={12} className="text-white/30 shrink-0" />
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 border ${
                    activeTag === tag
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10"
                  }`}
                >
                  #{tag}
                  {activeTag === tag && <X size={10} className="ml-0.5" />}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full h-full">
              {currentView === "todos" ? (
                <TodoList onNotify={(msg, type) => addToast(type === "error" ? "bin" : "success", msg)} />
              ) : currentView === "vault" && !vaultUnlocked && vaultChecked ? (
                <VaultLock
                  onUnlock={(pwd) => { setVaultPasswordSync(pwd); setVaultUnlocked(true); }}
                  hasVaultPassword={hasVaultPassword}
                  onPasswordSet={(pwd) => { setHasVaultPassword(true); setVaultPasswordSync(pwd); setVaultUnlocked(true); }}
                />
              ) : currentView === "vault" && !vaultUnlocked && !vaultChecked ? (
                <div className="flex items-center justify-center h-64"><CustomSpinner size={48} /></div>
              ) : loading ? (
                <div className="flex items-center justify-center h-64"><CustomSpinner size={48} /></div>
              ) : sortedNotes.length === 0 && !(currentView === "bin" && deletedTodos.length > 0) ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4 gap-4">
                  <p className="text-white/40 text-sm max-w-sm">
                    {activeTag ? `No notes tagged with #${activeTag}.` :
                     vaultSearchQuery ? "No vault notes match your search." :
                     viewConfig[currentView].emptyText}
                  </p>
                  {(currentView === "all" || currentView === "vault") && !activeTag && !vaultSearchQuery && (
                    <button onClick={handleNewNote}
                      className="md:hidden btn-sheen flex items-center gap-2 px-5 h-10 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg shadow-purple-500/20">
                      <Plus size={16} />
                      {currentView === "vault" ? "Add to Vault" : "Create Note"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {hasPinnedDivider && (
                      <div key="pinned-section">
                        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3 px-1">Pinned</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {pinnedNotes.map((note) => (
                            <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                              <NoteCard note={note} view={currentView} onEdit={handleEditNote} onPinToggle={handlePinToggle} onLockToggle={handleLockToggle} onDeleteToggle={handleDeleteToggle} onDeletePermanent={handleDeletePermanent} onDuplicate={handleDuplicate} onExport={handleCardExport} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {hasPinnedDivider && (
                      <div key="others-section">
                        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3 px-1">Others</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {unpinnedNotes.map((note) => (
                            <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                              <NoteCard note={note} view={currentView} onEdit={handleEditNote} onPinToggle={handlePinToggle} onLockToggle={handleLockToggle} onDeleteToggle={handleDeleteToggle} onDeletePermanent={handleDeletePermanent} onDuplicate={handleDuplicate} onExport={handleCardExport} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!hasPinnedDivider && sortedNotes.length > 0 && (
                      <div key="flat-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedNotes.map((note) => (
                          <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                            <NoteCard note={note} view={currentView} onEdit={handleEditNote} onPinToggle={handlePinToggle} onLockToggle={handleLockToggle} onDeleteToggle={handleDeleteToggle} onDeletePermanent={handleDeletePermanent} onDuplicate={handleDuplicate} onExport={handleCardExport} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Deleted todos section — only shown in bin view */}
                  {currentView === "bin" && deletedTodos.length > 0 && (
                    <div>
                      {sortedNotes.length > 0 && (
                        <div className="border-t border-white/5 my-2" />
                      )}
                      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3 px-1">Tasks</p>
                      <AnimatePresence mode="popLayout">
                        <div className="flex flex-col gap-2">
                          {deletedTodos.map((todo) => {
                            const priorityColor: Record<string, string> = {
                              urgent: "text-red-400 bg-red-500/10 border-red-500/20",
                              high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                              medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
                              low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                            };
                            const prioClass = priorityColor[todo.priority] ?? priorityColor.medium;
                            return (
                              <motion.div
                                key={todo.id}
                                layout
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.18 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition-colors group"
                              >
                                <CheckSquare size={15} className="text-white/20 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white/70 truncate">{todo.title}</p>
                                  {todo.description && (
                                    <p className="text-xs text-white/30 truncate mt-0.5">{todo.description}</p>
                                  )}
                                </div>
                                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${prioClass}`}>
                                  {todo.priority}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleRestoreTodo(todo.id)}
                                    title="Restore task"
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTodoPermanent(todo.id)}
                                    title="Delete permanently"
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Bin is totally empty */}
                  {currentView === "bin" && sortedNotes.length === 0 && deletedTodos.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                      <p className="text-white/40 text-sm max-w-sm">{viewConfig[currentView].emptyText}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      <NoteEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        note={editingNote}
        defaultLocked={currentView === "vault"}
        onSave={handleSaveNote}
        isSaving={isSaving}
      />

      <InstallPrompt />

      <VaultUnlockModal
        isOpen={vaultUnlockModalOpen}
        onClose={() => { setVaultUnlockModalOpen(false); pendingVaultLockRef.current = null; }}
        onUnlock={async (pwd) => {
          setVaultPasswordSync(pwd);
          setVaultUnlockModalOpen(false);
          const pending = pendingVaultLockRef.current;
          pendingVaultLockRef.current = null;
          if (pending) {
            try {
              const encryptedData = await encryptNote(pending.title, pending.content, pwd);
              const res = await fetch(`/api/notes/${pending.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "", content: "", encryptedData, isLocked: true }),
              });
              if (res.ok) { addToast("vault", "Note moved to Secret Vault"); fetchNotes(); }
              else addToast("error", "Failed to move note to vault");
            } catch { addToast("error", "Failed to encrypt note"); }
          }
        }}
      />

      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (!confirmAction) return;
            const { type, id, currentVal } = confirmAction;
            if (type === "vault")         { addToast("vault", "Note moved to Secret Vault"); executeLockToggle(id, currentVal!); }
            else if (type === "unlock")   { addToast("vault", "Note retrieved from Secret Vault"); executeLockToggle(id, currentVal!); }
            else if (type === "bin")      { addToast("bin", "Note moved to Recycle Bin"); executeDeleteToggle(id, currentVal!); }
            else if (type === "delete")   { addToast("deleted", "Note permanently deleted"); executeDeletePermanent(id); }
            else if (type === "emptyBin") { addToast("deleted", "Recycle Bin emptied"); executeEmptyBin(); }
            else if (type === "deleteVault") {
              fetch("/api/vault/delete-confirm", { method: "DELETE" })
                .then((res) => {
                  if (res.ok) { setHasVaultPassword(false); setVaultUnlocked(false); setVaultPasswordSync(null); if (currentView === "vault") setCurrentView("all"); fetchNotes(); }
                  else addToast("error", "Failed to delete vault");
                }).catch(() => addToast("error", "Failed to delete vault"));
            }
            else if (type === "deleteAccount") {
              fetch("/api/user", { method: "DELETE" })
                .then((res) => { if (res.ok) signOut({ callbackUrl: "/" }); else addToast("error", "Failed to delete account"); })
                .catch(() => addToast("error", "Failed to delete account"));
            }
            setConfirmAction(null);
          }}
          title={
            confirmAction.type === "vault" ? "Move to Vault?" :
            confirmAction.type === "unlock" ? "Remove from Vault?" :
            confirmAction.type === "bin" ? "Move to Recycle Bin?" :
            confirmAction.type === "emptyBin" ? "Empty Recycle Bin?" :
            confirmAction.type === "deleteVault" ? "Delete Vault Permanently?" :
            confirmAction.type === "deleteAccount" ? "Delete Account Permanently?" :
            "Delete Permanently?"
          }
          message={
            confirmAction.type === "vault" ? "This note will be encrypted and moved to your Secret Vault. You'll need your master password to view it." :
            confirmAction.type === "unlock" ? "This note will be decrypted and moved back to All Notes." :
            confirmAction.type === "bin" ? "Move this note to the Recycle Bin? You can recover it later." :
            confirmAction.type === "emptyBin" ? "This will permanently delete all notes in the Recycle Bin. This cannot be undone." :
            confirmAction.type === "deleteVault" ? "This will permanently destroy your vault and all encrypted notes inside it. This cannot be undone." :
            confirmAction.type === "deleteAccount" ? "This will permanently delete your account, all notes, and your vault. This cannot be undone." :
            "Permanently delete this note? This cannot be undone."
          }
          confirmText={
            confirmAction.type === "vault" ? "Move" :
            confirmAction.type === "unlock" ? "Remove" :
            confirmAction.type === "bin" ? "Move" :
            confirmAction.type === "emptyBin" ? "Empty Bin" :
            confirmAction.type === "deleteVault" ? "Wipe Vault" :
            confirmAction.type === "deleteAccount" ? "Delete Account" :
            "Delete"
          }
          isDestructive={["delete", "emptyBin", "deleteVault", "deleteAccount"].includes(confirmAction.type)}
        />
      )}

      {/* Mobile FAB — hidden on todos and bin views where it has no action */}
      <button onClick={handleNewNote}
        className={`md:hidden fixed bottom-6 right-6 z-40 group w-14 h-14 rounded-full bg-primary shadow-xl shadow-purple-500/30 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:shadow-purple-500/50 active:scale-95 overflow-hidden ${currentView === "todos" || currentView === "bin" ? "hidden" : ""}`}
        aria-label="New Note">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transform -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
        </div>
        <Plus size={24} className="relative z-10" />
      </button>

      <ConfirmationModal
        isOpen={lockVaultConfirm}
        onClose={() => setLockVaultConfirm(false)}
        onConfirm={handleLockVault}
        title="Lock Vault?"
        message="This will lock the vault and clear the password from memory. You'll need to enter your master password again to access vault notes."
        confirmText="Lock Vault"
        isDestructive={false}
      />

      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewNote={handleNewNote}
        onNavigate={handleViewChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={() => signOut()}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={{ name: userName || session?.user?.name, email: session?.user?.email }}
        hasVaultPassword={hasVaultPassword}
        onDeleteVault={() => setConfirmAction({ type: "deleteVault", id: "" })}
        onDeleteAccount={() => setConfirmAction({ type: "deleteAccount", id: "" })}
        onUpdateUserName={(newName) => {
          setUserName(newName);
          if (updateSession) {
            updateSession({ name: newName });
          }
        }}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
      <SessionGuard />
    </div>
  );

}
