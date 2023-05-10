import { Edge, Tri, Vertex, flipEdge } from "./dcdt";
import { V2, rightSideAngle } from "./math";

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
const findConvexQuad = (triSeq: Tri[]): number => {
  for (let i = 0; i < triSeq.length-1; i++) {
    const t1 = triSeq[i];
    const t2 = triSeq[i+1];
    const quad = getQuadPolygon(t1, t2);
    if (isConvex(quad)) {
      return i;
    }
  }
  throw new Error('Expected convex quad to exist.');
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
const triSeqIsConvex = (triSeq: Tri[], v: Vertex): boolean => {
  let angleSum = 0;
  for (const tri of triSeq) {
    angleSum += triAngleAt(tri, v);
  }
  return angleSum < Math.PI;
};

export class Channel {
  private tris: Tri[] = [];
  private verts: [number, Vertex][] = [];
  private leftBoundary: number[] = [];
  private curr: [number, Vertex] | undefined; // undefined at the end of the channel

  constructor(first: Vertex) { this.curr = [0, first]; }

  getLastTri(): Tri {
    return this.tris[this.leftBoundary[this.leftBoundary.length-1]];
  }
  checkConvex(): boolean {
    const triSeq = this.getTriSeq();
    return triSeqIsConvex(triSeq, this.verts[this.verts.length-1][1]);
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

  reduce() {
    while (true) {
      const triSeq = this.getTriSeq();
      const vertexStart = this.verts[this.verts.length-1][0];
      const quadStart = findConvexQuad(triSeq);
      flipEdge(this.tris[this.leftBoundary[vertexStart + quadStart]], this.tris[this.leftBoundary[vertexStart + quadStart + 1]]);
  
      const first = quadStart === 0;
      const last = quadStart === triSeq.length-2;
      if (triSeq.length === 2) {
        this.verts.pop();
        this.leftBoundary.splice(vertexStart + quadStart, 1);
        if (this.curr) {
          this.curr[0] = this.curr[0] - 1;
        }
        break;
      } else {
        if (first) {
          if (this.verts.length === 1) {
            // special case at the beginning of the channel
            this.leftBoundary.splice(vertexStart + quadStart + 1, 1)
            if (this.curr) {
              this.curr[0] = this.curr[0] - 1;
            }
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
          if (this.curr) {
            this.curr[0] = this.curr[0] - 1;
          }
        }
        if (!first && !last) {
          this.leftBoundary.splice(vertexStart + quadStart + 1, 1);
          if (this.curr) {
            this.curr[0] = this.curr[0] - 1;
          }
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
}
