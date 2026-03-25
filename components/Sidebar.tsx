"use client";

import React, { useState, useRef, useEffect } from "react";
import { FolderOpen, FileText, ChevronRight, ChevronDown, Loader2, Plus, Upload, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { renameFolder, renameFlow, deleteFolder, deleteFlow } from "@/lib/mutations";
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
      className="text-sm bg-slate-800 border border-blue-500/50 rounded px-1.5 py-0.5 text-slate-200 outline-none w-full min-w-0"
    />
  );
}

/* ─── Context menu (3-dot) ─── */
function ItemMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 min-w-[140px]">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRename(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Renomear
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </div>
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
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renamingFlowId, setRenamingFlowId] = useState<string | null>(null);
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

  return (
    <li>
      <div
        className="group w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          {hasChildren ? (
            open ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
          ) : (
            <span className="w-3" />
          )}
          <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
          {renaming ? (
            <InlineRename value={node.folder.name} onSave={handleRenameFolder} onCancel={() => setRenaming(false)} />
          ) : (
            <span className="text-sm text-slate-300">{node.folder.name}</span>
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
                className={`group w-full flex items-center gap-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  selectedFlowId === flow.id
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
                style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
              >
                <button onClick={() => onSelectFlow(flow)} className="flex items-start gap-2 flex-1 min-w-0 text-left pt-0.5">
                  <span className="w-3 shrink-0" />
                  <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${selectedFlowId === flow.id ? "text-blue-400" : "text-slate-500"}`} />
                  {renamingFlowId === flow.id ? (
                    <InlineRename value={flow.title} onSave={(v) => handleRenameFlow(flow.id, v)} onCancel={() => setRenamingFlowId(null)} />
                  ) : (
                    <span className="text-sm font-medium break-words">{flow.title}</span>
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
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-full text-slate-300">
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
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
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={onCreateFolder}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Pasta
          </button>
          <button
            onClick={onImportFlow}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors shadow-sm shadow-blue-900/20"
          >
            <Upload className="w-4 h-4" />
            Importar Fluxo (Bizagi)
          </button>
        </div>
      )}
    </aside>
  );
}
