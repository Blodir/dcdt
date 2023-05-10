import { V2, rightSideAngle } from "../dcdt/math";
import { Edge, Tri, flipEdge } from "./dcdt";
import { Vertex } from "./dcdt";
import { lineSegmentIntersection, IntersectionResult } from "./line-segment-intersection";

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
    const intersection = lineSegmentIntersection(a.p, b.p, lineSegments[i][0], lineSegments[i][1]);
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

const triAngleAt = (tri: Tri, v: Vertex): number => {
  const ix = tri.findIndex(e => e.v === v);
  if (ix < 0) {
    throw new Error('expected given vertex to be part of the given triangle');
  }
  const a = tri[(ix - 1 + 3) % 3].v.p; // previous index
  const b = tri[ix].v.p;               // current index
  const c = tri[(ix + 1) % 3].v.p;     // next index
  return rightSideAngle(a, b, c);
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
    if (rightSideAngle(positions[(i - 1 + positions.length) % positions.length], positions[i % positions.length], positions[(i + 1) % positions.length]) >= Math.PI) {
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

export const insertEdge = (a: Vertex, b: Vertex) => {
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
      insertEdge([fst,snd][intersection.vertex], b);
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
