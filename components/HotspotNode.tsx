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
      className="w-full h-full bg-transparent hover:bg-blue-500/20 border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all rounded-md" 
    />
  );
}

export default memo(HotspotNode);
