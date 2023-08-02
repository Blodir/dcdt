import { pointIsOnLeftHalfplane, triArea } from "../dcdt/math";
import { Tri } from "./dcdt";

export const validateTriangulation = (tris: Tri[]) => {
  for (let t of tris) {
    console.assert(
      t.length === 3,
      'each Tri has 3 edges'
    );

    for (let i = 0; i < 3; i++) {
      if (t[i].neighbor !== null) {
        console.assert(
          t[i].neighbor?.find(e2 => e2.neighbor === t),
          'for each Tri t with neighbor n, t is also a neighbor of n'
        )
      }

      console.assert(
        t[i].v.T.includes(t),
        'for each vertex v of Tri t, v has a link to t'
      );

      (() => {
        const a = t[i].v.p;
        const b = t[(i+1)%3].v.p;
        const c = t[(i+2)%3].v.p;
        const areaIsLargerThanZero = triArea(a[0], b[0], c[0], a[1], b[1], c[1]) > 0;
        console.assert(
          areaIsLargerThanZero,
          'Area of each triangle has to be larger than 0'
        );
        if (!areaIsLargerThanZero) {
          throw new Error();
        }
      })();

      (() => {
        const a = t[i].v.p;
        const b = t[(i+1)%3].v.p;
        const c = t[(i+2)%3].v.p;
        console.assert(
          !pointIsOnLeftHalfplane(c[0], c[1], a[0], a[1], b[0], b[1]),
          `TriEdges are in clockwise order: a: [${a}], b: [${b}], c: [${c}]`
        );
        if (pointIsOnLeftHalfplane(c[0], c[1], a[0], a[1], b[0], b[1])) {
          throw new Error();
        }
      })();
    }
  }
  // graph is planar
  // ...
  // subdivision is maximal
  // ...
  // for each vertex v the list v.T should be clockwise
  // ...
  // triangulation is a CDT
  // ...
};
