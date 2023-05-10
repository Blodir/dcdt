import { insertEdge } from "./edge-insertion";
import { insertEdge2 } from "./edge-insertion-2";
import { insertVertex } from "./vertex-insertion";

export interface Constraint {
  P: [number, number][]; // list of 2D points
  E: [number, number][]; // list of edges (pairs of indices of P)
};

// TODO: add constraint Ix
export interface Vertex {
  p: [number, number];
  T: Tri[]; // in clockwise order
}
export interface Edge {
  v: Vertex;
  neighbor: Tri | null; // neighbor on the left side of the edge
}
export type Tri = [Edge, Edge, Edge]; // in clockwise order

export const getEdgeEndpoints = (tri: Tri, eIx: number) => [tri[eIx].v, tri[(eIx + 1) % 3].v];

export const flipEdge = (A: Tri, B: Tri) => {
  // quad abcd
  // flip edge ac -> bd
  // rotates the edge clockwise

  // A
  const acIx = A.findIndex(v => v.neighbor === B);
  const ac = A[acIx];
  const cdIx = (acIx + 1) % 3;
  const cd = A[cdIx];
  const daIx = (acIx + 2) % 3;
  const da = A[daIx];

  // B
  const caIx = B.findIndex(v => v.neighbor === A);
  const ca = B[caIx];
  const abIx = (caIx + 1) % 3;
  const ab = B[abIx];
  const bcIx = (caIx + 2) % 3;
  const bc = B[bcIx];

  const a = ab.v;
  const b = bc.v;
  const c = cd.v;
  const d = da.v;

  const bd: Edge = {
    v: b,
    neighbor: B
  };
  const db: Edge = {
    v: d,
    neighbor: A
  };

  //A = [da, ab, bd];
  <Tri>A.splice(0, 3, da, ab, bd); //[da, ab, bd];
  //B = [bc, cd, db];
  <Tri>B.splice(0, 3, bc, cd, db); //[bc, cd, db];

  a.T.splice(a.T.findIndex(t => t === B), 1);
  b.T.splice(b.T.findIndex(t => t === B), 0, A);
  c.T.splice(c.T.findIndex(t => t === A), 1);
  d.T.splice(d.T.findIndex(t => t === A), 0, B);

  const n1 = ab.neighbor;
  const n1n = n1?.find(e => e.neighbor === B)
  if (n1n) {
    n1n.neighbor = A;
  }
  const n2 = bc.neighbor;
  const n3 = cd.neighbor;
  const n3n = n3?.find(e => e.neighbor === A)
  if (n3n) {
    n3n.neighbor = B;
  }
  const n4 = da.neighbor;
};


// Inserts a constraint and returns its index
export const insertConstraint = (root: Tri, C: Constraint, ɛ: number): [ Tri, number ] => {
  // assign next available id for the constraint
  const cIx = 0; // ...
  // insert vertices
  const vertices: Vertex[] = [];
  let _root = root;
  for (let i = 0; i < C.P.length; i++) {
    const v = insertVertex(_root, C.P[i], cIx, ɛ);
    _root = <Tri>v.T.find(t => t);
    vertices.push(v);
  }
  // map edge indices from constraint space to CDT space
  const edges = C.E.map(e => (<[Vertex, Vertex]>[vertices[e[0]], vertices[e[1]]]));
  // insert edges
  edges.forEach(e => insertEdge2(e[0], e[1]));

  if (vertices.length > 0) {
    return [vertices[0].T[0], cIx];
  }

  return [root, cIx];
};
