"use client";

import React, { useState, useRef } from "react";
import { Upload, Loader2, X, FolderOpen, FileText, Check } from "lucide-react";
import type { FolderTreeNode } from "@/lib/types";

interface ImportFlowDialogProps {
  open: boolean;
  onClose: () => void;
  tree: FolderTreeNode[];
  onCreated: () => void;
}

interface ParsedDiagram {
  name: string;
  svgFileName: string;
  svgFile: File | null;
  pageData: Record<string, unknown>;
  selected: boolean;
}

/**
 * Parses a Bizagi configuration.json.js file content into JSON.
 */
function parseBizagiConfig(text: string): Record<string, unknown> {
  // Strip JS prefix like "Bizagi.AppModel = "
  const prefixMatch = text.match(/^\s*[\w.]+\s*=\s*/);
  if (prefixMatch) {
    text = text.slice(prefixMatch[0].length);
  }
  // Remove trailing semicolons/whitespace
  text = text.replace(/;\s*$/, "").trim();
  return JSON.parse(text);
}

export default function ImportFlowDialog({ open, onClose, tree, onCreated }: ImportFlowDialogProps) {
  const [folderId, setFolderId] = useState<string>("");
  const [diagrams, setDiagrams] = useState<ParsedDiagram[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setParsing(true);
    setError(null);
    setDiagrams([]);

    try {
      // Find the config file (configuration.json.js or similar)
      let configFile: File | null = null;
      const svgFiles = new Map<string, File>();

      for (const file of Array.from(files)) {
        const name = file.name.toLowerCase();
        const path = file.webkitRelativePath.toLowerCase();

        // Find the config file
        if (name.endsWith(".json.js") || name === "configuration.json") {
          configFile = file;
        }

        // Collect SVG files from the diagrams folder
        if (name.endsWith(".svg") && (path.includes("/diagrams/") || path.includes("\\diagrams\\"))) {
          svgFiles.set(name, file);
        }
      }

      if (!configFile) {
        setError("Nenhum arquivo configuration.json.js encontrado na pasta selecionada.");
        setParsing(false);
        return;
      }

      // Extract folder name from the first file's path
      const firstPath = Array.from(files)[0].webkitRelativePath;
      setFolderName(firstPath.split("/")[0] || firstPath.split("\\")[0] || "Pasta");

      // Parse the config
      const configText = await configFile.text();
      let config: Record<string, unknown>;
      try {
        config = parseBizagiConfig(configText);
      } catch {
        setError("Não foi possível interpretar o arquivo de configuração.");
        setParsing(false);
        return;
      }

      // Extract pages/diagrams
      const pages = (config as any).pages || [];
      if (pages.length === 0) {
        setError("Nenhum diagrama encontrado no arquivo de configuração.");
        setParsing(false);
        return;
      }

      const parsed: ParsedDiagram[] = pages.map((page: any) => {
        // Extract SVG filename from the page image path
        const imagePath: string = page.image || "";
        const svgFileName = imagePath.split("\\").pop()?.split("/").pop() || "";

        // Try to match with uploaded SVG files
        const matchedSvg = svgFiles.get(svgFileName.toLowerCase()) || null;

        return {
          name: page.name || "Sem nome",
          svgFileName,
          svgFile: matchedSvg,
          pageData: {
            ...config,
            pages: [page], // Only this page's data
          },
          selected: true, // Selected by default
        };
      });

      setDiagrams(parsed);
    } catch (err: any) {
      setError(err.message || "Erro ao processar a pasta");
    } finally {
      setParsing(false);
    }
  };

  const toggleDiagram = (index: number) => {
    setDiagrams((prev) =>
      prev.map((d, i) => (i === index ? { ...d, selected: !d.selected } : d))
    );
  };

  const selectAll = () => setDiagrams((prev) => prev.map((d) => ({ ...d, selected: true })));
  const selectNone = () => setDiagrams((prev) => prev.map((d) => ({ ...d, selected: false })));

  const selectedCount = diagrams.filter((d) => d.selected).length;

  const handleImport = async () => {
    if (!folderId || selectedCount === 0) return;

    setLoading(true);
    setError(null);

    try {
      const { createFlow } = await import("@/lib/mutations");
      const selected = diagrams.filter((d) => d.selected);

      for (const diagram of selected) {
        await createFlow(
          folderId,
          diagram.name,
          diagram.pageData,
          diagram.svgFile || undefined
        );
      }

      // Reset state
      setDiagrams([]);
      setFolderId("");
      setFolderName(null);
      if (inputRef.current) inputRef.current.value = "";
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao importar fluxos");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDiagrams([]);
    setFolderId("");
    setFolderName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Importar Fluxos (Bizagi)</h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">{error}</div>
          )}

          {/* Folder picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Pasta do Bizagi (exportação)</label>
            <div className="relative">
              <input
                ref={inputRef}
                type="file"
                /* @ts-expect-error webkitdirectory is valid but not in React types */
                webkitdirectory=""
                directory=""
                onChange={handleFolderSelect}
                className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 file:cursor-pointer file:transition-colors"
              />
            </div>
            {folderName && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FolderOpen className="w-3 h-3" />
                <span>{folderName}</span>
              </div>
            )}
          </div>

          {/* Destination folder */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Pasta de destino</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
            >
              <option value="">Selecione uma pasta...</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {"—".repeat(f.depth)} {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loading spinner for parsing */}
          {parsing && (
            <div className="flex items-center justify-center gap-2 py-4 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processando pasta...</span>
            </div>
          )}

          {/* Diagram list with checkboxes */}
          {diagrams.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">
                  Diagramas encontrados ({selectedCount}/{diagrams.length})
                </span>
                <div className="flex gap-2 text-xs">
                  <button onClick={selectAll} className="text-blue-400 hover:text-blue-300 transition-colors">
                    Todos
                  </button>
                  <span className="text-slate-700">|</span>
                  <button onClick={selectNone} className="text-slate-500 hover:text-slate-300 transition-colors">
                    Nenhum
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 max-h-[200px] border border-slate-800 rounded-md p-2 bg-slate-800/30">
                {diagrams.map((d, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      d.selected ? "bg-blue-600/10 border border-blue-500/20" : "hover:bg-slate-800 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        d.selected
                          ? "bg-blue-600 border-blue-500"
                          : "border-slate-600 bg-slate-800"
                      }`}
                    >
                      {d.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <FileText className={`w-4 h-4 shrink-0 ${d.selected ? "text-blue-400" : "text-slate-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate font-medium ${d.selected ? "text-slate-200" : "text-slate-400"}`}>
                        {d.name}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        {d.svgFile ? `✓ SVG: ${d.svgFileName}` : `⚠ SVG não encontrado: ${d.svgFileName}`}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={d.selected}
                      onChange={() => toggleDiagram(i)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={loading || selectedCount === 0 || !folderId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Importar {selectedCount > 0 ? `(${selectedCount})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
