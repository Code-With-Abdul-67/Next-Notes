"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { Input, Spinner, Button } from "@nextui-org/react";
import { Search, FileText, Trash2, Lock, Trash, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/frontend/components/layout/Sidebar";
import NoteCard from "@/frontend/components/notes/NoteCard";
import NoteEditorModal from "@/frontend/components/notes/NoteEditorModal";
import VaultLock from "@/frontend/components/vault/VaultLock";
import VaultUnlockModal from "@/frontend/components/vault/VaultUnlockModal";
import InstallPrompt from "@/frontend/components/layout/InstallPrompt";
import ConfirmationModal from "@/frontend/components/ui/ConfirmationModal";
import Toast, { useToast } from "@/frontend/components/ui/Toast";
import { encryptNote, decryptNote } from "@/frontend/lib/crypto";

interface Note {
  id: string;
  title: string;
  content: string;
  color?: string | null;
  encryptedData?: string | null;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  updatedAt: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [currentView, setCurrentView] = useState<"all" | "vault" | "bin">("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input to avoid excessive fetches
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Editor modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Vault
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [hasVaultPassword, setHasVaultPassword] = useState(false);
  const [vaultChecked, setVaultChecked] = useState(false);
  // Vault password held in memory for the whole session — NOT cleared on view change
  const [vaultPassword, setVaultPassword] = useState<string | null>(null);
  // Ref mirror so async callbacks always read the latest password (avoids stale closures)
  const vaultPasswordRef = useRef<string | null>(null);
  // Inline unlock modal — shown when locking a note from "All Notes" without vault unlocked
  const [vaultUnlockModalOpen, setVaultUnlockModalOpen] = useState(false);
  // Pending note to encrypt+lock after the inline unlock modal succeeds
  const pendingVaultLockRef = useRef<{ id: string; title: string; content: string } | null>(null);

  // Always update both state (for re-renders) and ref (for async callbacks)
  const setVaultPasswordSync = (pwd: string | null) => {
    vaultPasswordRef.current = pwd;
    setVaultPassword(pwd);
  };

  const { toasts, addToast, removeToast } = useToast();

  // Confirmation Modals
  const [confirmAction, setConfirmAction] = useState<{
    type: "vault" | "unlock" | "bin" | "delete" | "deleteVault" | "deleteAccount" | "emptyBin";
    id: string;
    currentVal?: boolean;
  } | null>(null);

  // Keyboard shortcut: Ctrl+N / Cmd+N → new note
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if vault password exists — runs once per user login, not on every session refetch
  const userId = (session?.user as any)?.id as string | undefined;

  useEffect(() => {
    const checkVault = async () => {
      try {
        const res = await fetch("/api/vault/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "___check___" }),
        });
        const data = await res.json();
        // notInitialized means no vault password set yet
        // any other response (wrong password = 401, or success) means vault exists
        setHasVaultPassword(!data.notInitialized);
      } catch {
        setHasVaultPassword(false);
      }
      setVaultChecked(true);
    };
    if (userId) checkVault();
  }, [userId]);

  // Fetch notes based on current view
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentView === "bin") params.set("trash", "true");
      if (currentView === "vault") params.set("vault", "true");
      if (debouncedQuery) params.set("search", debouncedQuery);

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const data: Note[] = await res.json();

        // Decrypt vault notes client-side using the in-memory vault password
        if (currentView === "vault" && vaultPasswordRef.current) {
          const decrypted = await Promise.all(
            data.map(async (note) => {
              if (note.isLocked && note.encryptedData) {
                try {
                  const { title, content } = await decryptNote(note.encryptedData, vaultPasswordRef.current!);
                  return { ...note, title, content };
                } catch {
                  // Wrong password or corrupted data — show placeholder
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
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }, [currentView, debouncedQuery]);

  useEffect(() => {
    if (!userId) return;
    if (currentView === "vault" && !vaultUnlocked) return;
    fetchNotes();
  }, [userId, currentView, debouncedQuery, vaultUnlocked, fetchNotes]);

  // Note actions
  const handleSaveNote = async (
    id: string | null,
    title: string,
    content: string,
    isPinned: boolean,
    isLocked: boolean,
    color: string | null = null
  ) => {
    setIsSaving(true);
    try {
      // Always read from ref — avoids stale closure when called right after unlock
      const pwd = vaultPasswordRef.current;

      // Encrypt vault notes client-side before sending to the server
      let encryptedData: string | null = null;
      let storedTitle = title;
      let storedContent = content;

      if (isLocked && pwd) {
        encryptedData = await encryptNote(title, content, pwd);
        // Store empty strings so the DB never holds plaintext for vault notes
        storedTitle = "";
        storedContent = "";
      } else if (isLocked && !pwd) {
        // Safety guard: never save a vault note without encryption
        console.error("Cannot save vault note: vault password not in memory");
        setIsSaving(false);
        return;
      }

      if (id) {
        await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: storedTitle,
            content: storedContent,
            encryptedData,
            isPinned,
            isLocked,
            color,
          }),
        });
      } else {
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: storedTitle,
            content: storedContent,
            encryptedData,
            isPinned,
            isLocked,
            color,
          }),
        });
      }
      fetchNotes();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinToggle = async (id: string, currentVal: boolean) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentVal }),
      });
      fetchNotes();
    } catch (err) {
      console.error("Pin toggle failed:", err);
    }
  };

  const executeLockToggle = async (id: string, currentVal: boolean) => {
    try {
      const movingToVault = !currentVal;
      // Always read from ref — avoids stale closure
      const pwd = vaultPasswordRef.current;

      if (movingToVault && pwd) {
        const note = notes.find((n) => n.id === id);
        if (note) {
          const encryptedData = await encryptNote(note.title, note.content, pwd);
          await fetch(`/api/notes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "", content: "", encryptedData, isLocked: true }),
          });
          fetchNotes();
          return;
        }
      }

      if (!movingToVault) {
        // Moving out of vault — decrypt first, then clear encryptedData
        const note = notes.find((n) => n.id === id);
        if (note && pwd && note.encryptedData) {
          try {
            const { title, content } = await decryptNote(note.encryptedData, pwd);
            await fetch(`/api/notes/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                content,
                encryptedData: null,
                isLocked: false,
              }),
            });
            fetchNotes();
            return;
          } catch {
            console.error("Failed to decrypt note before unlocking");
          }
        }
      }

      // Fallback: only allow toggling lock OFF (removing from vault) without password
      // Never allow moving INTO vault without encryption
      if (movingToVault) {
        console.error("Cannot move note to vault: vault password not in memory");
        return;
      }
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: false }),
      });
      fetchNotes();
    } catch (err) {
      console.error("Lock toggle failed:", err);
    }
  };

  const handleLockToggle = (id: string, currentVal: boolean) => {
    if (!currentVal) {
      // Moving INTO vault
      if (!vaultPasswordRef.current) {
        // Vault not unlocked yet — show inline password modal, store pending note
        const note = notes.find((n) => n.id === id);
        if (note) {
          pendingVaultLockRef.current = { id: note.id, title: note.title, content: note.content };
        }
        setVaultUnlockModalOpen(true);
        return;
      }
      // Vault already unlocked — show confirmation then encrypt
      setConfirmAction({ type: "vault", id, currentVal });
    } else {
      // Moving OUT of vault — show confirmation
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
          } catch {
            console.error("Failed to decrypt vault note before moving to bin");
          }
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
    } catch (err) {
      console.error("Delete toggle failed:", err);
    }
  };

  const handleDeleteToggle = (id: string, currentVal: boolean) => {
    if (!currentVal) {
      setConfirmAction({ type: "bin", id, currentVal });
    } else {
      executeDeleteToggle(id, currentVal);
    }
  };

  const handleDeletePermanent = (id: string) => {
    setConfirmAction({ type: "delete", id });
  };

  const executeDeletePermanent = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      fetchNotes();
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };

  const executeEmptyBin = async () => {
    try {
      await fetch("/api/notes/empty-bin", { method: "DELETE" });
      fetchNotes();
    } catch (err) {
      console.error("Empty bin failed:", err);
    }
  };

  const handleDeleteVault = () => {
    setConfirmAction({ type: "deleteVault", id: "" });
  };

  const handleDeleteAccount = () => {
    setConfirmAction({ type: "deleteAccount", id: "" });
  };

  const handleEmptyBin = () => {
    setConfirmAction({ type: "emptyBin", id: "" });
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleViewChange = (view: "all" | "vault" | "bin") => {
    setCurrentView(view);
    setSearchQuery("");
    // Vault password stays in memory for the whole session.
    // Only clear it when the vault is explicitly deleted or the page is refreshed.
  };

  const viewConfig = {
    all: { title: "All Notes", icon: FileText, emptyText: "No notes yet. Create your first note!" },
    vault: { title: "Secret Vault", icon: Lock, emptyText: "Your vault is empty. Lock notes to keep them private." },
    bin: { title: "Recycle Bin", icon: Trash2, emptyText: "Recycle bin is empty." },
  };

  const ViewIcon = viewConfig[currentView].icon;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewNote={handleNewNote}
        hasVaultPassword={hasVaultPassword}
        onDeleteVault={handleDeleteVault}
        onDeleteAccount={handleDeleteAccount}
        noteCounts={{ all: notes.length, vault: 0, bin: 0 }}
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
        }}
      />

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 md:top-0 z-20 px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <ViewIcon size={22} className="text-purple-400" />
              <h1 className="text-xl font-bold text-white">{viewConfig[currentView].title}</h1>
              {!loading && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-medium">
                  {notes.length}
                </span>
              )}
              {currentView === "bin" && !loading && notes.length > 0 && (
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={<Trash size={14} />}
                  className="ml-2 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
                  onPress={handleEmptyBin}
                >
                  Empty Bin
                </Button>
              )}
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="Search notes..."
                variant="flat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search size={16} className="text-white/30" />}
                classNames={{
                  inputWrapper: "glass-input h-10",
                  input: "text-white text-sm placeholder:text-white/30",
                }}
              />
            </div>
          </div>
        </header>

        {/* AnimatePresence monitors when the layout component content mount or unmount switches views */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              {currentView === "vault" && !vaultUnlocked && vaultChecked ? (
                <VaultLock
                  onUnlock={(pwd) => {
                    setVaultPasswordSync(pwd);
                    setVaultUnlocked(true);
                  }}
                  hasVaultPassword={hasVaultPassword}
                  onPasswordSet={(pwd) => {
                    setHasVaultPassword(true);
                    setVaultPasswordSync(pwd);
                    setVaultUnlocked(true);
                  }}
                />
              ) : loading ? (
                <div className="flex items-center justify-center h-64">
                  <Spinner color="secondary" size="lg" />
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4 gap-4">
                  <p className="text-white/40 text-sm max-w-sm">
                    {viewConfig[currentView].emptyText}
                  </p>
                  {(currentView === "all" || currentView === "vault") && (
                    <Button
                      color="primary"
                      className="md:hidden font-semibold shadow-lg shadow-purple-500/20 bg-primary"
                      startContent={<Plus size={18} />}
                      onPress={handleNewNote}
                    >
                      {currentView === "vault" ? "Add to Vault" : "Create Note"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {notes.map((note) => (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <NoteCard
                          note={note}
                          view={currentView}
                          onEdit={handleEditNote}
                          onPinToggle={handlePinToggle}
                          onLockToggle={handleLockToggle}
                          onDeleteToggle={handleDeleteToggle}
                          onDeletePermanent={handleDeletePermanent}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
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

      {/* Inline vault unlock — shown when locking a note from outside the vault view */}
      <VaultUnlockModal
        isOpen={vaultUnlockModalOpen}
        onClose={() => {
          setVaultUnlockModalOpen(false);
          pendingVaultLockRef.current = null;
        }}
        onUnlock={async (pwd) => {
          setVaultPasswordSync(pwd);
          setVaultUnlockModalOpen(false);
          const pending = pendingVaultLockRef.current;
          pendingVaultLockRef.current = null;
          if (pending) {
            try {
              const encryptedData = await encryptNote(pending.title, pending.content, pwd);
              await fetch(`/api/notes/${pending.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "", content: "", encryptedData, isLocked: true }),
              });
              addToast("vault", "Note moved to Secret Vault");
              fetchNotes();
            } catch (err) {
              console.error("Failed to encrypt note after inline unlock:", err);
            }
          }
        }}
      />

      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (!confirmAction) return;
            if (confirmAction.type === "vault") {
              addToast("vault", "Note moved to Secret Vault");
              executeLockToggle(confirmAction.id, confirmAction.currentVal!);
            } else if (confirmAction.type === "unlock") {
              addToast("vault", "Note retrieved from Secret Vault");
              executeLockToggle(confirmAction.id, confirmAction.currentVal!);
            } else if (confirmAction.type === "bin") {
              addToast("bin", "Note moved to Recycle Bin");
              executeDeleteToggle(confirmAction.id, confirmAction.currentVal!);
            } else if (confirmAction.type === "delete") {
              addToast("deleted", "Note permanently deleted");
              executeDeletePermanent(confirmAction.id);
            } else if (confirmAction.type === "emptyBin") {
              addToast("deleted", "Recycle Bin emptied");
              executeEmptyBin();
            } else if (confirmAction.type === "deleteVault") {
              fetch("/api/vault/delete-confirm", { method: "POST" })
                .then((res) => {
                  if (res.ok) {
                    setHasVaultPassword(false);
                    setVaultUnlocked(false);
                    setVaultPasswordSync(null);
                    if (currentView === "vault") setCurrentView("all");
                    fetchNotes();
                  } else {
                    console.error("Failed to delete vault");
                  }
                })
                .catch(console.error);
            } else if (confirmAction.type === "deleteAccount") {
              // Assumed API route for user deletion. Adjust if your endpoint is different.
              fetch("/api/user", { method: "DELETE" })
                .then((res) => {
                  if (res.ok) {
                    signOut({ callbackUrl: "/" });
                  } else {
                    console.error("Failed to delete account");
                  }
                })
                .catch(console.error);
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
            confirmAction.type === "vault" ? "Are you sure you want to move this note to the Secret Vault? You will need your master password to view it again." :
            confirmAction.type === "unlock" ? "Are you sure you want to remove this note from the Vault? It will become visible in all notes." :
            confirmAction.type === "bin" ? "Are you sure you want to move this note to the Recycle Bin? You can recover it later." :
            confirmAction.type === "emptyBin" ? "This will permanently delete all notes in the Recycle Bin. This action cannot be undone." :
            confirmAction.type === "deleteVault" ? "Are you sure you want to completely destroy the vault? This instantly wipes out your master setup and removes all locked notes forever." :
            confirmAction.type === "deleteAccount" ? "Are you sure you want to permanently delete your account? All of your notes, your vault, and your data will be wiped out immediately. This action cannot be undone." :
            "Are you sure you want to permanently delete this note? This action cannot be undone."
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
      {/* Mobile floating action button — always visible on mobile */}
      <button
        onClick={handleNewNote}
        className="md:hidden fixed bottom-6 right-6 z-40 group w-14 h-14 rounded-full bg-primary shadow-xl shadow-purple-500/30 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:shadow-purple-500/50 active:scale-95 overflow-hidden"
        aria-label="New Note"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transform -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
        </div>
        <Plus size={24} className="relative z-10" />
      </button>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}