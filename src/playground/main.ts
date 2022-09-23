import { DCDT, Edge, Face, Vertex } from "../dcdt/dcdt";
import { getCircumcenter, V2 } from "../dcdt/math";
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
const offset = 0;

const randomPoint = (): V2 => [Math.random(), Math.random()];

const randomPoints = (max: number): V2[] => {
  const points: V2[] = [];
  for (let i = 0; i < 1 + Math.random() * max; i++) {
    points.push(randomPoint());
  }
  return points;
}

const generateRandomInput = (max: number) => {
  const r = randomPoints(max);
  return [...r, r[0]];
};

const drawEdges = (edges: Edge[]) => {
  for (let edge of edges) {
    if (edge.crep.length > 0) {
      ctx.strokeStyle = 'rgba(255,0,0,0.5)';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.moveTo(edge.vertices[0].position[0] * scale + offset, edge.vertices[0].position[1] * scale + offset);
    ctx.lineTo(edge.vertices[1].position[0] * scale + offset, edge.vertices[1].position[1] * scale + offset);
    ctx.stroke();
  }
};

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

const drawVertices = (vertices: Vertex[]) => drawPoints(vertices.map(v => v.position));
const drawPoints = (points: V2[]) => {
  ctx.fillStyle = 'black';
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

const dcdt = new DCDT(0.001, [0, 0], [1, 0], [0, 1], [1, 1]);
dcdt.insertConstraint(generateRandomInput(50), 0);
drawFaces(dcdt.faces);
drawCircumcircles(dcdt.faces);
drawEdges(dcdt.edges);
drawVertices(dcdt.vertices);
