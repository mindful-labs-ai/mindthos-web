import { Point, Rect } from '../types/types.js';
import { LayoutState, NodeLayout } from './layout-state.js';

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  generationHeight: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 40,
  nodeHeight: 40,
  horizontalGap: 60,
  verticalGap: 80,
  generationHeight: 120,
};

export class LayoutEngine {
  private config: LayoutConfig;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  snapToGrid(point: Point, gridSize: number): Point {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }

  getGenerationY(generation: number, baseY: number = 300): number {
    return baseY + generation * this.config.generationHeight;
  }

  calculatePartnerPosition(existingPos: Point): Point {
    return {
      x: existingPos.x + this.config.nodeWidth + this.config.horizontalGap,
      y: existingPos.y,
    };
  }

  calculateChildPosition(
    parentPositions: Point[],
    siblingIndex: number
  ): Point {
    if (parentPositions.length === 0) {
      return { x: 0, y: 0 };
    }

    const centerX =
      parentPositions.reduce((sum, p) => sum + p.x, 0) / parentPositions.length;

    const totalWidth =
      (siblingIndex + 1) * (this.config.nodeWidth + this.config.horizontalGap);
    const startX = centerX - totalWidth / 2;

    return {
      x:
        startX +
        siblingIndex * (this.config.nodeWidth + this.config.horizontalGap),
      y: parentPositions[0].y + this.config.generationHeight,
    };
  }

  calculateVirtualAnchor(pos1: Point, pos2: Point): Point {
    return {
      x: (pos1.x + pos2.x) / 2,
      y: (pos1.y + pos2.y) / 2,
    };
  }

  checkCollision(
    position: Point,
    existingNodes: NodeLayout[],
    excludeId?: string
  ): boolean {
    const halfW = this.config.nodeWidth / 2;
    const halfH = this.config.nodeHeight / 2;

    return existingNodes.some((node) => {
      if (excludeId && node.nodeId === excludeId) return false;

      const dx = Math.abs(position.x - node.position.x);
      const dy = Math.abs(position.y - node.position.y);

      return (
        dx < this.config.nodeWidth + 10 && dy < this.config.nodeHeight + 10
      );
    });
  }

  findNonCollidingPosition(
    preferredPos: Point,
    existingNodes: NodeLayout[],
    excludeId?: string
  ): Point {
    if (!this.checkCollision(preferredPos, existingNodes, excludeId)) {
      return preferredPos;
    }

    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
    ];

    const step = this.config.horizontalGap;

    for (let distance = 1; distance <= 10; distance++) {
      for (const dir of directions) {
        const testPos = {
          x: preferredPos.x + dir.x * step * distance,
          y: preferredPos.y + dir.y * step * distance,
        };

        if (!this.checkCollision(testPos, existingNodes, excludeId)) {
          return testPos;
        }
      }
    }

    return preferredPos;
  }

  autoLayoutByGeneration(layout: LayoutState): void {
    const nodesByGeneration = new Map<number, NodeLayout[]>();

    layout.nodes.forEach((node) => {
      const gen = node.generation;
      if (!nodesByGeneration.has(gen)) {
        nodesByGeneration.set(gen, []);
      }
      nodesByGeneration.get(gen)!.push(node);
    });

    const sortedGenerations = Array.from(nodesByGeneration.keys()).sort(
      (a, b) => a - b
    );

    const baseY = 300;
    const centerX = 400;

    sortedGenerations.forEach((gen) => {
      const nodes = nodesByGeneration.get(gen)!;
      const totalWidth =
        nodes.length * this.config.nodeWidth +
        (nodes.length - 1) * this.config.horizontalGap;
      let startX = centerX - totalWidth / 2;

      nodes.forEach((node, index) => {
        node.position = {
          x:
            startX +
            index * (this.config.nodeWidth + this.config.horizontalGap),
          y: this.getGenerationY(gen, baseY),
        };
      });
    });
  }

  calculateEdgePath(
    sourcePos: Point,
    targetPos: Point,
    isVertical: boolean = false
  ): Point[] {
    if (!isVertical) {
      return [sourcePos, targetPos];
    }

    const midY = (sourcePos.y + targetPos.y) / 2;
    return [
      sourcePos,
      { x: sourcePos.x, y: midY },
      { x: targetPos.x, y: midY },
      targetPos,
    ];
  }

  getNodeBounds(node: NodeLayout): Rect {
    return {
      x: node.position.x - this.config.nodeWidth / 2,
      y: node.position.y - this.config.nodeHeight / 2,
      width: this.config.nodeWidth,
      height: this.config.nodeHeight,
    };
  }

  isPointInNode(point: Point, node: NodeLayout): boolean {
    const bounds = this.getNodeBounds(node);
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  findNodeAtPoint(layout: LayoutState, point: Point): NodeLayout | undefined {
    let topNode: NodeLayout | undefined;
    let topZ = -Infinity;

    layout.nodes.forEach((node) => {
      if (!node.isVisible) return;
      if (this.isPointInNode(point, node) && node.zIndex > topZ) {
        topNode = node;
        topZ = node.zIndex;
      }
    });

    return topNode;
  }

  findNodesInRect(layout: LayoutState, rect: Rect): NodeLayout[] {
    const result: NodeLayout[] = [];

    layout.nodes.forEach((node) => {
      if (!node.isVisible) return;

      const bounds = this.getNodeBounds(node);
      const overlaps =
        bounds.x < rect.x + rect.width &&
        bounds.x + bounds.width > rect.x &&
        bounds.y < rect.y + rect.height &&
        bounds.y + bounds.height > rect.y;

      if (overlaps) {
        result.push(node);
      }
    });

    return result;
  }
}
