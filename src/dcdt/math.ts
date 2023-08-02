export const degToRad =  (deg: number) => deg / 360 * 2 * Math.PI;
export const radToDeg = (rad: number) => rad / (2 * Math.PI) * 360;

export type V2 = [number, number];
export type Deg = number;
export const V2 = {
  scale: (v: V2, s: number): V2 => ([v[0] * s, v[1] * s]),
  add: (a: V2, b: V2): V2 => ([a[0] + b[0], a[1] + b[1]]),
  sub: (a: V2, b: V2): V2 => ([a[0] - b[0], a[1] - b[1]]),
  normalize: (v: V2): V2 => {
    const mag = V2.mag(v);
    if (mag === 0) { return [0, 0]; }
    return [v[0] / mag, v[1] / mag];
  },
  mag: (v: V2): number => Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2)),
  dist: (a: V2, b: V2): number => V2.mag(V2.sub(b, a)),
  toDeg: (v: V2): number => (360 + Math.atan2(v[0], v[1]) * 180 / Math.PI) % 360,
  ceil: (v: V2, max: number) => {
    if (V2.mag(v) > max) {
      return V2.scale(V2.normalize(v), max);
    } else { return v; }
  },
  dot: (a: V2, b: V2): number => a[0] * b[0] + a[1] * b[1],
  cross: (a: V2, b: V2): number => a[0] * b[1] - a[1] * b[0],
  rotRad: (v: V2, rad: number): V2 => [Math.cos(rad) * v[0] - Math.sin(rad) * v[1], Math.sin(rad) * v[0] + Math.cos(rad) * v[1]], // anticlockwise rotation
  lerp: (a: V2, b: V2, t: number) => V2.add(a, V2.scale(V2.sub(b, a), t)), // a + (b - a) * t
  quadraticBezier: (a: V2, b: V2, c: V2, t: number) => {
    const ab = V2.lerp(a, b, t);
    const cb = V2.lerp(c, b, 1-t);
    return V2.lerp(ab, cb, t);
  },
  perpClockwise: (v: V2): V2 => ([v[1], -v[0]]), // clockwise
  perpCounterClockwise: (v: V2): V2 => ([-v[1], v[0]]), // clockwise
  eq: (a: V2, b: V2): boolean => a[0] === b[0] && a[1] === b[1],
  angle: (a: V2, b: V2): number => Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]),
  linearDep: (a: V2, b: V2): boolean => a[1] / a[0] === b[1] / b[0] // returns if two vectors are linearly dependent
};

export const pointIsOnLineSegment = (point: V2, a: V2, b: V2): boolean => {
  // p = a + t*(b-a)
  // p - a = t*(b-a)
  const AB = V2.sub(b, a);
  const AP = V2.sub(point, a);
  // AP = t * AB
  // apx = t * abx
  const t0 = AP[0] / AB[0];
  // apy = t * apy
  // const t1 = AP[1] / AP[0];
  if (t0 >= 1) {
    return false;
  }
  return (
    V2.eq(V2.scale(AB, t0), AP)
  );
};

export const pointIsOnRightSideOfLineSegment = (point: V2, lineSegment: [V2, V2]): boolean => {
  const OA = V2.sub(lineSegment[1], lineSegment[0]);
  const OB = V2.sub(point, lineSegment[0]);
  const P = V2.perpCounterClockwise(OA); // counter-clockwise, because Y is flipped
  return V2.dot(OB, P) > 0;
};

// has errors when some of the coordinates are zero?
export const pointIsInsideTriangle = (p: V2, a: V2, b: V2, c: V2): boolean => (
  pointIsOnLineSegment(p, a, b)
  || pointIsOnLineSegment(p, b, c)
  || pointIsOnLineSegment(p, a, c)
  || (
    // if c is on the right side of ab then p is also
      pointIsOnRightSideOfLineSegment(c, [a, b]) === pointIsOnRightSideOfLineSegment(p, [a, b])
    // if b is on the right side of ac then p is also
    && pointIsOnRightSideOfLineSegment(b, [a, c]) === pointIsOnRightSideOfLineSegment(p, [a, c])
    // if a is on the right side of bc then p is also
    && pointIsOnRightSideOfLineSegment(a, [b, c]) === pointIsOnRightSideOfLineSegment(p, [b, c])
  )
);

