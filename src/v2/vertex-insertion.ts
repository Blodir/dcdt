import { pointDistToLineSegment, V2 } from "../dcdt/math";
import { drawTriangleEdges } from "../playground/v2main";
import { Tri, Edge, Vertex } from "./dcdt2";
import { validateTriangulation } from "./validation";

// https://stackoverflow.com/a/2049593
const signSO = (p1: [number, number], p2: [number, number], p3: [number, number]) => {
  return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}
const pointInTriangleSO = (pt: [number, number], v1: [number, number], v2: [number, number], v3: [number, number]) => {
  let d1: number, d2: number, d3: number;
  let has_neg: boolean, has_pos: boolean;

  d1 = signSO(pt, v1, v2);
  d2 = signSO(pt, v2, v3);
  d3 = signSO(pt, v3, v1);

  has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

  return !(has_neg && has_pos);
}
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

const pointOnVertex = (p: V2, tri: Tri, ɛ: number): number | null => {
  if (V2.dist(p, tri[0].v.p) < ɛ) {
    return 0;
  } else if (V2.dist(p, tri[1].v.p) < ɛ) {
    return 1;
  } else if (V2.dist(p, tri[2].v.p) < ɛ) {
    return 2;
  } else {
    return null
  }
}

const pointOnEdge = (p: V2, tri: Tri, ɛ: number): number | null => {
  if (pointDistToLineSegment(p, tri[0].v.p, tri[1].v.p) < ɛ) {
    return 0;
  } else if (pointDistToLineSegment(p, tri[1].v.p, tri[2].v.p) < ɛ) {
    return 1;
  } else if (pointDistToLineSegment(p, tri[2].v.p, tri[0].v.p) < ɛ) {
    return 2;
  } else {
    return null
  }
}

const replaceInArr = <T>(arr: T[], item: T, newItems: T[]): T[] => {
  const i = arr.findIndex(a => a === item);
  const l = arr.slice(0, i);
  const r = arr.slice(i + 1);
  return [...l, ...newItems, ...r];
};

const insertVertexInTri = (p: [number, number], tri: Tri): Vertex => {
  // split triangle into 3 parts, then perform edge flipping

  // create new vertex

  const v: Vertex = {
    p,
    T: []
  };

  // create new triangles

  const t1: Tri = [
    { v, neighbor: null },
    { v: tri[0].v, neighbor: tri[0].neighbor },
    { v: tri[1].v, neighbor: null }
  ];
  const t2: Tri = [
    { v, neighbor: null },
    { v: tri[1].v, neighbor: tri[1].neighbor },
    { v: tri[2].v, neighbor: null }
  ];
  const t3: Tri = [
    { v, neighbor: null },
    { v: tri[2].v, neighbor: tri[2].neighbor },
    { v: tri[0].v, neighbor: null }
  ];

  // connect the new triangles to each other

  t1[0].neighbor = t3;
  t1[2].neighbor = t2;

  t2[0].neighbor = t1;
  t2[2].neighbor = t3;

  t3[0].neighbor = t2;
  t3[2].neighbor = t1;

  // connect outside triangles to the new triangles

  if (tri[0].neighbor) {
    // because the edges are in clockwise order, a shared edge is in reverse from the neighbors perspective
    // find the shared edge, then set its neighbor to be t1
    (<Edge>tri[0].neighbor.find(te => te.v === tri[1].v)).neighbor = t1;
  }
  if (tri[1].neighbor) {
    (<Edge>tri[1].neighbor.find(te => te.v === tri[2].v)).neighbor = t2;
  }
  if (tri[2].neighbor) {
    (<Edge>tri[2].neighbor.find(te => te.v === tri[0].v)).neighbor = t3;
  }

  // set the adjacent triangles for each vertex

  v.T = [t1, t2, t3];
  tri[0].v.T = replaceInArr(tri[0].v.T, tri, [t1, t3]);
  tri[1].v.T = replaceInArr(tri[1].v.T, tri, [t2, t1]);
  tri[2].v.T = replaceInArr(tri[2].v.T, tri, [t3, t2]);

  // flip edges until the delaunay property is satisfied
  // TODO ...

  // Update constrained edges
  // TODO ...

  // return the new vertex
  return v;
};

