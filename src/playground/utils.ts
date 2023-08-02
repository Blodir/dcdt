import { Tri, Vertex } from "../dcdt/dcdt";
import { V2 } from "../dcdt/math";

const randomPoint = (scale: number): V2 => [Math.random() * scale, Math.random() * scale];

export const generateNRandomPoints = (amount: number, scale = 1): V2[] => {
  const points: V2[] = [];
  for (let i = 0; i < amount; i++) {
    points.push(randomPoint(scale));
  }
  return points;
}

export const generateNRandomEdges = (n: number, maxIx: number): [number, number][] => {
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = Math.round(Math.random() * maxIx);
    const b = Math.round(Math.random() * maxIx);
    if (a === b) {
      i--;
    } else {
      edges.push(<[number, number]>[a, b]);
    }
  }
  return edges;
};

export const getVerticesFromTriangles = (tris: Tri[]) => {
  const verts: Set<Vertex> = new Set();
  tris.forEach(t => t.forEach(te => verts.add(te.v)));
  return Array.from(verts);
};

export const createTestSquare = (width = 1, height = 1): Tri => {
  const a: Vertex = { p: [0, 0], T: [], C: new Set<number>([0]) };
  const b: Vertex = { p: [0, height], T: [], C: new Set<number>([0]) };
  const c: Vertex = { p: [width, 0], T: [], C: new Set<number>([0]) };
  const d: Vertex = { p: [width, height], T: [], C: new Set<number>([0]) };
  const t1: Tri = [
    { neighbor: null, v: a, C: new Set<number>([0]) },
    { neighbor: null, v: b, C: new Set<number>() },
    { neighbor: null, v: c, C: new Set<number>([0]) }
  ];
  const t2: Tri = [
    { neighbor: null, v: b, C: new Set<number>([0]) },
    { neighbor: null, v: d, C: new Set<number>() },
    { neighbor: null, v: c, C: new Set<number>([0]) }
  ];
  t1[1].neighbor = t2;
  t2[2].neighbor = t1;
  a.T.push(t1);
  b.T.push(t1, t2);
  c.T.push(t1, t2);
  d.T.push(t2);

  return t1;
};

// discover the triangulation using depth-first search
export const DFS = (root: Tri) => {
  const visited: Set<Tri> = new Set();
  const unexplored: Tri[] = [ root ];
  while (unexplored.length > 0) {
    const tri = <Tri>unexplored.pop();
    for (const te of tri) {
      if (te.neighbor && !visited.has(te.neighbor)) {
        unexplored.push(te.neighbor);
      }
    }
    visited.add(tri);
  }
  return Array.from(visited);
};
