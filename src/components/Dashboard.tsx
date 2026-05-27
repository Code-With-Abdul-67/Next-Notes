"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Input, Spinner, Button } from "@nextui-org/react";
import { Search, FileText, Trash2, Lock, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import NoteCard from "@/components/NoteCard";
import NoteEditorModal from "@/components/NoteEditorModal";
import VaultLock from "@/components/VaultLock";
import InstallPrompt from "@/components/InstallPrompt";
import ConfirmationModal from "@/components/ConfirmationModal";
import OTPModal from "@/components/OTPModal";

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  updatedAt: string;
}

export default function Dashboard() {
  console.log('Dashboard component rendered');
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

  // Confirmation Modals
  const [confirmAction, setConfirmAction] = useState<{
    type: "vault" | "unlock" | "bin" | "delete" | "deleteVault";
    id: string;
    currentVal?: boolean;
  } | null>(null);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Check if vault password exists
  useEffect(() => {
    const checkVault = async () => {
      try {
        const res = await fetch("/api/vault/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "___check___" }),
        });
        const data = await res.json();
        // If we get "notInitialized" flag, vault is not set up
        if (data.notInitialized) {
          setHasVaultPassword(false);
        } else {
          // Vault exists (password was wrong, which is expected)
          setHasVaultPassword(true);
        }
      } catch {
        setHasVaultPassword(false);
      }
      setVaultChecked(true);
    };
    if (session) checkVault();
  }, [session]);

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
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }, [currentView, debouncedQuery]);

  useEffect(() => {
    if (session) {
      // Only fetch vault notes if unlocked
      if (currentView === "vault" && !vaultUnlocked) return;
      fetchNotes();
    }
  }, [session, currentView, debouncedQuery, vaultUnlocked, fetchNotes]);

  // Note actions
  const handleSaveNote = async (
    id: string | null,
    title: string,
    content: string,
    isPinned: boolean,
    isLocked: boolean
  ) => {
    setIsSaving(true);
    try {
      if (id) {
        // Update
        await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, isPinned, isLocked }),
        });
      } else {
        // Create
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, isPinned, isLocked }),
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
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !currentVal }),
      });
      fetchNotes();
    } catch (err) {
      console.error("Lock toggle failed:", err);
    }
  };

  const handleLockToggle = (id: string, currentVal: boolean) => {
    if (!currentVal) {
      // Move to vault
      setConfirmAction({ type: "vault", id, currentVal });
    } else {
      // Unlock (remove from vault)
      setConfirmAction({ type: "unlock", id, currentVal });
    }
  };


  const executeDeleteToggle = async (id: string, currentVal: boolean) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: !currentVal }),
      });
      fetchNotes();
    } catch (err) {
      console.error("Delete toggle failed:", err);
    }
  };

  const handleDeleteToggle = (id: string, currentVal: boolean) => {
    // Only confirm when moving TO bin (not recovering)
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
      await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      fetchNotes();
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };

  const handleDeleteVault = () => {
    setConfirmAction({ type: "deleteVault", id: "" });
  };

  const handleOTPSubmit = async (code: string) => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/vault/delete-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setHasVaultPassword(false);
        setVaultUnlocked(false);
        setOtpModalOpen(false);
        if (currentView === "vault") {
          setCurrentView("all");
        }
        fetchNotes();
      } else {
        setOtpError(data.error || "Incorrect verification code.");
      }
    } catch (err) {
      setOtpError("An error occurred. Please try again.");
    } finally {
      setOtpLoading(false);
    }
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
  };

  // View title & icon
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
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image,
          }}
        />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header with Search */}
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

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Vault Lock Gate */}
          {currentView === "vault" && !vaultUnlocked && vaultChecked ? (
            <VaultLock
              onUnlock={() => setVaultUnlocked(true)}
              hasVaultPassword={hasVaultPassword}
              onPasswordSet={() => {
                setHasVaultPassword(true);
                setVaultUnlocked(true);
              }}
            />
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner color="secondary" size="lg" />
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
        </div>
      </main>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        note={editingNote}
        onSave={handleSaveNote}
        isSaving={isSaving}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (!confirmAction) return;
            if (confirmAction.type === "vault") {
              executeLockToggle(confirmAction.id, confirmAction.currentVal!);
            } else if (confirmAction.type === "unlock") {
              executeLockToggle(confirmAction.id, confirmAction.currentVal!);
            } else if (confirmAction.type === "bin") {
              executeDeleteToggle(confirmAction.id, confirmAction.currentVal!);
            } else if (confirmAction.type === "delete") {
              executeDeletePermanent(confirmAction.id);
            } else if (confirmAction.type === "deleteVault") {
              fetch("/api/vault/delete-request", { method: "POST" })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    setOtpModalOpen(true);
                  } else {
                    console.error("Failed to send OTP:", data.error);
                    // could show an alert or toast here
                  }
                })
                .catch(console.error);
            }
            setConfirmAction(null);
          }}
          title={
            confirmAction.type === "vault"
              ? "Move to Vault?"
              : confirmAction.type === "unlock"
              ? "Remove from Vault?"
              : confirmAction.type === "bin"
              ? "Move to Recycle Bin?"
              : confirmAction.type === "deleteVault"
              ? "Delete Vault?"
              : "Delete Permanently?"
          }
          message={
            confirmAction.type === "vault"
              ? "Are you sure you want to move this note to the Secret Vault? You will need your master password to view it again."
              : confirmAction.type === "unlock"
              ? "Are you sure you want to remove this note from the Vault? It will become visible in all notes."
              : confirmAction.type === "bin"
              ? "Are you sure you want to move this note to the Recycle Bin? You can recover it later."
              : confirmAction.type === "deleteVault"
              ? "Are you sure you want to delete the entire vault? This will remove all vault data."
              : "Are you sure you want to permanently delete this note? This action cannot be undone."
          }
          confirmText={
            confirmAction.type === "vault"
              ? "Move"
              : confirmAction.type === "unlock"
              ? "Remove"
              : confirmAction.type === "bin"
              ? "Move"
              : confirmAction.type === "deleteVault"
              ? "Delete Vault"
              : "Delete"
          }
          isDestructive={confirmAction.type === "delete" || confirmAction.type === "deleteVault"}
        />
      )}

      {/* OTP Modal for Vault Deletion */}
      <OTPModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onSubmit={handleOTPSubmit}
        title="Verify Vault Deletion"
        message="A 6-digit verification code has been sent to your email. Enter it below to permanently delete your vault and all locked notes."
        isLoading={otpLoading}
        error={otpError}
      />
    </div>
  );
}