/*     v2
      /   \
    /  t1   \
  v0 --------- v1 (edge e)
    \  t2   /
      \   /
       v3

        v2
      / | \
    / t3|t4 \
  v0 --- v --- v1 (edge e)
    \ t6|t5 /
      \ | /
        v3

(in degenerate case t2 doesn't exist)
*/
const insertVertexOnEdge = (p: [number, number], tri: Tri, edgeIdx: number): Vertex => {
  const t1: Tri = tri;
  const t1v1v0: Edge = tri[edgeIdx];
  const t2 = t1v1v0.neighbor;

  const t1v0v2 = tri[(edgeIdx + 1) % 3];
  const t1v2v1 = tri[(edgeIdx + 2) % 3];

  const v0: Vertex = t1v0v2.v;
  const v1: Vertex = t1v1v0.v;
  const v2: Vertex = t1v2v1.v;

  const t2edgeIdx = t2?.findIndex(te => te.v === v1);
  const t2v0v1 = t2?.[(<number>t2edgeIdx + 2) % 3];
  const t2v1v3 = t2?.[(<number>t2edgeIdx) % 3];
  const t2v3v0 = t2?.[(<number>t2edgeIdx + 1) % 3];

  const v3 = t2v3v0?.v;

  const v0v2neighbor = t1v0v2.neighbor;
  const v2v1neighbor = t1v2v1.neighbor;
  const v1v3neighbor = t2v1v3?.neighbor;
  const v3v0neighbor = t2v3v0?.neighbor;

  const v: Vertex = {
    p,
    T: []
  };

  // Create new triangles
  const t3: Tri = [
    { neighbor: null, v: v },
    { neighbor: v0v2neighbor, v: v0 },
    { neighbor: null, v: v2 }
  ];
  const t4: Tri = [
    { neighbor: null, v: v },
    { neighbor: v2v1neighbor, v: v2 },
    { neighbor: null, v: v1 }
  ];
  const t5: Tri | undefined = t2 ? [
    { neighbor: null, v: v },
    { neighbor: <Tri | null>v1v3neighbor, v: v1 },
    { neighbor: null, v: <Vertex>v3 }
  ] : undefined;
  const t6: Tri | undefined = t2 ? [
    { neighbor: null, v: v },
    { neighbor: <Tri | null>v3v0neighbor, v: <Vertex>v3 },
    { neighbor: null, v: v0 }
  ] : undefined;

  // Connect the new triangles
  t3[0].neighbor = t6 !== undefined ? t6 : null;
  t3[2].neighbor = t4;
  t4[0].neighbor = t3;
  t4[2].neighbor = t5 !== undefined ? t5 : null;
  if (t5) {
    t5[0].neighbor = t4;
    t5[2].neighbor = <Tri>t6;
  }
  if (t6) {
    t6[0].neighbor = <Tri>t5;
    t6[2].neighbor = t3;
  }

  // Connect outside triangles
  let temp = v0v2neighbor?.find(a => a.neighbor === t1);
  if (temp) { temp.neighbor = t3; }

  temp = v2v1neighbor?.find(a => a.neighbor === t1);
  if (temp) { temp.neighbor = t4; }

  temp = v1v3neighbor?.find(a => a.neighbor === t2);
  if (temp) { temp.neighbor = <Tri>t5; }

  temp = v3v0neighbor?.find(a => a.neighbor === t2);
  if (temp) { temp.neighbor = <Tri>t6; }

  // Update vertices
  v.T = [t3, t4];
  if (t2) { v.T.push(<Tri>t5, <Tri>t6); }
  v0.T = replaceInArr(v0.T, t1, [t3]);
  v1.T = replaceInArr(v1.T, t1, [t4]);
  v2.T = replaceInArr(v2.T, t1, [t4, t3]);
  if (t2) {
    v0.T = replaceInArr(v0.T, t2, [<Tri>t6]);
    v1.T = replaceInArr(v1.T, t2, [<Tri>t5]);
  }
  if (t2) { (<Vertex>v3).T = replaceInArr((<Vertex>v3).T, t2, [<Tri>t6, <Tri>t5]); }

  // retriangulate
  // TODO ...

  // update constrained edges
  // TODO ...

  return v;
};

// returns the index of the resulting vertex in the CDT
export const insertVertex = (root: Tri, p: [number, number], cIdx: number, ɛ: number): Vertex => {
  // locate point
  const tri = locatePoint(root, p);
  if (!tri) {
    throw new Error('Point outside of triangulation');
  }
  const vIdx = pointOnVertex(p, tri, ɛ);
  const eIdx = pointOnEdge(p, tri, ɛ);
  if (vIdx !== null) {
    console.log('vertex exists'); // TODO test this, it's very rare
    // Vertex already exists, add constraint
    // tri[vIdx].cIdx.push(cIdx);
    return tri[vIdx].v;
  } else if (eIdx !== null) {
    console.log('point on edge'); // TODO test this, it's very rare
    return insertVertexOnEdge(p, tri, eIdx);
  } else {
    return insertVertexInTri(p, tri);
  }
};
