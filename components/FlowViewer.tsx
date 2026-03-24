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

import DiagramBackgroundNode, { DiagramBackgroundNodeType } from "./DiagramBackgroundNode";
import HotspotNode, { HotspotNodeType } from "./HotspotNode";
import { BizagiData } from "@/lib/bizagi-data";

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

export default function FlowViewer() {
  const [selectedNodeData, setSelectedNodeData] = useState<{
    name: string;
    description: string;
  } | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);

  useEffect(() => {
    const page = BizagiData.pages && BizagiData.pages.length > 0 ? BizagiData.pages[0] : null; 
    if (!page) return;

    const imageName = page.image.split("\\").pop() || page.image.split("/").pop();
    const imageUrl = `/${imageName}`;

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
    fetch(imageUrl)
      .then(res => res.text())
      .then(text => {
        let vx = 0, vy = 0, vw = 2000, vh = 1000;
        const match = text.match(/viewBox="([^"]+)"/);
        if (match) {
          const parts = match[1].split(',').map(s => parseFloat(s.trim()));
          if (parts.length === 4) {
            vx = parts[0];
            vy = parts[1];
            vw = parts[2];
            vh = parts[3];
          }
        }

        const newNodes: AppNode[] = [
          {
            id: "diagram-bg",
            type: "diagramBackground",
            position: { x: 0, y: 0 },
            data: { imageUrl, width: vw, height: vh },
            draggable: false,
            selectable: false,
            zIndex: -1,
          },
          ...hotspots,
        ];
        
        setNodes(newNodes);
      })
      .catch(console.error);
  }, [setNodes]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    if (node.type === "hotspot" && node.data) {
      setSelectedNodeData({
        name: node.data.name as string,
        description: node.data.description as string,
      });
    }
  }, []);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900">
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
        <Controls />
      </ReactFlow>

      <Sheet open={!!selectedNodeData} onOpenChange={(open) => !open && setSelectedNodeData(null)}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold tracking-tight mb-4">
              {selectedNodeData?.name || "Sem título"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 bg-white dark:bg-slate-950 p-4 rounded-md shadow-sm border">
            {selectedNodeData?.description ? (
              <div
                className="text-foreground text-base leading-relaxed max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: selectedNodeData.description }}
              />
            ) : (
              <p className="text-muted-foreground italic">Nenhuma descrição detalhada disponível para esta etapa.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
