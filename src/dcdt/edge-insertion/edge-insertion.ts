import { V2 } from "../math";
import { Channel } from "./channel";
import { Tri, getEdgeEndpoints } from "../dcdt";
import { Vertex } from "../dcdt";
import { lineSegmentIntersection, IntersectionResult } from "../line-segment-intersection";
import { insertVertexOnEdge } from "../vertex-insertion";

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
    if (res !== null && (
      // one of the following intersection types must exist
         res[1].type === 'point'
      || res[1].type === 'equal'
      || (res[1].type === 'colinear' && res[1].aIsC && res[1].intersections.length > 0)
    )) {
      return [t, res[0], res[1]];
    }
  }
  throw new Error();
}

const nextIntersection = (prev: Tri, curr: Tri, a: Vertex, b: Vertex): [number, IntersectionResult] | null => {
  const ir = getFirstIntersection(a, b, curr, [prev]);
  return ir === null ? null : ir;
};

// finds the triangles with edge ab and ba, and adds the constraint cIx to them
const constrainEdge = (a: Vertex, b: Vertex, cIx: number) => {
  for (let t of a.T) {
    const p = t[0].v;
    const q = t[1].v;
    const r = t[2].v;
    const aIx = [p, q, r].findIndex(s => s === a);
    const bIx = [p, q, r].findIndex(s => s === b);
    if(bIx >= 0) {
      if ((aIx + 1) % 3 === bIx) {
        t[aIx].C.add(cIx);
      } else {
        t[bIx].C.add(cIx);
      }
    }
  }
}

export const insertEdge = (a: Vertex, b: Vertex, cIx: number, ɛ: number) => {
  if (a === b) { return; }
  // get initial intersection
  let tri: Tri; let eIx: number; let intersection: IntersectionResult;
  [tri, eIx, intersection] = getInitialTri(a, b);
  let next = <Tri>tri[eIx].neighbor;

  const channel: Channel = new Channel(tri[eIx].v, ɛ);
  while (true) {
    channel.pushTriangle(tri);
    if (intersection.type === 'equal') {
      constrainEdge(a, b, cIx);
      return;
    } else if (intersection.type === 'vertex') {
      const v = getEdgeEndpoints(tri, eIx)[intersection.vertex];
      insertEdge(a, b, cIx, ɛ);
      insertEdge(v, b, cIx, ɛ);
      return;
    } else if (intersection.type === 'point') {
      const edge = tri[eIx];
      if (edge.C.size > 0) {
        const v = insertVertexOnEdge(intersection.point, tri, eIx, cIx);
        channel.pushVertex(undefined);
        // if channel has only one triangle, then there's a direct path
        if (channel.size() > 1) {
          // the last triangle might have been destroyed in the vertex insertion procedure
          channel.updateLastTri(<Tri>v.T.find(t => t.some(e => e.neighbor === channel.getSecondLastTri())));
          channel.reduce();
        }
        constrainEdge(a, v, cIx);
        insertEdge(v, b, cIx, ɛ);
        return;
      } else if (channel.getCurrentVertex() !== tri[eIx].v) {
        channel.pushVertex(tri[eIx].v);
        if (channel.checkConvex()) {
          channel.reduce();
        }
      }
    } else if (intersection.type === 'colinear') {
      // can only happen with the initial edge
      // aIsC must be true
      // the initial segment must be equal, insert the latter segment
      const v = getEdgeEndpoints(tri, eIx)[1];
      constrainEdge(a, v, cIx);
      insertEdge(v, b, cIx, ɛ);
      return;
    }

    // get next intersection
    tri = next;
    const _ = nextIntersection(channel.getLastTri(), tri, a, b);
    if (_ === null) {
      channel.pushTriangle(tri);
      channel.pushVertex(undefined);
      channel.reduce();
      constrainEdge(a, b, cIx);
      return;
    }
    [eIx, intersection] = _;
    next = <Tri>tri[eIx].neighbor;
  }
};
