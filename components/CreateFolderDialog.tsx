"use client";

import React, { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import type { FolderTreeNode } from "@/lib/types";

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  tree: FolderTreeNode[];
  onCreated: () => void;
}

export default function CreateFolderDialog({ open, onClose, tree, onCreated }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flatten folders for the select dropdown
  const flattenFolders = (nodes: FolderTreeNode[], depth = 0): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = [];
    for (const node of nodes) {
      result.push({ id: node.folder.id, name: node.folder.name, depth });
      result.push(...flattenFolders(node.children, depth + 1));
    }
    return result;
  };

  const folders = flattenFolders(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { createFolder } = await import("@/lib/mutations");
      await createFolder(name.trim(), parentId || null);
      setName("");
      setParentId("");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar pasta");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Nova Pasta</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">{error}</div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Nome da pasta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Onboarding"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Pasta pai (opcional)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
            >
              <option value="">Raiz (sem pasta pai)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {"—".repeat(f.depth)} {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
