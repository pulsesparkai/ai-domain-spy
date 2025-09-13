import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { showToast } from '@/lib/toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Network, 
  Zap, 
  RefreshCw, 
  Plus, 
  Minus, 
  Eye, 
  Settings,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NetworkMapProps {
  graphData?: any;
  onNodeUpdate?: (nodeId: string, data: any) => void;
  onRankingSimulation?: (changes: any) => void;
}

interface NetworkNode {
  id: string;
  label: string;
  type: 'domain' | 'page' | 'citation' | 'authority';
  authority: number;
  perplexityImpact: number;
  data: any;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'link' | 'citation' | 'backlink';
  strength: number;
}

export const NetworkMap = ({ graphData, onNodeUpdate, onRankingSimulation }: NetworkMapProps) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    nodes: 0,
    edges: 0,
    avgAuthority: 0,
    impactScore: 0
  });

  // Transform scan data into network format
  const transformGraphData = useCallback((data: any): { nodes: NetworkNode[], edges: NetworkEdge[] } => {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    if (!data) {
      // Create sample network for demonstration
      return {
        nodes: [
          {
            id: 'main-domain',
            label: 'Main Domain',
            type: 'domain',
            authority: 85,
            perplexityImpact: 90,
            data: { url: 'example.com', pages: 15 }
          },
          {
            id: 'authority-1',
            label: 'Wikipedia',
            type: 'authority',
            authority: 95,
            perplexityImpact: 85,
            data: { url: 'wikipedia.org', trustScore: 95 }
          },
          {
            id: 'page-1',
            label: 'Landing Page',
            type: 'page',
            authority: 70,
            perplexityImpact: 75,
            data: { url: '/landing', traffic: 1200 }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'authority-1',
            target: 'main-domain',
            type: 'backlink',
            strength: 85
          },
          {
            id: 'edge-2',
            source: 'main-domain',
            target: 'page-1',
            type: 'link',
            strength: 70
          }
        ]
      };
    }

    // Transform actual scan data
    const domain = data.domain || 'unknown';
    nodes.push({
      id: 'main-domain',
      label: domain,
      type: 'domain',
      authority: data.entityAnalysis?.brandStrength || 50,
      perplexityImpact: data.readinessScore || 50,
      data: { 
        url: domain, 
        score: data.readinessScore,
        citations: data.citations?.length || 0
      }
    });

    // Add citation nodes
    if (data.citations && Array.isArray(data.citations)) {
      data.citations.forEach((citation: any, index: number) => {
        const nodeId = `citation-${index}`;
        nodes.push({
          id: nodeId,
          label: citation.domain || `Citation ${index + 1}`,
          type: 'citation',
          authority: citation.confidence * 100 || 60,
          perplexityImpact: citation.confidence * 100 || 60,
          data: citation
        });

        edges.push({
          id: `edge-citation-${index}`,
          source: nodeId,
          target: 'main-domain',
          type: 'citation',
          strength: citation.confidence * 100 || 60
        });
      });
    }

    // Add authority nodes from entityAnalysis
    if (data.entityAnalysis?.authorityAssociations) {
      data.entityAnalysis.authorityAssociations.forEach((auth: string, index: number) => {
        const nodeId = `authority-${index}`;
        nodes.push({
          id: nodeId,
          label: auth,
          type: 'authority',
          authority: 90,
          perplexityImpact: 85,
          data: { source: auth, type: 'authority' }
        });

        edges.push({
          id: `edge-authority-${index}`,
          source: nodeId,
          target: 'main-domain',
          type: 'backlink',
          strength: 85
        });
      });
    }

    return { nodes, edges };
  }, []);

  // Get node color based on Perplexity impact
  const getNodeColor = (impact: number): string => {
    if (impact >= 80) return '#10b981'; // green-500
    if (impact >= 60) return '#f59e0b'; // amber-500
    if (impact >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  // Get edge color based on type and strength
  const getEdgeColor = (type: string, strength: number): string => {
    const opacity = Math.max(0.3, strength / 100);
    switch (type) {
      case 'backlink': return `rgba(34, 197, 94, ${opacity})`;
      case 'citation': return `rgba(59, 130, 246, ${opacity})`;
      case 'link': return `rgba(168, 85, 247, ${opacity})`;
      default: return `rgba(107, 114, 128, ${opacity})`;
    }
  };

  // Initialize Cytoscape
  useEffect(() => {
    if (!cyRef.current) return;

    const { nodes, edges } = transformGraphData(graphData);

    const elements = [
      ...nodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          authority: node.authority,
          perplexityImpact: node.perplexityImpact,
          ...node.data
        }
      })),
      ...edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          strength: edge.strength
        }
      }))
    ];

    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => getNodeColor(ele.data('perplexityImpact')),
            'label': 'data(label)',
            'width': (ele: any) => Math.max(40, ele.data('authority') / 2),
            'height': (ele: any) => Math.max(40, ele.data('authority') / 2),
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'text-outline-width': 2,
            'text-outline-color': '#000000',
            'font-size': '12px',
            'border-width': 2,
            'border-color': '#ffffff',
            'overlay-opacity': 0
          }
        },
        {
          selector: 'node[type="domain"]',
          style: {
            'shape': 'round-hexagon',
            'width': 80,
            'height': 80,
            'font-size': '14px',
            'font-weight': 'bold'
          }
        },
        {
          selector: 'node[type="authority"]',
          style: {
            'shape': 'round-diamond',
            'border-width': 3,
            'border-color': '#fbbf24'
          }
        },
        {
          selector: 'node[type="citation"]',
          style: {
            'shape': 'round-rectangle'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#8b5cf6',
            'overlay-opacity': 0.2,
            'overlay-color': '#8b5cf6'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele: any) => Math.max(2, ele.data('strength') / 20),
            'line-color': (ele: any) => getEdgeColor(ele.data('type'), ele.data('strength')),
            'target-arrow-color': (ele: any) => getEdgeColor(ele.data('type'), ele.data('strength')),
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': (ele: any) => Math.max(0.4, ele.data('strength') / 100)
          }
        },
        {
          selector: 'edge[type="backlink"]',
          style: {
            'line-style': 'solid',
            'source-arrow-shape': 'circle'
          }
        },
        {
          selector: 'edge[type="citation"]',
          style: {
            'line-style': 'dashed'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        nodeRepulsion: 400000,
        nodeOverlap: 20,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
    });

    // Event handlers
    cyInstance.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node);
      console.log('Selected node:', node.data());
    });

    cyInstance.current.on('cxttap', 'node', (evt) => {
      const node = evt.target;
      handleNodeRightClick(node);
    });

    // Update stats
    updateNetworkStats();

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
      }
    };
  }, [graphData, transformGraphData]);

  const updateNetworkStats = () => {
    if (!cyInstance.current) return;

    const nodes = cyInstance.current.nodes();
    const edges = cyInstance.current.edges();
    
    const authorities = nodes.map(n => n.data('authority') || 0);
    const avgAuthority = authorities.length > 0 
      ? authorities.reduce((a, b) => a + b, 0) / authorities.length 
      : 0;

    const impacts = nodes.map(n => n.data('perplexityImpact') || 0);
    const impactScore = impacts.length > 0 
      ? impacts.reduce((a, b) => a + b, 0) / impacts.length 
      : 0;

    setNetworkStats({
      nodes: nodes.length,
      edges: edges.length,
      avgAuthority: Math.round(avgAuthority),
      impactScore: Math.round(impactScore)
    });
  };

  const handleNodeRightClick = async (node: NodeSingular) => {
    const nodeData = node.data();
    
    try {
      toast({
        title: "Generating AI Suggestions",
        description: "Analyzing optimization opportunities..."
      });

      // Call DeepSeek API for suggestions
      const response = await fetch('https://api.pulsespark.ai/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `Suggest optimizations for ${nodeData.type}: ${nodeData.label} with authority: ${nodeData.authority} and impact: ${nodeData.perplexityImpact}`,
          isManualContent: true
        })
      });

      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      if (response.status === 404) {
        showToast.error('API Not Found', { description: 'Check backend URL' });
        return;
      }

      if (response.ok) {
        const suggestions = await response.json();
        
        toast({
          title: "AI Suggestions Generated",
          description: `Found ${suggestions.recommendations?.critical?.length || 0} critical optimizations`
        });

        onNodeUpdate?.(nodeData.id, { suggestions });
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions",
        variant: "destructive"
      });
    }
  };

  const simulateRankingImpact = async () => {
    if (!cyInstance.current) return;

    setIsSimulating(true);
    try {
      // Simulate ranking changes
      const changes = {
        networkImpact: Math.random() * 20 - 10, // -10 to +10
        authorityBoost: Math.random() * 15,
        citationIncrease: Math.floor(Math.random() * 5) + 1
      };

      // Visual feedback
      cyInstance.current.nodes().animate({
        style: {
          'background-color': '#10b981'
        }
      }, {
        duration: 500,
        complete: () => {
          setTimeout(() => {
            cyInstance.current?.nodes().style('background-color', (ele: any) => 
              getNodeColor(ele.data('perplexityImpact'))
            );
          }, 1000);
        }
      });

      toast({
        title: "Ranking Impact Simulated",
        description: `Projected impact: ${changes.networkImpact > 0 ? '+' : ''}${changes.networkImpact.toFixed(1)}% ranking boost`
      });

      onRankingSimulation?.(changes);
    } catch (error) {
      console.error('Error simulating ranking impact:', error);
    } finally {
      setTimeout(() => setIsSimulating(false), 2000);
    }
  };

  const addNode = () => {
    if (!cyInstance.current) return;

    const newNodeId = `custom-${Date.now()}`;
    cyInstance.current.add({
      data: {
        id: newNodeId,
        label: 'New Node',
        type: 'page',
        authority: 50,
        perplexityImpact: 50
      }
    });

    cyInstance.current.layout({ name: 'cose', animate: true }).run();
    updateNetworkStats();
  };

  const removeSelected = () => {
    if (!selectedNode || !cyInstance.current) return;

    cyInstance.current.remove(selectedNode);
    setSelectedNode(null);
    updateNetworkStats();
  };

  const resetLayout = () => {
    if (!cyInstance.current) return;
    
    cyInstance.current.layout({ 
      name: 'cose', 
      animate: true,
      randomize: true 
    }).run();
  };

  return (
    <div className="space-y-4">
      {/* Network Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{networkStats.nodes}</div>
                <div className="text-xs text-muted-foreground">Nodes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{networkStats.edges}</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{networkStats.avgAuthority}</div>
                <div className="text-xs text-muted-foreground">Avg Authority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{networkStats.impactScore}</div>
                <div className="text-xs text-muted-foreground">Impact Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={addNode} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Node
          </Button>
          <Button 
            onClick={removeSelected} 
            size="sm" 
            variant="outline"
            disabled={!selectedNode}
          >
            <Minus className="h-4 w-4 mr-1" />
            Remove Selected
          </Button>
          <Button onClick={resetLayout} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset Layout
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={simulateRankingImpact} 
            size="sm"
            disabled={isSimulating}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            {isSimulating ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            Simulate Impact
          </Button>
        </div>
      </div>

      {/* Network Canvas */}
      <Card className="h-[600px]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              AI Optimization Network
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                High Impact
              </Badge>
              <Badge variant="outline" className="text-amber-600">
                Medium Impact
              </Badge>
              <Badge variant="outline" className="text-red-600">
                Low Impact
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[520px]">
          <div 
            ref={cyRef} 
            className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-lg"
            style={{ cursor: 'grab' }}
          />
        </CardContent>
      </Card>

      {/* Selected Node Info */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Node Details: {selectedNode.data('label')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {selectedNode.data('type')}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Authority:</span>
                <span className="ml-2 font-medium">{selectedNode.data('authority')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Perplexity Impact:</span>
                <span className="ml-2 font-medium">{selectedNode.data('perplexityImpact')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Connections:</span>
                <span className="ml-2 font-medium">{selectedNode.degree()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};