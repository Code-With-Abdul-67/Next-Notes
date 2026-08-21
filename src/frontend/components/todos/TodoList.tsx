"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Calendar,
  Tag,
  Trash,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import TodoCard, { TodoItem } from "./TodoCard";
import CustomSpinner from "@/frontend/components/ui/CustomSpinner";


interface TodoListProps {
  onNotify?: (message: string, type?: "success" | "error" | "info") => void;
}

export default function TodoList({ onNotify }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // New task form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch todos
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodos();
  }, []);

  // Add new task
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          priority: newPriority,
          dueDate: newDueDate || undefined,
          tags: newTags.trim(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTodos((prev) => [created, ...prev]);
        setNewTitle("");
        setNewDesc("");
        setNewPriority("medium");
        setNewDueDate("");
        setNewTags("");
        setIsAdding(false);
        if (onNotify) onNotify("Task created successfully!", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        if (onNotify) onNotify(data.error || "Failed to create task", "error");
      }
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify("Failed to create task", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle completion
  const handleToggle = async (id: string, isCompleted: boolean) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted } : t))
    );

    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });
    } catch (err) {
      console.error(err);
      fetchTodos();
    }
  };

  // Move task to bin (soft delete)
  const handleMoveToTrash = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmMoveToTrash = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: true }),
      });
      if (onNotify) onNotify("Task moved to recycle bin", "error");
    } catch (err) {
      console.error(err);
      fetchTodos();
    }
  };

  // Update task
  const handleUpdate = async (id: string, updates: Partial<TodoItem>) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (onNotify) onNotify("Task updated", "success");
    } catch (err) {
      console.error(err);
      fetchTodos();
    }
  };

  // Clear completed
  const handleClearCompleted = async () => {
    setTodos((prev) => prev.filter((t) => !t.isCompleted));
    try {
      await fetch("/api/todos?completed=true", { method: "DELETE" });
      if (onNotify) onNotify("Cleared all completed tasks", "info");
    } catch (err) {
      console.error(err);
      fetchTodos();
    }
  };

  // Stats
  const totalTasks = todos.length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const pendingCount = totalTasks - completedCount;

  // Filtered todos
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Status filter
      if (statusFilter === "active" && todo.isCompleted) return false;
      if (statusFilter === "completed" && !todo.isCompleted) return false;

      // Priority filter
      if (priorityFilter !== "all" && todo.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = todo.title.toLowerCase().includes(q);
        const matchesDesc = (todo.description || "").toLowerCase().includes(q);
        const matchesTags = (todo.tags || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });
  }, [todos, statusFilter, priorityFilter, searchQuery]);

  return (
    <>
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-24 md:pb-16">
      {/* Top Header & Stats Card */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 text-white">
              <ListTodo size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Task Workspace
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  {pendingCount} pending
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Organize, track priorities, and accomplish daily goals effortlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Add Task button */}
        <Button
          onPress={() => setIsAdding(true)}
          className="btn-primary rounded-xl text-xs px-4 h-10 shrink-0 z-10"
          startContent={<Plus size={16} />}
        >
          Add Task
        </Button>
      </div>

      {/* New Task Inline Creator Drawer / Card */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            onSubmit={handleAddTodo}
            className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-purple-400" /> Create New Task
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="What needs to be done?..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
                autoFocus
                required
              />

              <textarea
                placeholder="Add optional notes or descriptions..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-purple-500 resize-none"
              />

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Priority Selector */}
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-xs text-white/60">Priority:</span>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                    className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="low" className="bg-zinc-900 text-zinc-300">Low</option>
                    <option value="medium" className="bg-zinc-900 text-blue-300">Medium</option>
                    <option value="high" className="bg-zinc-900 text-amber-300">High</option>
                    <option value="urgent" className="bg-zinc-900 text-red-300">Urgent</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <Calendar size={13} className="text-white/50" />
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="bg-transparent text-xs text-white font-mono focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex-1 min-w-[140px]">
                  <Tag size={13} className="text-white/50" />
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none w-full"
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="btn-primary rounded-xl text-xs px-5 h-9 ml-auto"
                >
                  Create Task
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Tabs
          selectedKey={statusFilter}
          onSelectionChange={(k) => setStatusFilter(k as "all" | "active" | "completed")}
          variant="light"
          aria-label="Filter tasks by status"
          classNames={{
            tabList: "bg-white/5 p-1 rounded-2xl border border-purple-500/20 gap-1",
            cursor: "bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30",
            tab: "h-8 text-xs font-semibold text-white/50 data-[selected=true]:text-white data-[hover=true]:text-white/80",
          }}
        >
          <Tab key="all" title={
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-80" />
              All ({totalTasks})
            </span>
          } />
          <Tab key="active" title={
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-80" />
              Pending ({pendingCount})
            </span>
          } />
          <Tab key="completed" title={
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80" />
              Completed ({completedCount})
            </span>
          } />
        </Tabs>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Priority selector */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-3 h-9 text-xs text-white/80 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-zinc-900">All Priorities</option>
            <option value="urgent" className="bg-zinc-900 text-red-400">Urgent</option>
            <option value="high" className="bg-zinc-900 text-amber-400">High</option>
            <option value="medium" className="bg-zinc-900 text-blue-400">Medium</option>
            <option value="low" className="bg-zinc-900 text-zinc-400">Low</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-8 pr-3 h-9 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
            />
          </div>

          {completedCount > 0 && (
            <Button
              size="sm"
              variant="flat"
              onPress={handleClearCompleted}
              startContent={<Trash size={13} />}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs rounded-2xl border border-red-500/20 h-9 shrink-0"
            >
              Clear Done
            </Button>
          )}
        </div>
      </div>

      {/* Task List Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <CustomSpinner size={48} />
        </div>
      ) : filteredTodos.length === 0 ? (

        <div className="py-16 text-center space-y-3 glass-panel rounded-3xl border border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-bold text-white">No tasks found</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            {searchQuery || priorityFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters or search terms."
              : "You're all caught up! Click 'Add Task' above to organize your next objective."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {filteredTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onMoveToTrash={handleMoveToTrash}
                onUpdate={handleUpdate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>

    {/* Confirm Move to Bin Modal */}
    <Modal
      isOpen={!!confirmDeleteId}
      onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      backdrop="blur"
      classNames={{
        wrapper: "backdrop-blur-sm",
        backdrop: "bg-black/40 backdrop-blur-sm",
        base: "bg-black/30 border border-white/[0.1] backdrop-blur-2xl backdrop-saturate-150 text-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]",
        header: "border-b border-white/[0.06] py-4 px-5",
        body: "py-5 px-5",
        footer: "border-t border-white/[0.06] py-4 px-5 gap-2",
        closeButton: "hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle size={16} />
              </div>
              <span className="font-semibold text-sm">Move to Recycle Bin?</span>
            </ModalHeader>
            <ModalBody>
              <p className="text-white/60 text-sm leading-relaxed">
                This task will be moved to the recycle bin. You can restore it later.
              </p>
            </ModalBody>
            <ModalFooter className="gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 h-9 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmMoveToTrash}
                className="px-4 h-9 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-200"
              >
                Move to Bin
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    </>
  );
}
