import React, { useState, useEffect, useMemo } from 'react';
import { Network, Search, Filter, ZoomIn, ZoomOut, RotateCcw, Info, ExternalLink, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface GraphNode {
  id: string;
  label: string;
  type: 'CPSE' | 'MATERIAL' | 'CNMC' | 'SUPPLIER';
  metadata: Record<string, any>;
  x?: number;
  y?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export const KnowledgeGraphView: React.FC<{ onSelectMaterial?: (id: number) => void }> = ({ onSelectMaterial }) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const data = await api.getKnowledgeGraph();
        
        // Calculate stable layout coordinates
        // Layout columns:
        // Left (x=160): CPSEs
        // Middle-Left (x=460): Local Materials
        // Middle-Right (x=780): Proposed CNMCs
        // Right (x=1080): Certified Suppliers
        const cpseNodes = data.nodes.filter(n => n.type === 'CPSE');
        const matNodes = data.nodes.filter(n => n.type === 'MATERIAL');
        const cnmcNodes = data.nodes.filter(n => n.type === 'CNMC');
        const supNodes = data.nodes.filter(n => n.type === 'SUPPLIER');

        const positionedNodes: GraphNode[] = [];

        cpseNodes.forEach((n, idx) => {
          positionedNodes.push({
            ...n,
            x: 140,
            y: 90 + idx * 75
          });
        });

        matNodes.forEach((n, idx) => {
          positionedNodes.push({
            ...n,
            x: 430,
            y: 60 + idx * 60
          });
        });

        cnmcNodes.forEach((n, idx) => {
          positionedNodes.push({
            ...n,
            x: 750,
            y: 90 + idx * 95
          });
        });

        supNodes.forEach((n, idx) => {
          positionedNodes.push({
            ...n,
            x: 1050,
            y: 110 + idx * 110
          });
        });

        setNodes(positionedNodes);
        setEdges(data.edges);
        if (positionedNodes.length > 0) {
          // default select first CNMC or CPSE
          const defaultSelect = positionedNodes.find(n => n.type === 'CNMC') || positionedNodes[0];
          setSelectedNode(defaultSelect);
        }
      } catch (err) {
        console.error('Failed to load knowledge graph:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  // Map of node positions by ID
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Connected edges for the selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [selectedNode, edges]);

  // Connected node IDs
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedNode) {
      ids.add(selectedNode.id);
      connectedEdges.forEach(e => {
        ids.add(e.source);
        ids.add(e.target);
      });
    }
    return ids;
  }, [selectedNode, connectedEdges]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getNodeColor = (type: string, isSelected: boolean, isConnected: boolean) => {
    if (isSelected) return '#2563eb'; // blue-600 active
    switch (type) {
      case 'CPSE':
        return '#0284c7'; // sky-600
      case 'MATERIAL':
        return '#7c3aed'; // violet-600
      case 'CNMC':
        return '#059669'; // emerald-600
      case 'SUPPLIER':
        return '#d97706'; // amber-600
      default:
        return '#64748b';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Inter-CPSE Material Knowledge Graph</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {nodes.length} Nodes &bull; {edges.length} Semantic Edges
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Semantic multi-tier graph linking CPSE parent plants, local legacy master codes, Proposed CNMC standards, and vetted industrial suppliers
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-semibold">
            Graph Engine v1.4
          </span>
        </div>
      </div>

      {/* Main Graph Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* SVG Canvas Area (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px] relative">
          {/* Top Canvas Toolbar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 z-10">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Highlight:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 font-medium text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Entity Types</option>
                <option value="CPSE">CPSE Enterprises</option>
                <option value="MATERIAL">Local Material Codes</option>
                <option value="CNMC">Proposed CNMC Standards</option>
                <option value="SUPPLIER">Approved Suppliers</option>
              </select>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                <span className="text-slate-600 font-medium">CPSE</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
                <span className="text-slate-600 font-medium">Local Material</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-slate-600 font-medium">Proposed CNMC</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span className="text-slate-600 font-medium">Supplier</span>
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded px-1 py-0.5 shadow-2xs">
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.0))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div
            className="flex-1 bg-slate-50/50 cursor-grab active:cursor-grabbing overflow-hidden relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                Building multi-tier semantic material graph...
              </div>
            ) : (
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 1200 700"
                className="select-none"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="18"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                  </marker>
                  <marker
                    id="arrowhead-highlight"
                    markerWidth="8"
                    markerHeight="6"
                    refX="18"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#2563eb" />
                  </marker>
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {edges.map((edge) => {
                    const src = nodeMap.get(edge.source);
                    const tgt = nodeMap.get(edge.target);
                    if (!src || !tgt) return null;

                    const isHighlight =
                      selectedNode &&
                      (edge.source === selectedNode.id || edge.target === selectedNode.id);

                    return (
                      <g key={edge.id}>
                        <line
                          x1={src.x}
                          y1={src.y}
                          x2={tgt.x}
                          y2={tgt.y}
                          stroke={isHighlight ? '#2563eb' : '#cbd5e1'}
                          strokeWidth={isHighlight ? 2.5 : 1.2}
                          strokeDasharray={edge.label === 'maps_to' ? '4 2' : undefined}
                          markerEnd={isHighlight ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                          className="transition-all"
                        />
                        <text
                          x={((src.x || 0) + (tgt.x || 0)) / 2}
                          y={((src.y || 0) + (tgt.y || 0)) / 2 - 4}
                          textAnchor="middle"
                          fill={isHighlight ? '#1d4ed8' : '#94a3b8'}
                          fontSize={9}
                          fontWeight={isHighlight ? '600' : 'normal'}
                          className="pointer-events-none select-none"
                        >
                          {edge.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isConnected = connectedNodeIds.has(node.id);
                    const isTypeFiltered = filterType !== 'ALL' && node.type !== filterType;
                    const opacity = isTypeFiltered ? 0.2 : isConnected || !selectedNode ? 1 : 0.45;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node);
                        }}
                        className="cursor-pointer transition-transform duration-150"
                        opacity={opacity}
                      >
                        <circle
                          r={isSelected ? 22 : 18}
                          fill={getNodeColor(node.type, isSelected, isConnected)}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 3 : 2}
                          className="filter drop-shadow-sm hover:brightness-110"
                        />
                        <text
                          y={node.type === 'CNMC' ? 32 : 30}
                          textAnchor="middle"
                          fill="#1e293b"
                          fontSize={isSelected ? 11 : 10}
                          fontWeight={isSelected ? '700' : '600'}
                          className="select-none pointer-events-none"
                        >
                          {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                        </text>
                        <text
                          y={node.type === 'CNMC' ? 44 : 41}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize={8.5}
                          className="select-none pointer-events-none font-mono"
                        >
                          {node.type}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Node Inspector Drawer (1 col) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Graph Entity Inspector
            </span>
            {selectedNode ? (
              <div>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedNode.type === 'CPSE'
                        ? 'bg-sky-600'
                        : selectedNode.type === 'MATERIAL'
                        ? 'bg-violet-600'
                        : selectedNode.type === 'CNMC'
                        ? 'bg-emerald-600'
                        : 'bg-amber-600'
                    }`}
                  ></span>
                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                    {selectedNode.type}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedNode.label}</h3>
              </div>
            ) : (
              <p className="text-slate-500 text-xs mt-1">Click on any node in the graph to inspect metadata and connections.</p>
            )}
          </div>

          {selectedNode && (
            <>
              {/* Node Metadata Attributes */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Entity Attributes
                </span>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5 font-mono text-[11px]">
                  {Object.entries(selectedNode.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-start gap-2">
                      <span className="text-slate-500 capitalize">{k}:</span>
                      <span className="font-semibold text-slate-800 text-right">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Relationships */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Connected Edges ({connectedEdges.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {connectedEdges.map((edge) => {
                    const isOutgoing = edge.source === selectedNode.id;
                    const otherNodeId = isOutgoing ? edge.target : edge.source;
                    const otherNode = nodeMap.get(otherNodeId);

                    return (
                      <button
                        key={edge.id}
                        onClick={() => otherNode && setSelectedNode(otherNode)}
                        className="w-full p-2 bg-white hover:bg-slate-50 rounded border border-slate-200 text-left transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {otherNode?.label || otherNodeId}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {isOutgoing ? `→ ${edge.label}` : `← ${edge.label}`}
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {otherNode?.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Action Button */}
              {selectedNode.type === 'MATERIAL' && onSelectMaterial && (
                <button
                  onClick={() => {
                    const idNum = parseInt(selectedNode.id.replace('mat_', ''), 10);
                    if (!isNaN(idNum)) onSelectMaterial(idNum);
                  }}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Material Master</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
