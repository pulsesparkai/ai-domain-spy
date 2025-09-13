import React, { useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Content Creation' },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    data: { label: 'SEO Optimization' },
    position: { x: 100, y: 125 },
  },
  {
    id: '3',
    data: { label: 'AI Analysis' },
    position: { x: 400, y: 125 },
  },
  {
    id: '4',
    data: { label: 'Perplexity Integration' },
    position: { x: 250, y: 225 },
  },
  {
    id: '5',
    type: 'output',
    data: { label: 'Enhanced Visibility' },
    position: { x: 250, y: 325 },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

const WorkflowCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle>AI SEO Workflow</CardTitle>
      </CardHeader>
      <CardContent className="h-[520px] p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-muted/30"
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>
      </CardContent>
    </Card>
  );
};

export default WorkflowCanvas;