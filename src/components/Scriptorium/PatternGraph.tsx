import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, useTheme } from '@mui/material';
import { PatternType } from '../../../node-backend/src/types/observation';

interface Pattern {
  type: PatternType;
  examples: string[];
  explanation: string;
  significance: number;
}

interface PatternNode extends d3.SimulationNodeDatum {
  id: string;
  type: PatternType;
  significance: number;
  group: string;
}

interface PatternLink extends d3.SimulationLinkDatum<PatternNode> {
  value: number;
}

interface PatternGraphProps {
  patterns: Pattern[];
  width?: number;
  height?: number;
}

// Valid pattern types
const VALID_PATTERN_TYPES: PatternType[] = [
  'rhyme',
  'assonance',
  'consonance',
  'alliteration',
  'rhythm',
  'sibilance',
  'fricative',
  'plosive',
  'liquid',
  'nasal_harmony',
  'internal_rhyme',
  'slant_rhyme',
  'repetition',
  'code_switching',
  'cultural_resonance',
  'emotional_emphasis'
];

export const PatternGraph: React.FC<PatternGraphProps> = ({
  patterns,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!svgRef.current || patterns.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Validate pattern types
    const validPatterns = patterns.filter(pattern => {
      const isValid = VALID_PATTERN_TYPES.includes(pattern.type);
      if (!isValid) {
        console.warn(`Invalid pattern type: ${pattern.type}`);
      }
      return isValid;
    });

    if (validPatterns.length === 0) {
      console.warn('No valid patterns to display');
      return;
    }

    // Group patterns by type
    const patternGroups = validPatterns.reduce((groups, pattern) => {
      const baseType = pattern.type.split('_')[0];
      if (!groups[baseType]) groups[baseType] = [];
      groups[baseType].push(pattern);
      return groups;
    }, {} as Record<string, Pattern[]>);

    // Create nodes with proper typing
    const nodes: PatternNode[] = validPatterns.map(pattern => ({
      id: pattern.type,
      type: pattern.type,
      significance: pattern.significance,
      group: pattern.type.split('_')[0],
      x: width / 2,
      y: height / 2,
      fx: null,
      fy: null,
      vx: 0,
      vy: 0
    }));

    // Create links between related patterns
    const links: PatternLink[] = [];
    validPatterns.forEach((p1, i) => {
      validPatterns.forEach((p2, j) => {
        if (i < j) {
          // Patterns in same group
          if (p1.type.split('_')[0] === p2.type.split('_')[0]) {
            links.push({
              source: nodes[i],
              target: nodes[j],
              value: 0.5
            });
          }
          // Patterns sharing examples
          const sharedExamples = p1.examples.filter(ex => p2.examples.includes(ex));
          if (sharedExamples.length > 0) {
            links.push({
              source: nodes[i],
              target: nodes[j],
              value: sharedExamples.length / Math.max(p1.examples.length, p2.examples.length)
            });
          }
        }
      });
    });

    // Create color scale for pattern groups
    const colorScale = d3.scaleOrdinal<string>()
      .domain(Object.keys(patternGroups))
      .range([
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.info.main,
        theme.palette.success.main,
        theme.palette.warning.main
      ]);

    // Create force simulation with proper typing
    const simulation = d3.forceSimulation<PatternNode>(nodes)
      .force('link', d3.forceLink<PatternNode, PatternLink>(links)
        .id((d: PatternNode) => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => 30 + (d as PatternNode).significance * 20));

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create gradient definitions for nodes
    const defs = svg.append('defs');
    nodes.forEach(node => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${node.id}`);
      
      const baseColor = d3.color(colorScale(node.group));
      if (!baseColor) return;

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', baseColor.toString());
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', baseColor.darker(0.5).toString());
    });

    // Draw links with proper typing
    const link = svg.append('g')
      .selectAll<SVGLineElement, PatternLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', theme.palette.text.secondary)
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', d => d.value * 2);

    // Create node groups with proper typing
    const node = svg.append('g')
      .selectAll<SVGGElement, PatternNode>('g')
      .data(nodes)
      .join('g');

    // Add drag behavior
    const drag = d3.drag<SVGGElement, PatternNode>()
      .on('start', (event: d3.D3DragEvent<SVGGElement, PatternNode, unknown>, d: PatternNode) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: d3.D3DragEvent<SVGGElement, PatternNode, unknown>, d: PatternNode) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: d3.D3DragEvent<SVGGElement, PatternNode, unknown>, d: PatternNode) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => 30 + d.significance * 20)
      .attr('fill', d => `url(#gradient-${d.id})`)
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text(d => d.type.split('_').join(' '))
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', theme.palette.text.primary)
      .attr('font-size', '12px')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as PatternNode).x ?? 0)
        .attr('y1', d => (d.source as PatternNode).y ?? 0)
        .attr('x2', d => (d.target as PatternNode).x ?? 0)
        .attr('y2', d => (d.target as PatternNode).y ?? 0);

      node
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [patterns, width, height, theme]);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      bgcolor: 'background.default',
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      <svg ref={svgRef} />
    </Box>
  );
}; 