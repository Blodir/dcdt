import { debug } from "../playground/main";
import { DFS, createTestSquare } from "../playground/utils";
import { insertEdge } from "./edge-insertion/edge-insertion";
import { V2, pointInTriangleSO } from "./math";
import { validateTriangulation } from "./validation";
import { insertVertex } from "./vertex-insertion";

export interface Constraint {
  P: [number, number][]; // list of 2D points
  E: [number, number][]; // list of edges (pairs of indices of P)
};

// TODO: add constraint Ix
export interface Vertex {
  p: [number, number];
  T: Tri[]; // in clockwise order
  C: Set<number>;
}
export interface Edge {
  v: Vertex;
  neighbor: Tri | null; // neighbor on the left side of the edge
  C: Set<number>;
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
    neighbor: B,
    C: ac.C
  };
  const db: Edge = {
    v: d,
    neighbor: A,
    C: ca.C
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


const triContainsPoint = (tri: Tri, p: [number, number]): boolean => pointInTriangleSO(p, tri[0].v.p, tri[1].v.p, tri[2].v.p);

export const locatePointDFS = (root: Tri, p: V2): Tri | null => {
  const visited: Set<Tri> = new Set();
  const unexplored: Tri[] = [ root ];
  while (unexplored.length > 0) {
    const tri = <Tri>unexplored.pop();
    if (triContainsPoint(tri, p)) {
      return tri;
    }
    for (const te of tri) {
      if (te.neighbor && !visited.has(te.neighbor)) {
        unexplored.push(te.neighbor);
      }
    }
    visited.add(tri);
  }
  return null;
};

const locatePoint = (root: Tri, p: [number, number]): Tri | null => {
  return locatePointDFS(root, p);
}

export class DCDT {
  private constraints = [undefined]; // index 0 is reserved for test square

  someTri: Tri;

  constructor(width: number, height: number, private ɛ = 0.00001) {
    this.someTri = createTestSquare(width, height);
  }

  insertConstraint(c: Constraint): number {
    // assign next available id for the constraint
    const cIx = this.constraints.length;

    // insert vertices
    const vertices: Vertex[] = [];
    for (let i = 0; i < c.P.length; i++) {
      const tri = locatePoint(this.someTri, c.P[i]); // ...
      if (!tri) {
        throw new Error('Point outside of triangulation');
      }
      const v = insertVertex(tri, c.P[i], cIx, this.ɛ);
      this.someTri = v.T[0];
      vertices.push(v);
    }

    // map edge indices from constraint space to CDT space
    const edges = c.E.map(e => (<[Vertex, Vertex]>[vertices[e[0]], vertices[e[1]]]));

    // insert edges
    edges.forEach(e => insertEdge(e[0], e[1], cIx, this.ɛ));
    // someTri has to be updated since insertEdge may be destructive
    this.someTri = vertices[0].T[0];

    this.constraints.push(undefined); // ...
    return cIx;
  }

  removeConstraint(cIx: number) {
    // unconstrain edges of c
    // unconstrain vertices of c
      // if vertex has no constraints, remove it
  }
}
