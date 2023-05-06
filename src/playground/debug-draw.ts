import { Tri, Vertex } from "../dcdt/dcdt";
import { V2 } from "../dcdt/math";
import { DFS, getVerticesFromTriangles } from "./utils";

export class DebugDraw {
  scale = 1000;
  offset = 100;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private canvas: HTMLCanvasElement
  ) {}

  clear = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawEdges = (edges: [V2, V2][], color = 'rgba(0,0,0,0.5)') => {
    for (let edge of edges) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(edge[0][0] * this.scale + this.offset, edge[0][1] * this.scale + this.offset);
      this.ctx.lineTo(edge[1][0] * this.scale + this.offset, edge[1][1] * this.scale + this.offset);
      this.ctx.stroke();
    }
  }

  drawTriangleEdges = (tri: Tri, color?: string) => {
    const edges: [V2,V2][] = [];
    for (let i = 0; i < 3; i++) {
      edges.push([tri[i].v.p, tri[(i + 1) % 3].v.p]);
    }
    this.drawEdges(edges, color);
  }

  drawPoints = (points: V2[], color = 'black') => {
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 1;
    for (let p of points) {
      this.ctx.beginPath();
      const x = p[0] * this.scale + this.offset;
      const y = p[1] * this.scale + this.offset;
      this.ctx.moveTo(x, y);
      this.ctx.arc(x, y, 5, 0, 360);
      this.ctx.fill();
    }
  }

  drawVertices(vertices: Vertex[], color?: string) {
    this.drawPoints(vertices.map(v => v.p), color);
  }

  drawTriangulation (tri: Tri, color?: string) {
    const tris = DFS(tri);
    const verts = getVerticesFromTriangles(tris);

    tris.forEach(tri => this.drawTriangleEdges(tri, color));
    this.drawVertices(verts, color);
  }
}
