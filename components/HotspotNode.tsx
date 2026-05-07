import React, { memo } from 'react';
import { NodeProps, Node } from '@xyflow/react';

export type HotspotNodeData = {
  name: string;
  description: string;
};

export type HotspotNodeType = Node<HotspotNodeData, 'hotspot'>;

function HotspotNode({ data }: NodeProps<HotspotNodeType>) {
  return (
    <div 
      className="w-full h-full bg-transparent hover:bg-black/5 border border-transparent hover:border-black cursor-pointer transition-all" 
    />
  );
}

export default memo(HotspotNode);
