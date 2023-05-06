import { insertEdge } from "./edge-insertion";
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
  edges.forEach(e => insertEdge(e[0], e[1]));

  if (vertices.length > 0) {
    return [vertices[0].T[0], cIx];
  }

  return [root, cIx];
};
