import { debug } from "../../playground/main";
import { DFS } from "../../playground/utils";
import { Edge, Tri, Vertex, flipEdge } from "../dcdt";
import { V2, pointDistToLineSegment, projectPointToLine, radToDeg, rightSideAngle } from "../math";
import { validateTriangulation } from "../validation";

const getPolyFromQuad = (t1: Tri, t2: Tri): Vertex[] => {
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
  return [a, b, c, d];
};

// each triangle in seq[vIx] has one shared vertex
// return a quadrilateral defined by two adjacent triangles
// such that the quadrilateral has only convex angles
const findConvexQuad = (triSeq: Tri[], ɛ: number): number => {
  for (let i = 0; i < triSeq.length-1; i++) {
    const t1 = triSeq[i];
    const t2 = triSeq[i+1];
    const quad = getPolyFromQuad(t1, t2);

    let isConvex = true;
    // check that every internal angle is <180 degrees
    for (let i = 1; i <= quad.length; i++) {
      // check that the right angle at curr is <180
      const a = quad[(i - 1 + quad.length) % quad.length];
      const b = quad[i % quad.length];
      const c = quad[(i + 1) % quad.length];
      const δ = pointDistToLineSegment(b.p, a.p, c.p);
      const d = V2.dist(b.p, c.p);
      const tan = (Math.tan((Math.PI - ɛ) / 2));
      if (δ < d / tan) {
        // float danger
        // if triangle abc exists
        if (t1.every(e => [a,b,c].includes(e.v)) || t2.every(e => [a,b,c].includes(e.v))) {
          // move b away from ac so the angle is definitely convex
          const proj = projectPointToLine(b.p, a.p, c.p);
          const dir = V2.normalize(V2.sub(b.p, proj));
          b.p = V2.add(b.p, V2.scale(dir, d/tan - δ));
        } else {
          // move b to ac, such that the poly is definitely not convex
          b.p = projectPointToLine(b.p, a.p, c.p);
          isConvex = false;
        }
        break;
      } else {
        // float safe
        if (rightSideAngle(a.p, b.p, c.p) + ɛ >= Math.PI) {
          isConvex = false;
          break;
        }
      }
    }
    if (isConvex) {
      return i;
    }
  }
  return -1;
};

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
const triSeqIsConvex = (triSeq: Tri[], v: Vertex, ɛ: number): boolean => {
  let angleSum = 0;
  for (const tri of triSeq) {
    angleSum += triAngleAt(tri, v);
  }
  return angleSum + ɛ < Math.PI;
};

const flipEpsilonRepair = (A: Tri, B: Tri, ɛ: number): Vertex | null => {
  // we want to flip ac -> bd
  // if a or c are on bd, then we need to repair

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

  // mutually exclusive!
  if (pointDistToLineSegment(a.p, b.p, d.p) < ɛ) {
    // move a to proj bp
    a.p = projectPointToLine(a.p, b.p, d.p);
    return a;
  }
  if (pointDistToLineSegment(c.p, b.p, d.p) < ɛ) {
    // move c to proj bp
    c.p = projectPointToLine(c.p, b.p, d.p);
    return b;
  }
  return null;
};

export class Channel {
  private tris: Tri[] = [];
  private verts: [number, Vertex][] = [];
  private leftBoundary: number[] = [];
  private curr: [number, Vertex] | undefined; // undefined at the end of the channel

  constructor(first: Vertex, private ɛ: number) { this.curr = [0, first]; }

  updateLastTri(t: Tri) {
    this.tris[this.leftBoundary[this.leftBoundary.length-1]] = t;
  }
  size(): number {
    return this.leftBoundary.length;
  }
  getSecondLastTri(): Tri {
    return this.tris[this.leftBoundary[this.leftBoundary.length-2]];
  }
  getLastTri(): Tri {
    return this.tris[this.leftBoundary[this.leftBoundary.length-1]];
  }
  checkConvex(): boolean {
    const triSeq = this.getTriSeq();
    return triSeqIsConvex(triSeq, this.verts[this.verts.length-1][1], this.ɛ);
  }
  getCurrentVertex(): Vertex | undefined {
    return this.curr?.[1];
  }
  pushVertex(v: Vertex | undefined) {
    this.verts.push(<[number, Vertex]>this.curr);
    if (!v) {
      this.curr = undefined;
    } else {
      this.curr = ([this.leftBoundary.length-1, v]);
    }
  }
  pushTriangle(tri: Tri) {
    this.tris.push(tri);
    this.leftBoundary.push(this.tris.length-1);
  }

  private recheckPrevious() {
    if (this.verts.length <= 1) { return; }
    const currCache = this.curr;
    const boundaryCache = currCache ? this.leftBoundary.splice(currCache[0]+1) : [];
    this.curr = this.verts.pop();
    let reduced = false;
    if (this.checkConvex()) {
      this.reduce();
      reduced = true;
    }
    this.leftBoundary.push(...boundaryCache);
    this.pushVertex(currCache ? currCache[1] : undefined);
    if (reduced && this.checkConvex()) {
      this.reduce();
    }
  }

  reduce() {
    while (true) {
      const triSeq = this.getTriSeq();
      const vertexStart = this.verts[this.verts.length-1][0];
      const quadStart = findConvexQuad(triSeq, this.ɛ);
      if (quadStart < 0) {
        // findConvexQuad moved a vertex ... (todo refactor)
        if (triSeq.length === 2) {
          this.recheckPrevious();
        }
        return;
      }
      const A = this.tris[this.leftBoundary[vertexStart + quadStart]];
      const B = this.tris[this.leftBoundary[vertexStart + quadStart + 1]];
      const movedVertex = flipEpsilonRepair(A, B, this.ɛ);
      if (movedVertex !== null) {
        // if there's only one quad, we know that one is now reflex and can't be flipped
        if (triSeq.length === 2) {
          break;
        }
        // otherwise there must be some convex quad, so we continue
        continue;
      }
      flipEdge(A, B);
  
      const first = quadStart === 0;
      const last = quadStart === triSeq.length-2;
      if (triSeq.length === 2) {
        this.verts.pop();
        this.leftBoundary.splice(vertexStart + quadStart, 1);
        this.shiftCurrent();
        break;
      } else {
        if (first) {
          if (this.verts.length === 1) {
            // special case at the beginning of the channel
            this.leftBoundary.splice(vertexStart + quadStart + 1, 1)
            this.shiftCurrent();
          } else {
            const a = this.leftBoundary[vertexStart + quadStart];
            const b = this.leftBoundary[vertexStart + quadStart + 1];
            this.leftBoundary[vertexStart + quadStart] = b;
            this.leftBoundary[vertexStart + quadStart + 1] = a;
            this.verts[this.verts.length-1][0] = this.verts[this.verts.length-1][0] + 1;
          }
        }
        if (last) {
          if (!this.curr) {
            // special case at the end of the channel
            this.leftBoundary.splice(vertexStart + quadStart + 1, 1)
          }
          this.shiftCurrent();
        }
        if (!first && !last) {
          this.leftBoundary.splice(vertexStart + quadStart + 1, 1);
          this.shiftCurrent();
        }
      }
    }

    if (this.verts.length > 0 && this.checkConvex()) {
      this.reduce();
    }
  }

  private getTriSeq(): Tri[] {
    const start = this.verts[this.verts.length-1][0];
    const end = this.curr ? this.curr[0] + 1 : this.leftBoundary.length;
    return this.leftBoundary.slice(start, end).map(i => this.tris[i]);
  }

  private shiftCurrent() {
    if (this.curr) {
      this.curr[0] = this.curr[0] - 1;
    }
  }
}
