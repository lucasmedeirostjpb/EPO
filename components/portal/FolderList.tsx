"use client";

import React from "react";
import type { FolderTreeNode, Flow } from "@/lib/types";
import { FileText, ArrowRight, ExternalLink, ChevronRight } from "lucide-react";

interface FolderListProps {
  node: FolderTreeNode;
}

interface GroupedFlows {
  folderName: string;
  flows: Flow[];
}

export default function FolderList({ node }: FolderListProps) {
  // Coletar todos os fluxos recursivamente, agrupados por caminho de pasta
  const collectAllFlows = (targetNode: FolderTreeNode, path: string = "", results: GroupedFlows[] = []) => {
    const currentPath = path ? `${path} › ${targetNode.folder.name}` : targetNode.folder.name;

    // Se a pasta atual tem fluxos, adiciona ao grupo
    if (targetNode.flows && targetNode.flows.length > 0) {
      results.push({
        folderName: currentPath,
        flows: targetNode.flows,
      });
    }

    // Processar subpastas
    targetNode.children.forEach((child) => {
      collectAllFlows(child, currentPath, results);
    });

    return results;
  };

  const groupedResults = collectAllFlows(node);
  const totalFlows = groupedResults.reduce((acc, group) => acc + group.flows.length, 0);

  const openFlow = (flow: Flow) => {
    // Usar slug se houver, senão usar o ID como fallback (ajustando a rota se necessário)
    // Mas por enquanto, garantimos que não abra um link quebrado
    const identifier = flow.slug || flow.id;
    if (identifier) {
      window.open(`/fluxo/${identifier}`, "_blank");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-[#0d1f35]/10 pb-6 gap-4">
        <div>
          <h2 className="text-[2.2rem] font-bold text-[#0d1f35] tracking-tight m-0 mb-1">
            {node.folder.name}
          </h2>
          <p className="text-[#5a7090] text-[0.95rem]">
            Explorando processos em {node.folder.name} e subcategorias
          </p>
        </div>
        <div className="bg-[#c8a84b] text-white px-5 py-2 rounded-full text-[0.85rem] font-black uppercase tracking-widest shadow-lg shadow-[#c8a84b]/20 shrink-0 self-start md:self-center">
          {totalFlows} {totalFlows === 1 ? "Fluxo" : "Fluxos"}
        </div>
      </div>

      {totalFlows === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-[0_4px_24px_rgba(13,31,53,0.06)] border border-dashed border-[#0d1f35]/10">
          <div className="bg-[#f4f6f9] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-[#0d1f35]/20" />
          </div>
          <h3 className="text-[#0d1f35] font-bold text-[1.1rem] mb-2">Nenhum fluxo encontrado</h3>
          <p className="text-[#5a7090] text-[0.95rem] max-w-md mx-auto">
            Ainda não há mapeamentos publicados para esta categoria ou suas subpastas.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedResults.map((group) => (
            <div key={group.folderName} className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-[2px] w-8 bg-[#c8a84b]"></div>
                <h3 className="text-[1.1rem] font-bold text-[#0d1f35] uppercase tracking-widest flex items-center gap-2">
                  {group.folderName}
                  <span className="text-[#c8a84b] text-[0.9rem]">({group.flows.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.flows.map((flow) => (
                  <button
                    key={flow.id}
                    onClick={() => openFlow(flow)}
                    className="group relative bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(13,31,53,0.05)] hover:shadow-[0_15px_45px_rgba(13,31,53,0.12)] border border-[#0d1f35]/5 transition-all duration-500 text-left flex flex-col justify-between overflow-hidden"
                  >
                    {/* Decorative Accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#0d1f35]/[0.02] group-hover:bg-[#c8a84b]/[0.05] rounded-bl-full transition-colors duration-500"></div>
                    
                    <div>
                      <div className="bg-[#0d1f35] w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 group-hover:bg-[#c8a84b] transition-all duration-500">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="font-extrabold text-[1.25rem] text-[#0d1f35] mb-3 leading-tight group-hover:text-[#c8a84b] transition-colors duration-500">
                        {flow.title}
                      </h4>
                      <p className="text-[0.9rem] text-[#5a7090] leading-relaxed mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                        Toque para visualizar os detalhes e o fluxograma completo deste processo.
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-[#c8a84b] font-black text-[0.8rem] uppercase tracking-widest">
                        Visualizar <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-10 h-10 rounded-full border border-[#0d1f35]/10 flex items-center justify-center group-hover:bg-[#0d1f35] group-hover:border-[#0d1f35] transition-all duration-500">
                        <ArrowRight className="w-5 h-5 text-[#0d1f35] group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
