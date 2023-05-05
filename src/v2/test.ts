import { Tri, Vertex, insertConstraint } from "./dcdt2";
import { DFS } from "./graph-search";

export const getVerticesFromTriangles = (tris: Tri[]) => {
  const verts: Set<Vertex> = new Set();
  tris.forEach(t => t.forEach(te => verts.add(te.v)));
  return Array.from(verts);
};
/* 
export const createTestTriangle = (): Tri => {
  const root: Tri = [
    { neighbor: null, v: { p: [0, 0], T: [] } },
    { neighbor: null, v: { p: [0, 2], T: [] } },
    { neighbor: null, v: { p: [2, 0], T: [] } }
  ];
  root.forEach(te => te.v.T.push(root));
  return root;
}
 */
export const createTestSquare = (): Tri => {
  const a: Vertex = { p: [0, 0], T: [] };
  const b: Vertex = { p: [0, 1], T: [] };
  const c: Vertex = { p: [1, 0], T: [] };
  const d: Vertex = { p: [1, 1], T: [] };
  const t1: Tri = [
    { neighbor: null, v: a },
    { neighbor: null, v: b },
    { neighbor: null, v: c }
  ];
  const t2: Tri = [
    { neighbor: null, v: b },
    { neighbor: null, v: d },
    { neighbor: null, v: c }
  ];
  t1[1].neighbor = t2;
  t2[2].neighbor = t1;
  a.T.push(t1);
  b.T.push(t1, t2);
  c.T.push(t1, t2);
  d.T.push(t2);

  return t1;
}

/* const testPointInsertInTriangle = () => {
  const root = createTestTriangle();
  const [tri, cIdx] = insertConstraint(root, { P: [[.1, .1]], E: [] }, 0.001);
  const tris = DFS(tri);
  const verts = getVerticesFromTriangles(tris);
  console.assert(verts.length === 4, 'Expected trianglulation to contain 4 vertices.');
};

const testPointInsertOnOuterEdge = () => {
  const root = createTestTriangle();
  const [tri, cIdx] = insertConstraint(root, { P: [[.5, 0]], E: [] }, 0.001);
  const tris = DFS(tri);
  const verts = getVerticesFromTriangles(tris);
  console.assert(verts.length === 4, 'Expected trianglulation to contain 4 vertices.');
} */

//testPointInsertInTriangle();
//testPointInsertOnOuterEdge();
