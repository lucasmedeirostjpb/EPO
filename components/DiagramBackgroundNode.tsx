import React, { memo } from 'react';
import { NodeProps, Node } from '@xyflow/react';

export type DiagramBackgroundNodeData = {
  imageUrl: string;
  width: number;
  height: number;
};

export type DiagramBackgroundNodeType = Node<DiagramBackgroundNodeData, 'diagramBackground'>;

function DiagramBackgroundNode({ data }: NodeProps<DiagramBackgroundNodeType>) {
  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        backgroundImage: `url('${data.imageUrl}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

export default memo(DiagramBackgroundNode);
