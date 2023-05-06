import { Constraint, insertConstraint } from "../dcdt/dcdt";
import { validateTriangulation } from "../dcdt/validation";
import { DebugDraw } from "./debug-draw";
import { DFS, createTestSquare, generateNRandomEdges, generateNRandomPoints, getVerticesFromTriangles } from "./utils";

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas');
canvas.style.backgroundColor = "#eeeeee"
canvas.width = window.innerWidth - 30;
canvas.height = window.innerHeight - 30;
const ctx: CanvasRenderingContext2D = <any>canvas.getContext('2d');
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth - 30;
  canvas.height = window.innerHeight - 30;
});

export const debug = new DebugDraw(ctx, canvas);

const root = createTestSquare();
const n = 20;
const P = generateNRandomPoints(n);
const C: Constraint = { P, E: generateNRandomEdges(1, n-1) };
console.log(C);
const [tri, cIx] = insertConstraint(root, C, 0.001);
const tris = DFS(tri);
const verts = getVerticesFromTriangles(tris);
validateTriangulation(tris);
tris.forEach(tri => debug.drawTriangleEdges(tri, 'rgba(0,0,0,.2)'));
debug.drawVertices(verts, 'rgba(0,0,0,.2)');
