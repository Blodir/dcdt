import { V2 } from "../dcdt/math";
import { Edge, Tri } from "./dcdt2";
import { Vertex } from "./dcdt2";
import { lineToLineIntersection3, IntersectionResult } from "../dcdt/lineToLineIntersection";
import { canvasClear, drawEdges, drawHelper, drawPoints, drawTriangleEdges } from "../playground/v2main";
import { validateTriangulation } from "./validation";
import { DFS } from "./graph-search";

// https://stackoverflow.com/a/38856685
const isRightTurn = (a: V2, b: V2, c: V2): boolean => {
  return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0;
}

// calculates right side angle at b in radians
const rightSideAngle = (a: V2, b: V2, c: V2): number => {
  const ba = V2.sub(a, b);
  const bc = V2.sub(c, b);
  const dot = V2.dot(ba, bc);
  const baMag = V2.mag(ba);
  const bcMag = V2.mag(bc);
  return isRightTurn(a, b, c) ? Math.acos(dot / (baMag * bcMag)) : 2 * Math.PI - Math.acos(dot / (baMag * bcMag));
};

// https://stackoverflow.com/a/38856694
const rightSideAngle2 = (a: V2, b: V2, c: V2): number => {
  const p2p1 = V2.sub(a, b);
  const p2p3 = V2.sub(c, b);
  const signed = Math.atan2(V2.cross(p2p1, p2p3), V2.dot(p2p1, p2p3));
  return signed < 0 ? 2 * Math.PI + signed : signed;
}

// Boundary: clockwise polygon
const getInternalAngle = (idx: number, boundary: Vertex[]): number => {
  const a = boundary[(idx - 1 + 3) % 3].p; // previous index
  const b = boundary[idx].p;               // current index
  const c = boundary[(idx + 1) % 3].p;     // next index
  return rightSideAngle(a, b, c);
};

// angle in radians
const angleIsConvex = (angle: number) => angle < Math.PI;

const flipInternalEdges = () => {
  // edge flipping procedure
    // while there are internal edges
    // pick an internal edge
    // if the other endpoint is convex
    // flip
    // remove internal edge
};

const getLineSegments = (t: Tri): [V2, V2][] => [
  [t[0].v.p, t[1].v.p],
  [t[1].v.p, t[2].v.p],
  [t[2].v.p, t[0].v.p]
];

// does not catch intersections at the endpoint
const getFirstIntersection = (a: Vertex, b: Vertex, t: Tri, exclude?: Tri[]): [number, IntersectionResult] | null => {
  const lineSegments = getLineSegments(t);
  for (let i = 0; i < lineSegments.length; i++) {
    if (exclude?.some(t0 => t0 === t[i].neighbor)) { continue; }
    const intersection = lineToLineIntersection3(a.p, b.p, lineSegments[i][0], lineSegments[i][1]);
    if (intersection.type !== 'none') {
      return [i, intersection];
    }
  }
  return null;
};

const getInitialTri = (a: Vertex, b: Vertex): [Tri, number, IntersectionResult] => {
  for (let t of a.T) {
    const res = getFirstIntersection(a, b, t);
    if (res !== null) { return [t, res[0], res[1]]; }
  }
  throw new Error();
}

const getBoundary = (a: Vertex, b: Vertex): Vertex[] => {
  let [t, i, intersection] = getInitialTri(a, b);

  while (true) {
    switch (intersection.type) {
      case 'point':
        // add points of the edge to the boundary
        break;
      case 'vertex':
        if (t[i].v === b) { break; }
        // TODO handle case where we are crossing over a vertex
      default:
        throw new Error('TODO');
    }

    // move forward; update t, i, intersection
    const prev = t;
    t = <Tri>t[i].neighbor;
    const exclude = t.findIndex(v => v.neighbor === prev); // don't move backwards
    [i, intersection] = <[number, IntersectionResult]>getFirstIntersection(a, b, t/* , exclude */);
  }
};

export const insertEdge = (a: Vertex, b: Vertex) => {
  // explore channel from a to b
  // insert vertices into boundary
  const boundary: Vertex[] = [];
  // pair vertices with internal angles
  const boundaryA: [Vertex, number][] = [];
  // sort the list first by convexity then by amt of internal edges
  while (boundaryA.length > 0) {
    // pop first
    flipInternalEdges();
    // update adjacent
      // 
  }
}


















