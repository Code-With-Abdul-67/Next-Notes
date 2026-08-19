"use client";

import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Columns3, Plus, GripVertical, Calendar, Tag, Settings2, X } from "lucide-react";
import type { NoteColor } from "@/frontend/components/notes/NoteCard";

interface Note {
  id: string;
  title: string;
  content: string;
  color?: NoteColor;
  tags?: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  updatedAt: string;
  createdAt?: string;
}

// Default kanban columns
const DEFAULT_COLUMNS = [
  { id: "todo", title: "To Do", color: "blue", emoji: "📋" },
  { id: "in-progress", title: "In Progress", color: "amber", emoji: "🚧" },
  { id: "review", title: "Review", color: "purple", emoji: "👀" },
  { id: "done", title: "Done", color: "green", emoji: "✅" },
];

const COLUMN_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; headerBg: string }> = {
  blue:   { bg: "bg-blue-500/5",   border: "border-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-400",   headerBg: "bg-blue-500/10" },
  amber:  { bg: "bg-amber-500/5",  border: "border-amber-500/20",  text: "text-amber-400",  dot: "bg-amber-400",  headerBg: "bg-amber-500/10" },
  purple: { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-400", dot: "bg-purple-400", headerBg: "bg-purple-500/10" },
  green:  { bg: "bg-green-500/5",  border: "border-green-500/20",  text: "text-green-400",  dot: "bg-green-400",  headerBg: "bg-green-500/10" },
  red:    { bg: "bg-red-500/5",    border: "border-red-500/20",    text: "text-red-400",    dot: "bg-red-400",    headerBg: "bg-red-500/10" },
  pink:   { bg: "bg-pink-500/5",   border: "border-pink-500/20",   text: "text-pink-400",   dot: "bg-pink-400",   headerBg: "bg-pink-500/10" },
};

interface KanbanBoardProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onNewNote: () => void;
  onUpdateNoteTags: (noteId: string, newTags: string) => void;
}

export default function KanbanBoard({ notes, onEditNote, onNewNote, onUpdateNoteTags }: KanbanBoardProps) {
  const [columns] = useState(DEFAULT_COLUMNS);
  const [showSettings, setShowSettings] = useState(false);

  // Classify notes into columns based on their tags
  const columnNotes = useMemo(() => {
    const result: Record<string, Note[]> = {};
    const assigned = new Set<string>();

    for (const col of columns) {
      result[col.id] = [];
    }
    result["uncategorized"] = [];

    // Assign notes to columns based on matching tags
    for (const note of notes) {
      if (note.isDeleted) continue;
      const noteTags = note.tags ? note.tags.split(",").map(t => t.trim().toLowerCase()) : [];
      let placed = false;
      for (const col of columns) {
        const colTag = col.id.toLowerCase();
        if (noteTags.includes(colTag) || noteTags.includes(col.title.toLowerCase().replace(/\s+/g, "-"))) {
          result[col.id].push(note);
          assigned.add(note.id);
          placed = true;
          break;
        }
      }
      if (!placed) {
        result["uncategorized"].push(note);
      }
    }

    return result;
  }, [notes, columns]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const note = notes.find(n => n.id === draggableId);
    if (!note) return;

    const targetColumnId = destination.droppableId;
    const targetColumn = columns.find(c => c.id === targetColumnId);

    // Build new tags: remove old column tags, add new column tag
    const currentTags = note.tags ? note.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const columnTagIds = columns.map(c => c.id);
    const columnTagNames = columns.map(c => c.title.toLowerCase().replace(/\s+/g, "-"));
    const allColumnTags = [...columnTagIds, ...columnTagNames];

    // Remove any existing column tags
    const filteredTags = currentTags.filter(t => !allColumnTags.includes(t.toLowerCase()));

    // Add the new column's tag (if not "uncategorized")
    if (targetColumn) {
      filteredTags.push(targetColumn.id);
    }

    onUpdateNoteTags(draggableId, filteredTags.join(","));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const allColumns = [...columns, { id: "uncategorized", title: "Uncategorized", color: "red", emoji: "📁" }];

  return (
    <div className="w-full h-full">
      {/* Kanban Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Columns3 size={16} className="text-purple-400" />
          </div>
          <h2 className="text-sm font-semibold text-white/70">Kanban Board</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30 font-medium">
            {notes.filter(n => !n.isDeleted).length} notes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-[11px] text-white/20">
            Drag notes between columns to organize
          </span>
        </div>
      </div>

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
          style={{ minHeight: "calc(100vh - 280px)" }}
        >
          {allColumns.map((column) => {
            const colors = COLUMN_COLORS[column.color] || COLUMN_COLORS.blue;
            const colNotes = columnNotes[column.id] || [];

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-72 flex flex-col rounded-2xl border border-white/[0.06] overflow-hidden"
                style={{
                  background: "rgba(15, 10, 25, 0.3)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b border-white/[0.06] ${colors.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{column.emoji}</span>
                      <h3 className={`text-sm font-semibold ${colors.text}`}>{column.title}</h3>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 font-medium min-w-[20px] text-center">
                        {colNotes.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column Body */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors duration-200 ${
                        snapshot.isDraggingOver ? `${colors.bg} border-dashed` : ""
                      }`}
                      style={{ minHeight: 80 }}
                    >
                      {colNotes.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-8 text-white/15">
                          <p className="text-xs">No notes</p>
                          <p className="text-[10px] mt-0.5">Drag here or tag with &quot;{column.id}&quot;</p>
                        </div>
                      )}

                      {colNotes.map((note, index) => (
                        <Draggable key={note.id} draggableId={note.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group rounded-xl border transition-all duration-150 cursor-pointer ${
                                snapshot.isDragging
                                  ? "border-purple-500/40 shadow-xl shadow-purple-500/10 scale-[1.02] rotate-1"
                                  : "border-white/[0.06] hover:border-white/[0.12]"
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                background: snapshot.isDragging
                                  ? "rgba(25, 18, 45, 0.95)"
                                  : "rgba(255, 255, 255, 0.02)",
                              }}
                              onClick={() => onEditNote(note)}
                            >
                              <div className="p-3">
                                {/* Drag Handle + Title */}
                                <div className="flex items-start gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical size={14} className="text-white/20" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-white/80 truncate">
                                      {note.title || "Untitled"}
                                    </h4>
                                    {note.content && (
                                      <p className="text-xs text-white/30 mt-1 line-clamp-2 leading-relaxed">
                                        {note.content.slice(0, 100)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Tags & Meta */}
                                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04]">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {note.tags && note.tags.split(",").filter(Boolean).slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/[0.06]"
                                      >
                                        #{tag.trim()}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-white/20 shrink-0">
                                    <Calendar size={10} />
                                    {formatTime(note.updatedAt)}
                                  </div>
                                </div>

                                {/* Pin/Lock indicators */}
                                {(note.isPinned || note.isLocked) && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    {note.isPinned && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/60 border border-amber-500/15">
                                        📌 Pinned
                                      </span>
                                    )}
                                    {note.isLocked && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400/60 border border-purple-500/15">
                                        🔒 Locked
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
