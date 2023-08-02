import { Constraint, DCDT } from "../dcdt/dcdt";
import { DebugDraw } from "./debug-draw";
import { DFS, generateNRandomEdges, generateNRandomPoints, getVerticesFromTriangles } from "./utils";

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas');
canvas.style.backgroundColor = "#eeeeee"
canvas.width = window.innerWidth - 30;
canvas.height = window.innerHeight - 30;
const ctx: CanvasRenderingContext2D = <any>canvas.getContext('2d');

export const debug = new DebugDraw(ctx, canvas);
const scale = 100;
debug.scale = scale / 10;
debug.offset = 100;
canvas.width = 1200;
canvas.height = 1200;
const n = 50;
const P = generateNRandomPoints(n, scale);
const C: Constraint = { P, E: generateNRandomEdges(5, n-1) };
const dcdt = new DCDT(scale, scale, 0.00001);
dcdt.insertConstraint(C);
const tris = DFS(dcdt.someTri);
const verts = getVerticesFromTriangles(tris);
tris.forEach(tri => debug.drawTriangle(tri, 'rgba(0,0,0,.2)'));
debug.drawVertices(verts, 'rgba(0,0,0,.2)');