export const insertEdge2 = (a: Vertex, b: Vertex) => {
  const vertexTriIndices = []; // triangles for each left vertex
  const tris = [];

  let [tri, eIdx, intersection] = getInitialTri(a, b)

  let i = 0; // triangle index

  let left: Vertex | undefined; // point on left halfplane of ab

  while (true) {
    // TODO if intersection === vertex...
    if (intersection.type === 'vertex') {
      //insertEdge2(intersection.vertex, b);
      return;
    }

    const left2 = tri[eIdx].v; // point on left halfplane of ab

    if (left2 !== left) {
      // get the triangles of left
      // find the edge of the first triangle ending with left
      // find the edge of the last triangle starting with left
      // calculate angle
      // if left is convex
        //
      // else left is reflex
        // add to arr to be checked later?
    }
  
    // move to the next triangle
    const prev = tri;
    tri = <Tri>tri[eIdx].neighbor;
    const exclude = tri.findIndex(v => v.neighbor === prev)
    const ir = <[number, IntersectionResult]>getFirstIntersection(a, b, tri/* , exclude */);
    [eIdx, intersection] = ir;
    i++;
  }
}

const flipEdge = (A: Tri, B: Tri) => {
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

export const insertEdge3 = (a: Vertex, b: Vertex) => {
  const verts: Vertex[] = [];
  const tris: Tri[] = [];
  const T: number[][] = [];

  let i = 0; // current triangle
  let v = 0; // current vertex

  let [tri, eIdx, intersection] = getInitialTri(a, b)

  while (true) {
    tris.push(tri);

    // edge flipping

    // move to next

  }
}

export const insertEdge4 = (a: Vertex, b: Vertex) => {
  // find intersecting sequence of triangles
  const channel: Tri[] = [];
  while (channel.length > 0) {
    // find convex vertex on the left halfplane of ab
    const leftConvex: Tri[] = [];
    while (leftConvex.length > 0) {
      // find convex vertex on the right halfplane of ab
      // const rightConvex: [Tri, Tri] = [];
      // flipEdge(rightConvex);
      // if edge after flip is adjacent on boundary then remove vertex
      // else just remove from leftConvex
    }
  }
}

const radToDeg = (rad: number) => (rad / (2 * Math.PI)) * 360;

const triAngleAt = (tri: Tri, v: Vertex): number => {
  const ix = tri.findIndex(e => e.v === v);
  if (ix < 0) {
    throw new Error('expected given vertex to be part of the given triangle');
  }
  const a = tri[(ix - 1 + 3) % 3].v.p; // previous index
  const b = tri[ix].v.p;               // current index
  const c = tri[(ix + 1) % 3].v.p;     // next index
  return rightSideAngle2(a, b, c);
};

// each triangle in the seq has one shared vertex
// return true if the total angle at this vertex is less than PI
const triSeqIsConvex = (tris: Tri[], seq: number[], v: Vertex): boolean => {
  let angleSum = 0;
  for (const tIx of seq) {
    const tri = tris[tIx];
    angleSum += triAngleAt(tri, v);
  }
  return angleSum < Math.PI;
};

const getQuadPolygon = (t1: Tri, t2: Tri): V2[] => {
  const idx = t1.findIndex(e => e.neighbor === t2);
  if (idx < 0) {
    throw new Error('expected given triangles to share an edge');
  }
  // locate vertices a b d from the first triangle
  const a = t1[(idx - 1 + 3) % 3].v; // previous index
  const b = t1[idx].v;               // current index
  const d = t1[(idx + 1) % 3].v;     // next index
  // locate the remaining vertex from the adjacent triangle
  const c = (<Edge>t2.find(e => e.v !== b && e.v !== d)).v;
  return [a.p, b.p, c.p, d.p];
};

// given positions in clockwise order, outputs whether the polygon is convex
// assumes that the input is a correct polygon (>=3 verts)
const isConvex = (positions: V2[]): boolean => {
  // check that every internal angle is <180 degrees
  for (let i = 1; i <= positions.length; i++) {
    // check that the right angle at curr is <180
    if (rightSideAngle2(positions[(i - 1 + positions.length) % positions.length], positions[i % positions.length], positions[(i + 1) % positions.length]) >= Math.PI) {
      return false;
    }
  }
  return true;
};

// each triangle in seq[vIx] has one shared vertex
// return a quadrilateral defined by two adjacent triangles
// such that the quadrilateral has only convex angles
const findConvexQuad = (tris: Tri[], seq: number[][], vIx: number): [number, number] => {
  for (let i = 0; i < seq[vIx].length-1; i++) {
    const t1 = tris[seq[vIx][i]];
    const t2 = tris[seq[vIx][i+1]];
    const quad = getQuadPolygon(t1, t2);
    if (isConvex(quad)) {
      return [seq[vIx][i], seq[vIx][i+1]];
    }
  }
  throw new Error('Expected convex quad to exist.');
};

const prev = (seq: number[][], vIx: number): number | null => {
  for (let i = vIx - 1; i >= 0; i--) {
    if (seq[i] && seq[i].length > 0) {
      return i;
    }
  }
  return null;
};

const next = (seq: number[][], vIx: number): number | null => {
  for (let i = vIx + 1; i < seq.length; i++) {
    if (seq[i] && seq[i].length > 0) {
      return i;
    }
  }
  return null;
};

let tempAB: [Vertex, Vertex];

const removeVertex = (tris: Tri[], verts: Vertex[], seq: number[][], vIx: number) => {
  // reduce the number of triangles connected to vIx, until seq[vIx] is empty
  while (seq[vIx].length > 0) {
    // vIx is on the left halfplane of ab, and all other points, besides
    // two adjancent to vIx, are on the right halfplane
    // find a convex vertex on right halfplane
    const quad = findConvexQuad(tris, seq, vIx);
    // flip the quad CLOCKWISE
    flipEdge(tris[quad[0]], tris[quad[1]]);

    // diagonal of vIx is flipped, because we rotate clockwise, we get the following:
    // - quad[1] is no longer connected to v
    // - if v has only one internal edge, quad[0] is removed from v, v-1
    // - if v has more than one internal edge
    //  - if we flipped the first quad of v, the preceding vertex is now connected to both
    //    triangles
    //  - if we flipped the last quad of v, the succeeding vertex is now connected to both
    //    triangles
    const first = seq[vIx][0] === quad[0];
    const last = seq[vIx][seq[vIx].length-1] === quad[1];
    seq[vIx].splice(seq[vIx].findIndex(t => t === quad[1]), 1); // quad[1] is no longer connected to v
    if (seq[vIx].length === 1) {
      seq[vIx].splice(0,1); // remove quad[0] from v (v should is now removed from the seq)
      const i = prev(seq, vIx);
      if (i !== null) {
        seq[i].splice(seq[i].length-1, 1, quad[1]);
      }
    } else {
      if (first) {
        // the order of quad[0] and quad[1] is switched, because of the
        // clockwise rotation
        const i = prev(seq, vIx);
        if (i !== null) {
          seq[i].splice(seq[i].length-1, 1, quad[1], quad[0]);
        }
      }
      if (last) {
        // seq[vIx+1] must already have quad[1] in the beginning
        // quad[0] is added to the beginning due to clockwise rotation
        const i = next(seq, vIx);
        if (i !== null) {
          seq[i].unshift(quad[0]);
        }
      }
    }
  }

  // check if neighbors to the left are now convex
  const i = prev(seq, vIx);
  if (i !== null && triSeqIsConvex(tris, seq[i], verts[i])) {
    removeVertex(tris, verts, seq, i);
  }
};

export const insertEdge5 = (a: Vertex, b: Vertex) => {
  // index structures such that vertices and triangles have
  // unique identifying indices
  const verts: Vertex[] = [];
  const tris: Tri[] = [];

  // triangle sequence partitioned into subsequences such that
  // each triangle in a subsequence has a shared vertex on the
  // left halfplane of ab
  // eg. [[1, 2, 3], [3, 4], [4, 5]]
  const seq: number[][] = [[]];

  let tIx = 0; // current triangle
  let vIx = 0; // current vertex

  // the initial triangle is found by checking every triangle of a
  // for intersections
  let [tri, eIx, intersection] = getInitialTri(a, b);

  while (true) {
    tris.push(tri);

    // intersecting edge pq
    const pq = tri[eIx]; // edge of tri that intersects ab
    const p = pq.v; // vertex of the intersecting edge on the left halfplane of ab

    // if the vertex p is new
    if (tIx > 0 && p !== verts[vIx]) {
      seq[vIx].push(tIx); // the triangle is part of both seq[vIx] and seq[vIx+1]

      // since vertex p is new, all of the triangles belonging to the
      // previous vertex have now been covered and it's ready to be checked
      if (triSeqIsConvex(tris, seq[vIx], verts[vIx])) {
        // if the vertex at vIx is convex, it can now be removed through
        // a sequence of flip operations
        removeVertex(tris, verts, seq, vIx);
      }

      // update vIx to refer to p, and create a new entry in seq
      vIx++;
      seq.push([]);
    }

    seq[vIx].push(tIx); // push current triangle to correct place in the seq

    // move to the next intersecting edge
    const prev = tri;
    tri = <Tri>tri[eIx].neighbor;
    const exclude = tri.findIndex(v => v.neighbor === prev);
    const ir = <[number, IntersectionResult]>getFirstIntersection(a, b, tri/* , exclude */);
    if (ir !== null) {
      [eIx, intersection] = ir;
      if (intersection.type === 'vertex') {
        seq[vIx].push(tIx);
        removeVertex(tris, verts, seq, vIx);
        const fst = tri[eIx].v;
        const snd = tri[(eIx + 1) % 3].v;
        // done with this segment, process next segment
        insertEdge5([fst,snd][intersection.vertex], b);
        break;
      }
    } else {
      // no more intersections, therefore we must have reached b
      seq[vIx].push(tIx);
      removeVertex(tris, verts, seq, vIx);
      break;
    }
/*     validateTriangulation([tri]);
    drawHelper(prev, 'rgba(0,0,0,0.1)');
    drawTriangleEdges(prev, 'orange');
    drawPoints([a.p, b.p], 'green');
    drawPoints([tri[exclude].v.p], 'purple');
    drawTriangleEdges(tri, 'red');
    const temp0 = tri;
    drawPoints([temp0[0].v.p], 'red');
    drawEdges([[temp0[0].v.p, temp0[1].v.p]], 'red');
    drawPoints([temp0[1].v.p], 'green');
    drawEdges([[temp0[1].v.p, temp0[2].v.p]], 'green');
    drawPoints([temp0[2].v.p], 'blue');
    drawEdges([[temp0[2].v.p, temp0[0].v.p]], 'blue'); */

    tIx++;
  }
}

const validateSeq = (seq: number[][]): boolean => {
  for (let s of seq) {
    const set = new Set<number>();
    for (let n of s) {
      if (set.has(n)) {
        return false;
      }
      set.add(n);
    }
  }
  return true;
};

export const insertEdge6 = (a: Vertex, b: Vertex) => {
  tempAB = [a, b];
  // index structures such that vertices and triangles have
  // unique identifying indices
  const verts: Vertex[] = [];
  const tris: Tri[] = [];

  // triangle sequence partitioned into subsequences such that
  // each triangle in a subsequence has a shared vertex on the
  // left halfplane of ab
  // eg. [[1, 2, 3], [3, 4], [4, 5]]
  const seq: number[][] = [[]];

  let tIx = 0; // current triangle
  let vIx = 0; // current vertex

  // the initial triangle is found by checking every triangle of a
  // for intersections
  let tri: Tri; let eIx: number | null; let intersection: IntersectionResult | null;
  [tri, eIx, intersection] = getInitialTri(a, b);
  verts[vIx] = tri[eIx].v; // initialize the first vertex
  let next = <Tri>tri[eIx].neighbor;

  while (true) {
    tris.push(tri);
    seq[vIx].push(tIx);

    if (intersection === null || eIx === null) {
      // we have reached the end of the sequence
      removeVertex(tris, verts, seq, vIx);
      return;
    } else if (intersection.type === 'equal') {
      return; // no need to do anything, the edge already exists
    } else if (intersection.type === 'vertex') {
      // ab is intersecting with a vertex, split the edge in two
      removeVertex(tris, verts, seq, vIx);
      const fst = tri[eIx].v; const snd = tri[(eIx + 1) % 3].v;
      insertEdge5([fst,snd][intersection.vertex], b);
      return;
    } else if (intersection.type === 'point') {
      // ab intersects with an edge (normal case)
      const p = tri[eIx].v; // vertex of the intersecting edge on the left halfplane of ab

      // if we switched to a new vertex
      if (p !== verts[vIx]) {
        seq.push([tIx]);
        verts.push(p);

        // since vertex p is new, all of the triangles belonging to the
        // previous vertex have now been covered and it's ready to be checked
        if (triSeqIsConvex(tris, seq[vIx], verts[vIx])) {
          // if the vertex at vIx is convex, it can now be removed through
          // a sequence of flip operations
          removeVertex(tris, verts, seq, vIx);
        }

        vIx++;
      }
    }

    // move to the next intersecting edge
    tri = next;
    const ir = getFirstIntersection(a, b, tri, tris);
    [eIx, intersection] = ir === null ? [null, null] : ir;
    if (eIx !== null) { next = <Tri>tri[eIx].neighbor; }
    tIx++;
  }
}