export const squaredMagnitude = (a: V2): number => (
  Math.pow(a[0], 2) + Math.pow(a[1], 2)
);

export const projectPointToLine = (p: V2, a: V2, b: V2): V2 => {
  const AP = V2.sub(p, a);
  const AB = V2.sub(b, a);
  const t = V2.dot(AP, AB) / V2.dot(AB, AB);
  return V2.add(a, V2.scale(AB, t));
};

export const getCircumcenter = (a: V2, b: V2, c: V2): V2 => {
  // https://en.wikipedia.org/wiki/Circumscribed_circle#Cartesian_coordinates_2
  const D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const Dd = 1 / D;
  const aMag = squaredMagnitude(a);
  const bMag = squaredMagnitude(b);
  const cMag = squaredMagnitude(c);
  return [
    Dd * (
        aMag * (b[1] - c[1])
      + bMag * (c[1] - a[1])
      + cMag * (a[1] - b[1])
    ),
    Dd * (
        aMag * (c[0] - b[0])
      + bMag * (a[0] - c[0])
      + cMag * (b[0] - a[0])
    )
  ];
};

export const pointIsInsideCircumcircle = (p: V2, a: V2, b: V2, c: V2): boolean => {
  // reference: Dufourd, Bertot 2010
  const circumcenter = getCircumcenter(a, b, c);
  const r = V2.dist(a, circumcenter);
  return V2.dist(p, circumcenter) < r;
};

//export const pointIsOnLeftHalfplane = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => (x < (bx - ax) * (y - ay) / (by - ay) + ax);
// expects math coordinates (flipped y)
export const pointIsOnLeftHalfplane = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => ((bx - ax) * (y - ay) - (by - ay) * (x - ax) > 0);

export const pointDistToLineSegment = (p: V2, a: V2, b: V2): number => {
  const AP = V2.sub(p, a);
  const AB = V2.sub(b, a);
  const t = V2.dot(AP, AB) / V2.dot(AB, AB);
  if (t > 0) {
    const projection = V2.add(a, V2.scale(AB, t));
    return V2.dist(projection, p);
  } else {
    const distA = V2.dist(a, p);
    const distB = V2.dist(b, p);
    return distA > distB ? distB : distA;
  }
};

// returns null if projection is outside of the line segment
export const pointDistToLineSegmentB = (p: V2, a: V2, b: V2): number | null => {
  const AP = V2.sub(p, a);
  const AB = V2.sub(b, a);
  const t = V2.dot(AP, AB) / V2.dot(AB, AB);
  if (t > 0) {
    const projection = V2.add(a, V2.scale(AB, t));
    return V2.dist(projection, p);
  } else {
    return null;
  }
};

// https://stackoverflow.com/a/38856694
export const rightSideAngle = (a: V2, b: V2, c: V2): number => {
  const p2p1 = V2.sub(a, b);
  const p2p3 = V2.sub(c, b);
  const signed = Math.atan2(V2.cross(p2p1, p2p3), V2.dot(p2p1, p2p3));
  return signed < 0 ? 2 * Math.PI + signed : signed;
}

// https://stackoverflow.com/a/2049593
export const signSO = (p1: [number, number], p2: [number, number], p3: [number, number]) => {
  return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}
export const pointInTriangleSO = (pt: [number, number], v1: [number, number], v2: [number, number], v3: [number, number]) => {
  let d1: number, d2: number, d3: number;
  let has_neg: boolean, has_pos: boolean;

  d1 = signSO(pt, v1, v2);
  d2 = signSO(pt, v2, v3);
  d3 = signSO(pt, v3, v1);

  has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

  return !(has_neg && has_pos);
}

// "Shoelace formula"
export const triArea = (x1: number, x2: number, x3: number, y1: number, y2: number, y3: number) => Math.abs((x1 * y2) + (x2 * y3) + (x3 * y1) - (y1 * x2) - (y2 * x3) - (y3 * x1)) / 2;
