"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FolderOpen, FileText, ChevronRight, ChevronDown, Loader2, Plus, Upload, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { renameFolder, renameFlow, deleteFolder, deleteFlow, moveFolder, moveFlow } from "@/lib/mutations";
import type { FolderTreeNode, Flow } from "@/lib/types";

interface SidebarProps {
  tree: FolderTreeNode[];
  loading: boolean;
  selectedFlowId: string | null;
  onSelectFlow: (flow: Flow) => void;
  onCreateFolder: () => void;
  onImportFlow: () => void;
  onDataChanged: () => void;
}

/* ─── Inline rename input ─── */
function InlineRename({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={ref}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleSubmit}
      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); }}
      className="text-sm bg-white border border-black px-1.5 py-0.5 text-black outline-none w-full"
    />
  );
}

/* ─── Context menu (3-dot) ─── */
function ItemMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { 
      if (ref.current && !ref.current.contains(e.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom, left: rect.left });
    }
    setOpen(!open);
  };

  return (
    <div className="relative shrink-0 flex items-center">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="p-1 border border-transparent hover:border-black text-gray-500 hover:text-black transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div 
          ref={ref}
          style={{ 
            position: 'fixed', 
            top: `${coords.top + 4}px`, 
            left: `${coords.left - 120}px`,
            zIndex: 9999 
          }}
          className="bg-white border border-black shadow-none py-1 min-w-[140px]"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRename(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-black hover:bg-black hover:text-white transition-colors"
          >
            <Pencil className="w-3 h-3" /> Renomear
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-600 hover:text-white transition-colors border-t border-gray-100 mt-1"
          >
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── Folder item ─── */
function FolderItem({
  node,
  selectedFlowId,
  onSelectFlow,
  onDataChanged,
  isAdmin,
  depth = 0,
}: {
  node: FolderTreeNode;
  selectedFlowId: string | null;
  onSelectFlow: (flow: Flow) => void;
  onDataChanged: () => void;
  isAdmin: boolean;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renamingFlowId, setRenamingFlowId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const hasChildren = node.children.length > 0 || node.flows.length > 0;

  const handleRenameFolder = async (newName: string) => {
    try { await renameFolder(node.folder.id, newName); onDataChanged(); } catch (e: any) { alert(e.message); }
    setRenaming(false);
  };

  const handleDeleteFolder = async () => {
    if (!confirm(`Excluir a pasta "${node.folder.name}" e todo seu conteúdo?`)) return;
    try { await deleteFolder(node.folder.id); onDataChanged(); } catch (e: any) { alert(e.message); }
  };

  const handleRenameFlow = async (flowId: string, newTitle: string) => {
    try { await renameFlow(flowId, newTitle); onDataChanged(); } catch (e: any) { alert(e.message); }
    setRenamingFlowId(null);
  };

  const handleDeleteFlow = async (flow: Flow) => {
    if (!confirm(`Excluir o fluxo "${flow.title}"?`)) return;
    try { await deleteFlow(flow.id); onDataChanged(); } catch (e: any) { alert(e.message); }
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: 'folder' | 'flow') => {
    if (!isAdmin) return;
    e.dataTransfer.setData("id", id);
    e.dataTransfer.setData("type", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    if (!isAdmin) return;

    const draggedId = e.dataTransfer.getData("id");
    const draggedType = e.dataTransfer.getData("type");

    if (!draggedId || !draggedType) return;
    if (draggedId === targetFolderId) return;

    try {
      if (draggedType === 'folder') {
        await moveFolder(draggedId, targetFolderId);
      } else {
        await moveFlow(draggedId, targetFolderId);
      }
      onDataChanged();
    } catch (err: any) {
      alert(err.message);
    } finally {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  return (
    <li>
      <div
        draggable={isAdmin && !renaming}
        onDragStart={(e) => handleDragStart(e, node.folder.id, 'folder')}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!isAdmin) return;
          dragCounter.current++;
          if (dragCounter.current === 1) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounter.current--;
          if (dragCounter.current === 0) setIsDragOver(false);
        }}
        onDrop={(e) => handleDrop(e, node.folder.id)}
        className={`group w-full flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors ${
          isDragOver ? "bg-black text-white" : "hover:bg-gray-100 text-black"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button onClick={() => setOpen(!open)} className={`flex items-center gap-2 flex-1 min-w-0 text-left ${isDragOver ? "pointer-events-none" : ""}`}>
          {hasChildren ? (
            open ? <ChevronDown className={`w-3 h-3 shrink-0 ${isDragOver ? "text-white" : "text-black"}`} /> : <ChevronRight className={`w-3 h-3 shrink-0 ${isDragOver ? "text-white" : "text-black"}`} />
          ) : (
            <span className="w-3" />
          )}
          <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isDragOver ? "text-white" : "text-gray-500"}`} />
          {renaming ? (
            <InlineRename value={node.folder.name} onSave={handleRenameFolder} onCancel={() => setRenaming(false)} />
          ) : (
            <span className={`text-[13px] font-bold uppercase tracking-tight ${isDragOver ? "text-white" : "text-black"}`}>{node.folder.name}</span>
          )}
        </button>
        {isAdmin && !renaming && (
          <ItemMenu onRename={() => setRenaming(true)} onDelete={handleDeleteFolder} />
        )}
      </div>

      {open && hasChildren && (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <FolderItem
              key={child.folder.id}
              node={child}
              selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow}
              onDataChanged={onDataChanged}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}
          {node.flows.map((flow) => (
            <li key={flow.id}>
              <div
                draggable={isAdmin && renamingFlowId !== flow.id}
                onDragStart={(e) => handleDragStart(e, flow.id, 'flow')}
                className={`group w-full flex items-center gap-2 py-1 cursor-pointer transition-colors ${
                  selectedFlowId === flow.id
                    ? "bg-gray-200 border-l-2 border-black"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
              >
                <button onClick={() => onSelectFlow(flow)} className="flex items-start gap-2 flex-1 min-w-0 text-left">
                  <span className="w-3 shrink-0" />
                  <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selectedFlowId === flow.id ? "text-black" : "text-gray-400"}`} />
                  {renamingFlowId === flow.id ? (
                    <InlineRename value={flow.title} onSave={(v) => handleRenameFlow(flow.id, v)} onCancel={() => setRenamingFlowId(null)} />
                  ) : (
                    <span className={`text-[12px] font-medium break-words ${selectedFlowId === flow.id ? "text-black font-bold" : ""}`}>{flow.title}</span>
                  )}
                </button>
                {isAdmin && renamingFlowId !== flow.id && (
                  <ItemMenu onRename={() => setRenamingFlowId(flow.id)} onDelete={() => handleDeleteFlow(flow)} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar({ tree, loading, selectedFlowId, onSelectFlow, onCreateFolder, onImportFlow, onDataChanged }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = !!user;

  return (
    <aside className="w-64 bg-white border-r border-black flex flex-col h-full text-black">
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
          Arquivos
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <p className="text-sm text-slate-500 italic px-2">Nenhum fluxo encontrado.</p>
        ) : (
          <ul className="space-y-0.5">
            {tree.map((node) => (
              <FolderItem
                key={node.folder.id}
                node={node}
                selectedFlowId={selectedFlowId}
                onSelectFlow={onSelectFlow}
                onDataChanged={onDataChanged}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </div>

      {isAdmin && (
        <div className="p-4 border-t border-black space-y-2 bg-gray-50">
          <button
            onClick={onCreateFolder}
            className="w-full py-2 bg-white border border-black hover:bg-gray-100 text-black text-xs font-bold uppercase transition-colors"
          >
            + Nova Pasta
          </button>
          <button
            onClick={onImportFlow}
            className="w-full py-2 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
          >
            Importar Fluxo
          </button>
        </div>
      )}
    </aside>
  );
}
