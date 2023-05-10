import { V2, pointIsInsideTriangle, rightSideAngle } from "../dcdt/math";
import { debug } from "../playground/main";
import { Channel } from "./channel";
import { Edge, Tri, flipEdge, getEdgeEndpoints } from "./dcdt";
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

const nextIntersection = (prev: Tri, curr: Tri, a: Vertex, b: Vertex): [number, IntersectionResult] | null => {
  const ir = getFirstIntersection(a, b, curr, [prev]);
  return ir === null ? null : ir;
};

export const insertEdge2 = (a: Vertex, b: Vertex) => {
  // get initial intersection
  let tri: Tri; let eIx: number; let intersection: IntersectionResult;
  [tri, eIx, intersection] = getInitialTri(a, b);
  let next = <Tri>tri[eIx].neighbor;

  const channel: Channel = new Channel(tri[eIx].v);
  while (true) {
    channel.pushTriangle(tri);
    if (intersection.type === 'equal') {
      return;
    } else if (intersection.type === 'vertex') {
      channel.pushVertex(undefined);
      channel.reduce();
      insertEdge2(getEdgeEndpoints(tri, eIx)[intersection.vertex], b);
    } else if (intersection.type === 'point') {
      if (channel.getCurrentVertex() !== tri[eIx].v) {
        channel.pushVertex(tri[eIx].v);
        if (channel.checkConvex()) {
          channel.reduce();
        }
      }
    }

    // get next intersection
    tri = next;
    const _ = nextIntersection(channel.getLastTri(), tri, a, b);
    if (_ === null) {
      channel.pushTriangle(tri);
      channel.pushVertex(undefined);
      channel.reduce();
      return;
    }
    [eIx, intersection] = _;
    next = <Tri>tri[eIx].neighbor;
  }
};
