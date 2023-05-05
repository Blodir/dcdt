import { V2 } from "./math";

const cross2 = (a: V2, b: V2): number => (
  a[0] * b[1] - a[1] * b[0]
);

export interface NoIntersection {
  type: 'none';
}

export interface PointIntersection {
  type: 'point';
  point: V2;
}

export interface VertexIntersection {
  type: 'vertex';
  vertex: number;
}

export interface ColinearIntersection {
  type: 'colinear';
  aIsC: boolean;
  bIsC: boolean;
  aIsD: boolean;
  bIsD: boolean;
  intersections: number[];
}

export interface EqualityIntersection {
  type: 'equal';
}

export type IntersectionResult = NoIntersection | PointIntersection | VertexIntersection | ColinearIntersection | EqualityIntersection;

const eq = (a: number, b: number, f = 0.000001): boolean => {
  return Math.abs(b - a) <= f;
};

// return negative for less than, 0 for equal and positive for greater than
const comp = (a: number, b: number, f = 0.000001): number => {
  const diff = a - b;
  return diff <= f && diff >= -f ? 0 : diff;
};

// https://stackoverflow.com/a/565282
// ɛ: distance error
// f: float error
export const lineToLineIntersection3 = (a: V2, b: V2, c: V2, d: V2, ɛ = 0.000001, f = 0.000001): IntersectionResult => {
  const r = V2.sub(b, a);
  const s = V2.sub(d, c);
  // u = (q − p) × r / (r × s)
  const num = cross2((V2.sub(c, a)), r)
  const denom = cross2(r, s);
  if (eq(denom, 0, f) && eq(num, 0, f)) {
    // lines are colinear
    let t0 = 0;
    let t1 = 0;
    if (r[0] !== 0) {
      t0 = (c[0] - a[0]) / r[0];
      t1 = (d[0] - a[0]) / r[0];
    } else {
      t0 = (c[1] - a[1]) / r[1];
      t1 = (d[1] - a[1]) / r[1];
    }
    let t2 = 0;
    let t3 = 0;
    if (r[0] !== 0) {
      t2 = (a[0] - c[0]) / s[0];
      t3 = (b[0] - c[0]) / s[0];
    } else {
      t2 = (a[1] - c[1]) / s[1];
      t3 = (b[1] - c[1]) / s[1];
    }
    if ((eq(t0, 0, f) && eq(t1, 1, f)) || (eq(t1, 0, f) && eq(t0, 1, f))) {
      return { type: 'equal' }
    }

    const intersections = [];
    let aIsC = false;
    let bIsC = false;
    let aIsD = false;
    let bIsD = false;

    const t0comp0 = comp(t0, 0, f);
    const t0comp1 = comp(t0, 1, f);
    const t1comp0 = comp(t1, 0, f);
    const t1comp1 = comp(t1, 1, f);
    const t2comp0 = comp(t2, 0, f);
    const t2comp1 = comp(t2, 1, f);
    const t3comp0 = comp(t3, 0, f);
    const t3comp1 = comp(t3, 1, f);
    // 0 < t0 < 1
    if (t0comp0 > 0 && t0comp1 < 0) {
      // c is on ab
      intersections.push(2);
    } else if (t0comp0 === 0) {
      // c is a
      aIsC = true;
    } else if (t0comp1 === 0) {
      // c is b
      bIsC = true;
    }
    // 0 < t1 < 1
    if (t1comp0 > 0 && t1comp1 < 0) {
      // d is on ab
      intersections.push(3);
    } else if (t1comp0 === 0) {
      // d is a
      aIsD = true;
    } else if (t1comp1 === 0) {
      // d is b
      bIsD = true;
    }
    if (t2comp0 > 0 && t2comp1 < 0) {
      // a is on cd
      intersections.push(0);
    }
    if (t3comp0 > 0 && t3comp1 < 0) {
      // b is on cd
      intersections.push(1);
    }
    if (intersections.length > 0 || aIsC || bIsC || aIsD || bIsD) {
      return <ColinearIntersection>{ type: 'colinear', aIsC, bIsC, aIsD, bIsD, intersections };
    }

    // colinear, but no intersection
    return { type: 'none' };
  }

  if (eq(denom, 0, f)) {
    // lines are parallel
    return { type: 'none' };
  }

  const u = num / denom;
  const t = cross2(V2.sub(c, a), s) / denom;
  const uComp0 = comp(u, 0, f);
  const uComp1 = comp(u, 1, f);
  const tComp0 = comp(t, 0, f);
  const tComp1 = comp(t, 1, f);
  if (uComp0 > 0 && uComp1 < 0 && tComp0 > 0 && tComp1 < 0) {
    // lines intersect
    const p = V2.add(c, V2.scale(s, u));

    // is intersection point a vertex?
    if (V2.dist(p, a) < ɛ) { return <VertexIntersection>{ type: 'vertex', vertex: 0 } }
    if (V2.dist(p, b) < ɛ) { return <VertexIntersection>{ type: 'vertex', vertex: 1 } }
    if (V2.dist(p, c) < ɛ) { return <VertexIntersection>{ type: 'vertex', vertex: 2 } }
    if (V2.dist(p, d) < ɛ) { return <VertexIntersection>{ type: 'vertex', vertex: 3 } }

    // return intersection point
    return <PointIntersection>{ type: 'point', point: p };
  }

  // not intersecting
  return { type: 'none' };
};
