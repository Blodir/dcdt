import { lineToLineIntersection3 } from "../dcdt/lineToLineIntersection";
import { V2 } from "../dcdt/math";
import { Edge, Tri, Vertex } from "./dcdt2";

export const insertEdge = (e: [Vertex, Vertex]) => {
  // find all proper intersections
  const intersections = [];
  while (intersections.length > 0) {
    // attempt to flip an edge
    // if succesful, remove it from intersections
  }
};

// Assumes that neighbor at t[idx] exists
const quad = (t: Tri, idx: number): V2[] => {
  const t2 = <Tri>t[idx].neighbor;
  // locate vertices a b d from the first triangle
  const a = t[(idx - 1 + 3) % 3].v; // previous index
  const b = t[idx].v;               // current index
  const d = t[(idx + 1) % 3].v;     // next index
  // locate the remaining vertex from the adjacent triangle
  const c = (<Edge>t2.find(e => e.v !== b && e.v !== d)).v;
  return [a.p, b.p, c.p, d.p];
};

// calculates right side angle at b in radians
const rightSideAngle = (a: V2, b: V2, c: V2): number => {
  const ab = V2.sub(b, a);
  const bc = V2.sub(c, b);
  const dot = V2.dot(ab, bc);
  const abMag = V2.mag(ab);
  const bcMag = V2.mag(bc);
  return Math.acos(dot / (abMag * bcMag));
};

// given positions in clockwise order, outputs whether the polygon is convex
// assumes that the input is a correct polygon (>=3 verts)
const isConvex = (positions: V2[]): boolean => {
  // check that every internal angle is <180 degrees
  let prev = positions[0];
  for (let i = 1; i <= positions.length; i++) {
    // check that the right angle at curr is <180
    if (rightSideAngle(prev, positions[i % positions.length], positions[(i + 1) % positions.length]) >= Math.PI) {
      return false;
    }
  }
  return true;
};

const flip = (t: Tri, idx: number) => {

};

// a triangulation is a maximal planar subdivision
// --> an edge between a and b must exist in some triangulation
// any triangulation can be transformed into any other triangulation through an edge flipping procedure
// --> we can reach that triangulation with edge flips
export const flipInsert = (a: Vertex, b: Vertex) => {
  /* 
    TODO:
      * handle constrained edges (insert vertices if necessary)
      * handle colinearity
  */
  const todo: any = 0;
  let t = todo;
  let eIdx = todo;
  while (t) {
    const v1 = t[eIdx].v;
    const v2 = t[(eIdx+1)%3].v;
    const intersection = lineToLineIntersection3(v1.p, v2.p, a.p, b.p);
    if (intersection.type === 'point') {
      const quadIsConvex = isConvex(quad(t, eIdx));
      if (quadIsConvex) {
        // flip e
        flip(t, eIdx);
      } else {
        // flip the next edge
      }
    } else if (intersection.type === 'vertex') {
      const vertex = [v1, v2, a, b][intersection.vertex];
      // TODO add constraint to the edge ...
      flipInsert(vertex, b);
      return;
    } else {
      // TODO add constraint
      // b is one of the vertices of the triangle
      // in a previous step an edge must have been
      // flipped to create ab
      // therefore the procedure is complete
      return;
    }

    // proceed to the next triangle
  }
};
