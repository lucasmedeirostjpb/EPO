"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import FlowViewer from "@/components/FlowViewer";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import ImportFlowDialog from "@/components/ImportFlowDialog";
import { getFolderTree, getFlowByIdOrSlug, getFolderBreadcrumb } from "@/lib/queries";
import type { FolderTreeNode, Flow, Folder } from "@/lib/types";

export default function DashboardPage() {
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showImportFlow, setShowImportFlow] = useState(false);

  // Load folder tree
  const loadTree = useCallback(async () => {
    try {
      const data = await getFolderTree();
      setTree(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadTree().finally(() => setLoading(false));
  }, [loadTree]);

  // When a flow is selected from the sidebar, fetch its full data
  const handleSelectFlow = useCallback(async (flow: Flow) => {
    const fullFlow = await getFlowByIdOrSlug(flow.slug);
    if (fullFlow) {
      setSelectedFlow(fullFlow);
      const crumbs = await getFolderBreadcrumb(fullFlow.folder_id);
      setBreadcrumbs(crumbs);
    }
  }, []);

  // Auto-select the first flow if none is selected
  useEffect(() => {
    if (!selectedFlow && tree.length > 0) {
      const findFirstFlow = (nodes: FolderTreeNode[]): Flow | null => {
        for (const node of nodes) {
          if (node.flows.length > 0) return node.flows[0];
          const found = findFirstFlow(node.children);
          if (found) return found;
        }
        return null;
      };
      const first = findFirstFlow(tree);
      if (first) handleSelectFlow(first);
    }
  }, [tree, selectedFlow, handleSelectFlow]);

  // Callback when admin creates/imports something — refresh the tree
  const handleDataChanged = useCallback(() => {
    loadTree();
  }, [loadTree]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950">
      <Header
        breadcrumbs={breadcrumbs}
        flowTitle={selectedFlow?.title || null}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tree={tree}
          loading={loading}
          selectedFlowId={selectedFlow?.id || null}
          onSelectFlow={handleSelectFlow}
          onCreateFolder={() => setShowCreateFolder(true)}
          onImportFlow={() => setShowImportFlow(true)}
          onDataChanged={handleDataChanged}
        />
        <main className="flex-1 relative overflow-hidden bg-slate-900">
          {selectedFlow ? (
            <>
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/embed/${selectedFlow.slug}`);
                    const btn = document.getElementById('copy-embed-btn');
                    if (btn) {
                      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-green-400"><path d="M20 6 9 17l-5-5"/></svg> <span class="hidden sm:inline">Copiado!</span>';
                      setTimeout(() => {
                        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> <span class="hidden sm:inline">Copiar link do diagrama</span>';
                      }, 2000);
                    }
                  }}
                  id="copy-embed-btn"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md transition-colors px-3 py-1.5 rounded-md text-sm font-medium"
                  title="Copiar link para tela de diagrama"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <span className="hidden sm:inline">Copiar link do diagrama</span>
                </button>
              </div>
              <FlowViewer flow={selectedFlow} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              {loading ? "Carregando..." : "Selecione um fluxo na barra lateral"}
            </div>
          )}
        </main>
      </div>

      {/* Admin Dialogs */}
      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        tree={tree}
        onCreated={handleDataChanged}
      />
      <ImportFlowDialog
        open={showImportFlow}
        onClose={() => setShowImportFlow(false)}
        tree={tree}
        onCreated={handleDataChanged}
      />
    </div>
  );
}
