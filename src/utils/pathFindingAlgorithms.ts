import { GridNode } from '../types/pathfinding';

export function dijkstra(grid: GridNode[][], startNode: GridNode, finishNode: GridNode): GridNode[] {
  const visitedNodesInOrder: GridNode[] = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;
    
    if (closestNode.type === 'wall') continue;
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    
    if (closestNode === finishNode) return visitedNodesInOrder;
    
    updateUnvisitedNeighbors(closestNode, grid);
  }
  
  return visitedNodesInOrder;
}

export function astar(grid: GridNode[][], startNode: GridNode, finishNode: GridNode): GridNode[] {
  const visitedNodesInOrder: GridNode[] = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);
  
  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;
    
    if (closestNode.type === 'wall') continue;
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    
    if (closestNode === finishNode) return visitedNodesInOrder;
    
    updateUnvisitedNeighborsAstar(closestNode, grid, finishNode);
  }
  
  return visitedNodesInOrder;
}

export function bfs(grid: GridNode[][], startNode: GridNode, finishNode: GridNode): GridNode[] {
  const visitedNodesInOrder: GridNode[] = [];
  const queue: GridNode[] = [startNode];
  startNode.isVisited = true;
  
  while (queue.length) {
    const currentNode = queue.shift()!;
    visitedNodesInOrder.push(currentNode);
    
    if (currentNode === finishNode) return visitedNodesInOrder;
    
    const neighbors = getUnvisitedNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && neighbor.type !== 'wall') {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        queue.push(neighbor);
      }
    }
  }
  
  return visitedNodesInOrder;
}

export function getNodesInShortestPathOrder(finishNode: GridNode): GridNode[] {
  const nodesInShortestPathOrder = [];
  let currentNode: GridNode | null = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}

function getAllNodes(grid: GridNode[][]): GridNode[] {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
}

function sortNodesByDistance(unvisitedNodes: GridNode[]) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function updateUnvisitedNeighbors(node: GridNode, grid: GridNode[]) {
  const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of unvisitedNeighbors) {
    neighbor.distance = node.distance + 1;
    neighbor.previousNode = node;
  }
}

function updateUnvisitedNeighborsAstar(node: GridNode, grid: GridNode[], finishNode: GridNode) {
  const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of unvisitedNeighbors) {
    const tentativeDistance = node.distance + 1 + getManhattanDistance(neighbor, finishNode);
    if (tentativeDistance < neighbor.distance) {
      neighbor.distance = tentativeDistance;
      neighbor.previousNode = node;
    }
  }
}

function getUnvisitedNeighbors(node: GridNode, grid: GridNode[][]): GridNode[] {
  const neighbors = [];
  const { row, col } = node;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter(neighbor => !neighbor.isVisited);
}

function getManhattanDistance(nodeA: GridNode, nodeB: GridNode): number {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

export function generateMaze(grid: GridNode[][]): GridNode[][] {
  // Simple random maze generation
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].type !== 'source' && grid[row][col].type !== 'target') {
        if (Math.random() < 0.3) { // 30% chance of being a wall
          grid[row][col].type = 'wall';
        }
      }
    }
  }
  return grid;
}

export function createInitialGrid(rows: number, cols: number): GridNode[][] {
  const grid: GridNode[][] = [];
  for (let row = 0; row < rows; row++) {
    const currentRow: GridNode[] = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push({
        row,
        col,
        type: 'empty',
        isVisited: false,
        isPath: false,
        distance: Infinity,
        previousNode: null,
      });
    }
    grid.push(currentRow);
  }
  return grid;
}
