"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlignLeft, Info } from "lucide-react";

import DiagramBackgroundNode, { DiagramBackgroundNodeType } from "./DiagramBackgroundNode";
import HotspotNode, { HotspotNodeType } from "./HotspotNode";
import type { Flow } from "@/lib/types";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const nodeTypes = {
  diagramBackground: DiagramBackgroundNode,
  hotspot: HotspotNode,
};

type AppNode = DiagramBackgroundNodeType | HotspotNodeType;

interface FlowViewerProps {
  flow: Flow;
}

export default function FlowViewer({ flow }: FlowViewerProps) {
  const [selectedNodeData, setSelectedNodeData] = useState<{
    name: string;
    description: string;
  } | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);

  useEffect(() => {
    // Parse bizagi_data from the flow
    const bizagiData = flow.bizagi_data as any;
    if (!bizagiData) return;

    const page = bizagiData.pages && bizagiData.pages.length > 0 ? bizagiData.pages[0] : null;
    if (!page) return;

    // Use svg_url from the flow record, or fall back to extracting from page.image
    const imageUrl = flow.svg_url || (() => {
      const imageName = (page.image || "").split("\\").pop() || (page.image || "").split("/").pop();
      return `/${imageName}`;
    })();

    // Extract hotspots
    const hotspots: AppNode[] = [];
    const extractElements = (elements: any[]) => {
      for (const el of elements) {
        if (el.imageBounds && el.imageBounds.points && el.imageBounds.points.length > 0) {
          if (el.elementType !== "Participant" && el.elementType !== "SequenceFlow" && el.elementType !== "MessageFlow") {
             hotspots.push({
               id: `hotspot-${el.id}`,
               type: "hotspot",
               position: {
                 x: el.imageBounds.points[0].x,
                 y: el.imageBounds.points[0].y,
               },
               data: {
                 name: el.name || "Sem Nome",
                 description: el.description || "",
               },
               style: {
                 width: el.imageBounds.width,
                 height: el.imageBounds.height,
               },
               draggable: false,
               selectable: false,
               zIndex: 10,
             });
          }
        }
        if (el.pageElements) extractElements(el.pageElements);
        if (el.elements) extractElements(el.elements);
      }
    };

    if ((page as any).elements) extractElements((page as any).elements);
    if ((page as any).pageElements) extractElements((page as any).pageElements);

    // Fetch SVG to read its exact native ViewBox coordinates and size
    fetch(imageUrl as string)
      .then(res => res.text())
      .then(text => {
        let vw = 2000, vh = 1000;
        const match = text.match(/viewBox="([^"]+)"/);
        if (match) {
          const parts = match[1].split(',').map(s => parseFloat(s.trim()));
          if (parts.length === 4) {
            vw = parts[2];
            vh = parts[3];
          }
        }

        const newNodes: AppNode[] = [
          {
            id: "diagram-bg",
            type: "diagramBackground",
            position: { x: 0, y: 0 },
            data: { imageUrl: imageUrl as string, width: vw, height: vh },
            draggable: false,
            selectable: false,
            zIndex: -1,
          },
          ...hotspots,
        ];
        
        setNodes(newNodes);
      })
      .catch(console.error);
  }, [flow, setNodes]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    if (node.type === "hotspot" && node.data) {
      setSelectedNodeData({
        name: node.data.name as string,
        description: node.data.description as string,
      });
    }
  }, []);

  return (
    <div className="w-full h-full bg-slate-50">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <MiniMap />
        <Controls className="pb-2" />
      </ReactFlow>

      <Sheet open={!!selectedNodeData} onOpenChange={(open) => !open && setSelectedNodeData(null)}>
        <SheetContent className="sm:max-w-[450px] overflow-y-auto bg-slate-950 border-l border-slate-800 text-slate-300">
          <SheetHeader className="mb-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" /> Detalhes da Etapa
            </h2>
            <SheetTitle className="text-xl font-bold text-slate-100">
              {selectedNodeData?.name || "Sem título"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* Description Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <AlignLeft className="w-4 h-4" />
                Descrição
              </div>
              {selectedNodeData?.description ? (
                <div
                  className="text-sm leading-relaxed [&_*]:!text-slate-300 [&_span]:!text-slate-300 [&_p]:!text-slate-300 text-slate-300"
                  dangerouslySetInnerHTML={{ __html: selectedNodeData.description }}
                />
              ) : (
                <p className="text-sm text-slate-500 italic">Nenhuma descrição detalhada disponível.</p>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
