import { getCircumcenter, V2 } from "../dcdt/math";
import { Constraint, insertConstraint, Tri, Vertex } from "../v2/dcdt2";
import { DFS } from "../v2/graph-search";
import { createTestSquare, getVerticesFromTriangles } from "../v2/test";
import { validateTriangulation } from "../v2/validation";
import { discreteColorGradient } from "./colors";

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas');
canvas.style.backgroundColor = "#eeeeee"
canvas.width = window.innerWidth - 30;
canvas.height = window.innerHeight - 30;
const ctx: CanvasRenderingContext2D = <any>canvas.getContext('2d');
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth - 30;
  canvas.height = window.innerHeight - 30;
});

const scale = 1000;
const offset = 100;

const randomPoint = (): V2 => [Math.random(), Math.random()];

const randomPoints = (max: number): V2[] => {
  const points: V2[] = [];
  for (let i = 0; i < 1 + Math.random() * max; i++) {
    points.push(randomPoint());
  }
  return points;
}

const generateNRandomPoints = (amount: number): V2[] => {
  const points: V2[] = [];
  for (let i = 0; i < amount; i++) {
    points.push(randomPoint());
  }
  return points;
}

const generateRandomInput = (max: number) => {
  const r = randomPoints(max);
  return [...r, r[0]];
};

export const canvasClear = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const drawEdges = (edges: [V2, V2][], color = 'rgba(0,0,0,0.5)') => {
  for (let edge of edges) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(edge[0][0] * scale + offset, edge[0][1] * scale + offset);
    ctx.lineTo(edge[1][0] * scale + offset, edge[1][1] * scale + offset);
    ctx.stroke();
  }
};

export const drawTriangleEdges = (tri: Tri, color?: string) => {
  const edges: [V2,V2][] = [];
  for (let i = 0; i < 3; i++) {
    edges.push([tri[i].v.p, tri[(i + 1) % 3].v.p]);
  }
  drawEdges(edges, color);
};

/* 
const drawFaces = (faces: Face[]) => {
  let idx = 0;
  const gradient = discreteColorGradient('FAFAD1', '4B57A4', faces.length);
  for (let face of faces) {
    const region = new Path2D();
    const startPos = face.vertices[face.vertices.length - 1].position;
    region.moveTo(startPos[0] * scale + offset, startPos[1] * scale + offset);
    face.vertices.forEach(vert => {
      const x = vert.position[0] * scale + offset;
      const y = vert.position[1] * scale + offset;
      region.lineTo(x, y);
    });
    region.closePath();
    ctx.fillStyle = '#' + gradient[idx];
    ctx.fill(region);
    idx++;
    

  }
};
 */
export const drawPoints = (points: V2[], color = 'black') => {
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  for (let p of points) {
    ctx.beginPath();
    const x = p[0] * scale + offset;
    const y = p[1] * scale + offset;
    ctx.moveTo(x, y);
    ctx.arc(x, y, 5, 0, 360);
    ctx.fill();
  }
};
const drawVertices = (vertices: Vertex[], color?: string) => drawPoints(vertices.map(v => v.p), color);
/* 
const drawCircumcircles = (faces: Face[]) => {
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  for (let f of faces) {
    const center = getCircumcenter(f.vertices[0].position, f.vertices[1].position, f.vertices[2].position);
    const radius = V2.dist(center, f.vertices[0].position);
    ctx.beginPath();
    ctx.arc(center[0] * scale + offset, center[1] * scale + offset, radius * scale, 0, 360);
    ctx.stroke();
  }
}
 */
/* 
  FIXED!
const errorP1: V2[] = [
  [
      0.47916558008474053,
      0.5222369438217807
  ],
  [
      0.7522552929651833,
      0.19306462101132604
  ]
]; */

export const drawHelper = (tri: Tri, color?: string) => {
  const tris = DFS(tri);
  const verts = getVerticesFromTriangles(tris);

  tris.forEach(tri => drawTriangleEdges(tri, color));
  drawVertices(verts, color);
}

export const generateRandomEdges = (n: number, maxIx: number): [number, number][] => {
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = Math.round(Math.random() * maxIx);
    const b = Math.round(Math.random() * maxIx);
    if (a === b) {
      i--;
    } else {
      edges.push(<[number, number]>[a, b]);
    }
  }
  return edges;
};

const root = createTestSquare();
const n = 20;
const P = generateNRandomPoints(n);
const C: Constraint = { P, E: generateRandomEdges(1, n-1) };
console.log(C);
const [tri, cIdx] = insertConstraint(root, C, 0.001);
const tris = DFS(tri);
const verts = getVerticesFromTriangles(tris);
validateTriangulation(tris);
tris.forEach(tri => drawTriangleEdges(tri, 'rgba(0,0,0,.2)'));
drawVertices(verts, 'rgba(0,0,0,.2)');
