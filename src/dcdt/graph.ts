import { V2 } from "./math";

interface Vertex {
  position: V2;
  edges: Edge[];
  faces: Face[];
}

interface Edge {
  vertices: Vertex[];
  faces: Face[];
}

interface Face {
  vertices: Vertex[];
  edges: Edge[];
}

/**
 * 
 * @returns empty vertex
 */
const addVertex = (position: V2): Vertex => (
  {
    position,
    edges: [],
    faces: []
  }
);

/**
 * 
 * @param a 
 * @param b 
 * @returns edge without faces
 */
const addEdge = (a: Vertex, b: Vertex): Edge => {
  const e: Edge = {
    vertices: [a, b],
    faces: []
  };
  a.edges.push(e);
  b.edges.push(e);
  return e;
};

/**
 * 
 * @param a 
 * @param b 
 * @param c 
 * @returns a fully connected face
 */
const addFace = (a: Edge, b: Edge, c: Edge): Face => {
  const vertexSet = new Set<Vertex>();
  const edges = [a, b, c];
  const vertices = Array.from(vertexSet);
  edges.forEach(e => e.vertices.forEach(v => vertexSet.add(v)));
  const f: Face = {
    vertices,
    edges
  }
  vertices.forEach(v => v.faces.push(f));
  edges.forEach(e => e.faces.push(f));
  return f;
};

const removeVertex = () => {
  // remove all edges
  // remove all faces
  // combine all vertices to a new face
};

const removeEdge = () => {
  // joins the adjacent faces together
};

const removeFace = () => {

};
