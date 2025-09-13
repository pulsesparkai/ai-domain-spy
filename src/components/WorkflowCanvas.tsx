import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus, ExternalLink, BarChart3, Search, Lightbulb, Globe } from 'lucide-react';

interface WorkflowCanvasProps {
  scanData?: any;
  onNodeAdd?: (nodeType: string) => void;
}

// Custom Node Components
const DomainScanNode = ({ data }: { data: any }) => (
  <Card className="w-80 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <Globe className="h-4 w-4" />
        Domain Scan
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Domain:</span>
          <span className="font-medium">{data?.domain || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Readiness Score:</span>
          <Badge variant={data?.readinessScore > 70 ? 'default' : 'secondary'}>
            {data?.readinessScore || 0}%
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Pages:</span>
          <span>{data?.contentAnalysis?.totalPages || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Has Schema:</span>
          <Badge variant={data?.technicalSEO?.hasSchema ? 'default' : 'outline'}>
            {data?.technicalSEO?.hasSchema ? 'Yes' : 'No'}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CitationAnalysisNode = ({ data }: { data: any }) => (
  <Card className="w-80 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <ExternalLink className="h-4 w-4" />
        Citation Analysis
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Citations:</span>
          <span className="font-medium">{data?.citations?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Authority Links:</span>
          <span>{data?.entityAnalysis?.authorityAssociations?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Brand Mentions:</span>
          <span>{data?.entityAnalysis?.mentions || 0}</span>
        </div>
        {data?.citations?.slice(0, 2).map((citation: any, idx: number) => (
          <div key={idx} className="bg-background/50 p-2 rounded border">
            <div className="font-medium truncate">{citation.title}</div>
            <div className="text-muted-foreground truncate">{citation.domain}</div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const PerplexitySimulationNode = ({ data }: { data: any }) => (
  <Card className="w-80 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <Search className="h-4 w-4" />
        Perplexity Simulation
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rankings Found:</span>
          <span className="font-medium">{data?.rankings?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">FAQ Sections:</span>
          <span>{data?.faq?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Data Tables:</span>
          <span>{data?.tables?.length || 0}</span>
        </div>
        {data?.rankings?.slice(0, 2).map((ranking: any, idx: number) => (
          <div key={idx} className="bg-background/50 p-2 rounded border">
            <div className="font-medium truncate">{ranking.prompt_or_query}</div>
            <div className="text-muted-foreground">Position: #{ranking.position}</div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const OptimizationsNode = ({ data }: { data: any }) => (
  <Card className="w-80 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <Lightbulb className="h-4 w-4" />
        Optimizations
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Critical Issues:</span>
          <span className="font-medium text-red-600">
            {data?.recommendations?.critical?.length || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Important Items:</span>
          <span className="text-amber-600">
            {data?.recommendations?.important?.length || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nice to Have:</span>
          <span className="text-green-600">
            {data?.recommendations?.nice_to_have?.length || 0}
          </span>
        </div>
        <div className="space-y-1">
          {data?.recommendations?.critical?.slice(0, 2).map((rec: string, idx: number) => (
            <div key={idx} className="bg-red-50 p-1 rounded text-red-700 text-xs">
              • {rec}
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Node types
const nodeTypes = {
  domainScan: DomainScanNode,
  citationAnalysis: CitationAnalysisNode,
  perplexitySimulation: PerplexitySimulationNode,
  optimizations: OptimizationsNode,
};

const initialNodes: Node[] = [
  {
    id: 'domain-scan',
    type: 'domainScan',
    position: { x: 100, y: 100 },
    data: {},
  },
  {
    id: 'citation-analysis',
    type: 'citationAnalysis',
    position: { x: 500, y: 100 },
    data: {},
  },
  {
    id: 'perplexity-simulation',
    type: 'perplexitySimulation',
    position: { x: 900, y: 100 },
    data: {},
  },
  {
    id: 'optimizations',
    type: 'optimizations',
    position: { x: 700, y: 350 },
    data: {},
  },
];

const initialEdges: Edge[] = [
  {
    id: 'domain-to-citation',
    source: 'domain-scan',
    target: 'citation-analysis',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'citation-to-perplexity',
    source: 'citation-analysis',
    target: 'perplexity-simulation',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'citation-to-optimizations',
    source: 'citation-analysis',
    target: 'optimizations',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'perplexity-to-optimizations',
    source: 'perplexity-simulation',
    target: 'optimizations',
    type: 'smoothstep',
    animated: true,
  },
];

export const WorkflowCanvas = ({ scanData, onNodeAdd }: WorkflowCanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes with scan data when it changes
  useEffect(() => {
    if (scanData) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: { ...node.data, ...scanData },
        }))
      );
    }
  }, [scanData, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addCustomNode = (type: string) => {
    const newNode: Node = {
      id: `custom-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 400 + 200 },
      data: { 
        label: `Custom ${type}`,
        customType: type 
      },
    };
    setNodes((nds) => nds.concat(newNode));
    onNodeAdd?.(type);
  };

  return (
    <div className="w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Panel position="top-left" className="bg-background/80 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">AI Optimization Workflow</span>
          </div>
        </Panel>
        
        <Panel position="top-right" className="space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => addCustomNode('Analysis')}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Node
          </Button>
        </Panel>

        <Controls className="bg-background/80 backdrop-blur-sm rounded-lg" />
        <MiniMap 
          className="bg-background/80 backdrop-blur-sm rounded-lg" 
          nodeColor={(node) => {
            switch (node.type) {
              case 'domainScan': return '#8b5cf6';
              case 'citationAnalysis': return '#3b82f6';
              case 'perplexitySimulation': return '#10b981';
              case 'optimizations': return '#f59e0b';
              default: return '#6b7280';
            }
          }}
        />
        <Background gap={20} size={1} color="#e5e7eb" />
      </ReactFlow>
    </div>
  );
};