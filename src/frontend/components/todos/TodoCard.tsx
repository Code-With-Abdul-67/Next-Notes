"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Trash2,
  Calendar,
  Tag,
  AlertCircle,
  MoreVertical,
  Edit2,
  AlertOctagon,
  ArrowUp,
  Minus,
  ArrowDown,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";

export interface TodoItem {
  id: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  isDeleted: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  tags?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoCardProps {
  todo: TodoItem;
  onToggle: (id: string, isCompleted: boolean) => void;
  onMoveToTrash: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TodoItem>) => void;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: AlertOctagon,
  },
  high: {
    label: "High",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: ArrowUp,
  },
  medium: {
    label: "Medium",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: Minus,
  },
  low: {
    label: "Low",
    badge: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    icon: ArrowDown,
  },
};

export default function TodoCard({ todo, onToggle, onMoveToTrash, onUpdate }: TodoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description || "");

  const priority = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium;
  const tagList = (todo.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const formattedDueDate = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  const [now] = useState(() => Date.now());

  const isOverdue =
    todo.dueDate && !todo.isCompleted && new Date(todo.dueDate).getTime() < now;

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate(todo.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || null,
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`glass-card p-3 rounded-2xl group transition-all relative overflow-hidden flex flex-col justify-between gap-2 border border-white/[0.06] hover:border-white/[0.12] ${
        todo.isCompleted ? "opacity-60 bg-white/[0.01]" : "bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id, !todo.isCompleted)}
          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            todo.isCompleted
              ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/30"
              : "border-white/20 hover:border-purple-400 hover:bg-white/5 text-transparent"
          }`}
        >
          <Check size={13} strokeWidth={3} className={todo.isCompleted ? "opacity-100" : "opacity-0"} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                autoFocus
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-purple-500 resize-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-purple-600 text-white text-xs h-7 rounded-lg"
                  onPress={handleSaveEdit}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  className="text-white/60 text-xs h-7 rounded-lg"
                  onPress={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span
                className={`text-sm font-semibold tracking-tight block break-words transition-all ${
                  todo.isCompleted ? "line-through text-white/40" : "text-white"
                }`}
              >
                {todo.title}
              </span>

              {todo.description && (
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                  {todo.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Menu */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0">
            <Dropdown placement="bottom-end" className="bg-zinc-950/95 border border-white/10 text-white rounded-xl">
              <DropdownTrigger>
                <button className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <MoreVertical size={14} />
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Todo Actions" variant="flat">
                <DropdownItem
                  key="edit"
                  startContent={<Edit2 size={13} />}
                  onPress={() => setIsEditing(true)}
                  className="text-xs text-white/80 font-medium"
                >
                  Edit Task
                </DropdownItem>
                <DropdownItem
                  key="p-urgent"
                  onPress={() => onUpdate(todo.id, { priority: "urgent" })}
                  className="text-xs text-red-400 font-medium"
                >
                  Mark Urgent
                </DropdownItem>
                <DropdownItem
                  key="p-high"
                  onPress={() => onUpdate(todo.id, { priority: "high" })}
                  className="text-xs text-amber-400 font-medium"
                >
                  Mark High
                </DropdownItem>
                <DropdownItem
                  key="p-medium"
                  onPress={() => onUpdate(todo.id, { priority: "medium" })}
                  className="text-xs text-blue-400 font-medium"
                >
                  Mark Medium
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash2 size={13} />}
                  onPress={() => onMoveToTrash(todo.id)}
                  className="text-xs text-red-400 font-medium"
                >
                  Move to Bin
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        )}
      </div>

      {/* Badges and metadata footer */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04] text-[11px]">
        {/* Status Badge */}
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
            todo.isCompleted
              ? "bg-green-500/20 text-green-300 border-green-500/30"
              : isOverdue
              ? "bg-red-500/20 text-red-300 border-red-500/30"
              : "bg-purple-500/20 text-purple-300 border-purple-500/30"
          }`}
        >
          {todo.isCompleted ? (
            <><Check size={11} /> Done</>
          ) : isOverdue ? (
            <><XCircle size={11} /> Overdue</>
          ) : (
            <><Clock size={11} /> Pending</>
          )}
        </span>

        {/* Priority Badge */}
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1.5 ${priority.badge}`}
        >
          <priority.icon size={11} />
          {priority.label}
        </span>

        {/* Due Date */}
        {formattedDueDate && (
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 border ${
              isOverdue
                ? "bg-red-500/20 text-red-300 border-red-500/30"
                : "bg-white/5 text-white/60 border-white/10"
            }`}
          >
            {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
            {formattedDueDate}
          </span>
        )}

        {/* Tags */}
        {tagList.map((tag, i) => (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded-md text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1"
          >
            <Tag size={9} />
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
