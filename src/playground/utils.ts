import { Tri, Vertex } from "../dcdt/dcdt";
import { V2 } from "../dcdt/math";

const randomPoint = (): V2 => [Math.random(), Math.random()];

export const generateNRandomPoints = (amount: number): V2[] => {
  const points: V2[] = [];
  for (let i = 0; i < amount; i++) {
    points.push(randomPoint());
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

export const createTestSquare = (): Tri => {
  const a: Vertex = { p: [0, 0], T: [] };
  const b: Vertex = { p: [0, 1], T: [] };
  const c: Vertex = { p: [1, 0], T: [] };
  const d: Vertex = { p: [1, 1], T: [] };
  const t1: Tri = [
    { neighbor: null, v: a },
    { neighbor: null, v: b },
    { neighbor: null, v: c }
  ];
  const t2: Tri = [
    { neighbor: null, v: b },
    { neighbor: null, v: d },
    { neighbor: null, v: c }
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
