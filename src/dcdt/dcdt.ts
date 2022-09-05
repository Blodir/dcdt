import { pointDistToLineSegment, pointDistToLineSegmentB, pointIsInsideCircumcircle, pointIsInsideTriangle, pointIsOnLeftHalfplane, projectPointToLine, V2 } from "./math";
import { ColinearIntersection, lineToLineIntersection3, PointIntersection, VertexIntersection } from "./lineToLineIntersection";

class Stack<T> {
  private stack: Array<T> = [];
  push(elem: T) { this.stack.push(elem); }
  isEmpty(): boolean { return this.stack.length === 0; }
  pop(): T | undefined { return this.stack.pop(); }
}

export interface Vertex {
  position: V2;
  edges: Edge[];
  faces: Face[];
}

export interface Edge {
  vertices: Vertex[];
  faces: Face[];
  crep: number[];
  debug?: string;
}

export interface Face {
  vertices: Vertex[];
  edges: Edge[];
  debug?: string;
}

export interface Intersection {
  point?: V2;
  edge?: Edge;
  vertex?: Vertex;
}

export class DCDT {
  vertices: Vertex[] = [];
  edges: Edge[] = [];
  faces: Face[] = [];
  outsideEdges: Edge[] = [];

  /* 
  a --- b
  |   / |
  | /   |
  c --- d
  */
  constructor(private ɛ: number, boundaryA: V2, boundaryB: V2, boundaryC: V2, boundaryD: V2) {
    const a: Vertex = {
      position: boundaryA,
      edges: [],
      faces: []
    };
    const b: Vertex = {
      position: boundaryB,
      edges: [],
      faces: []
    };
    const c: Vertex = {
      position: boundaryC,
      edges: [],
      faces: []
    };
    const d: Vertex = {
      position: boundaryD,
      edges: [],
      faces: []
    };
    const ab: Edge = {
      vertices: [a, b],
      faces: [],
      crep: []
    }
    const bc: Edge = {
      vertices: [b, c],
      faces: [],
      crep: []
    }
    const ca: Edge = {
      vertices: [c, a],
      faces: [],
      crep: []
    }
    const cd: Edge = {
      vertices: [c, d],
      faces: [],
      crep: []
    }
    const db: Edge = {
      vertices: [d, b],
      faces: [],
      crep: []
    }
    const abc: Face = {
      vertices: [a, b, c],
      edges: [ab, bc, ca],
      debug: 'boundary'
    }
    const bcd: Face = {
      vertices: [b, c, d],
      edges: [bc, cd, db],
      debug: 'boundary'
    }

    a.edges.push(ab, ca);
    a.faces.push(abc);

    b.edges.push(ab, bc, db);
    b.faces.push(abc, bcd);

    c.edges.push(bc, ca, cd);
    c.faces.push(abc, bcd);

    d.edges.push(cd, db);
    d.faces.push(bcd);

    ab.faces.push(abc);
    bc.faces.push(abc);
    ca.faces.push(abc);
    bc.faces.push(bcd);
    cd.faces.push(bcd);
    db.faces.push(bcd);

    this.vertices.push(a, b, c, d);
    this.edges.push(ab, bc, ca, cd, db);
    this.faces.push(abc, bcd);

    this.outsideEdges.push(ab, ca, cd, db);
  }

  private locatePoint(p: V2): { vertex?: Vertex, edge?: Edge, face?: Face } {
    const face = this.faces.find(f => pointIsInsideTriangle(p, f.vertices[0].position, f.vertices[1].position, f.vertices[2].position));
    if (face === undefined) {
      throw new Error('Point is outside of the mesh.');
    }

    for (let vert of face.vertices) {
      if (V2.dist(p, vert.position) < this.ɛ) {
        return { vertex: vert };
      }
    }

    for (let edge of face.edges) {
      const dist = pointDistToLineSegmentB(p, edge.vertices[0].position, edge.vertices[1].position);
      if (dist !== null && dist < this.ɛ) {
        return { edge };
      }
    }

    return { face };
  }

  private disconnectEdge(e: Edge) {
    // remove from list of edges
    this.edges = this.edges.filter(ed => ed !== e);

    // remove from adjacent vertices
    for (let v of e.vertices) {
      v.edges = v.edges.filter(ed => ed !== e);
    }

    // remove from adjacent faces
    for (let f of e.faces) {
      f.edges = f.edges.filter(ed => ed !== e);
    }
  }

  private disconnectFace(f: Face) {
    // remove from list of faces
    this.faces = this.faces.filter(fa => fa !== f);

    // remove from adjacent vertices
    for (let v of f.vertices) {
      v.faces = v.faces.filter(fa => fa !== f);
    }

    // remove from adjacent edges
    for (let e of f.edges) {
      e.faces = e.faces.filter(fa => fa !== f);
    }
  }

  /*      c
        /   \
      /       \
    a --------- b
      \       /
        \   /
          d
  */
  private flipEdge(edge: Edge) {
    const a = edge.vertices[0];
    const b = edge.vertices[1];
    const c = edge.faces[0]?.vertices.find(v => v !== a && v !== b);
    const d = edge.faces[1]?.vertices.find(v => v !== a && v !== b);
    if (!c || !d) { throw new Error("Can't flip edge of nonquadrilateral.") }
    const ac = <Edge>a.edges.find(e => e.vertices.some(v => v === c));
    const ad = <Edge>a.edges.find(e => e.vertices.some(v => v === d));
    const bc = <Edge>b.edges.find(e => e.vertices.some(v => v === c));
    const bd = <Edge>b.edges.find(e => e.vertices.some(v => v === d));
    const cd: Edge = {
      vertices: [c, d],
      faces: [],
      crep: []
    }
    const acd: Face = {
      vertices: [a, c, d],
      edges: [ac, cd, ad],
      debug: 'flipEdge'
    };
    const bcd: Face = {
      vertices: [b, c, d],
      edges: [bc, cd, bd],
      debug: 'flipEdge'
    };
    // update verts
    c.edges.push(cd);
    d.edges.push(cd);
    a.faces.push(acd);
    b.faces.push(bcd);
    c.faces.push(acd, bcd);
    d.faces.push(acd, bcd);
    // update edges
    ac.faces.push(acd);
    ad.faces.push(acd);
    bc.faces.push(bcd);
    bd.faces.push(bcd);
    cd.faces.push(acd, bcd);
    this.edges.push(cd);
    this.faces.push(acd, bcd);
    this.disconnectEdge(edge);
    this.disconnectFace(edge.faces[0]);
    this.disconnectFace(edge.faces[1]);
  }

  private edgeIsConstrained(edge: Edge): boolean {
    return edge.crep.length > 0 || edge.faces.length < 2;
  }

  private edgeIsDelaunay(edge: Edge): boolean {
    if (edge.faces.length !== 2) {
      console.error("Edge without two adjacent faces can't be checked for the delaunay property.", edge);
    }
    const verts = edge.faces[0].vertices;
    const d = edge.faces[1].vertices.filter(v => !verts.includes(v))[0];
    return !pointIsInsideCircumcircle(d.position, verts[0].position, verts[1].position, verts[2].position);
  }

  private flipEdges(stack: Stack<Edge>) {
    while (!stack.isEmpty()) {
      const edge = <Edge>stack.pop();
      if (!this.edgeIsConstrained(edge) && !this.edgeIsDelaunay(edge)) {
        this.flipEdge(edge);
      }
    }
  };

  /*      c
        / | \
      /   |   \
    a --- v --- b (edge e)
      \   |   /
        \ | /
          d
  */
  private insertPointInEdge(p: V2, e: Edge): Vertex {
    const a = e.vertices[0];
    const b = e.vertices[1];
    const c = e.faces[0]?.vertices.find(vert => vert !== a && vert !== b);
    const d = e.faces[1]?.vertices.find(vert => vert !== a && vert !== b);
    const ac = a.edges.find(edge => edge.vertices.some(vert => vert === c));
    const bc = b.edges.find(edge => edge.vertices.some(vert => vert === c));
    const ad = a.edges.find(edge => edge.vertices.some(vert => vert === d));
    const bd = b.edges.find(edge => edge.vertices.some(vert => vert === d));

    // if p is not exactly in e, project p to edge e;
    p = projectPointToLine(p, a.position, b.position);

    // v = new vertex created by inserting p in e according to Figure 2;
    const v: Vertex = {
      position: p,
      edges: [],
      faces: []
    };
    const av: Edge = {
      vertices: [a, v],
      faces: [],
      crep: []
    };
    const vb: Edge = {
      vertices: [v, b],
      faces: [],
      crep: []
    };
    // add the edges between v and the opposing vertices of the adjacent faces ...
    const vc: Edge | undefined = c ? {
      vertices: [v, c],
      faces: [],
      crep: []
    } : undefined;
    const vd: Edge | undefined = d ? {
      vertices: [v, d],
      faces: [],
      crep: []
    } : undefined;

    // create new faces
    const avc: Face | undefined = c ? {
      vertices: [a, v, c],
      edges: [av, <Edge>vc, <Edge>ac],
      debug: 'insertPointInEdge'
    } : undefined;
    const bvc: Face | undefined = c ? {
      vertices: [b, v, c],
      edges: [vb, <Edge>vc, <Edge>bc],
      debug: 'insertPointInEdge'
    } : undefined;
    const avd: Face | undefined = d ? {
      vertices: [a, v, d],
      edges: [av, <Edge>vd, <Edge>ad],
      debug: 'insertPointInEdge'
    } : undefined;
    const bvd: Face | undefined = d ? {
      vertices: [b, v, d],
      edges: [vb, <Edge>vd, <Edge>bd],
      debug: 'insertPointInEdge'
    } : undefined;
    // vertices: add edges
    a.edges.push(av);
    b.edges.push(vb);
    c?.edges.push(<Edge>vc);
    d?.edges.push(<Edge>vd);
    v.edges.push(av, vb);
    if (c) { v.edges.push(<Edge>vc); }
    if (d) { v.edges.push(<Edge>vd); }
    // vertices: add faces
    if (c) {
      a.faces.push(<Face>avc);
      b.faces.push(<Face>bvc);
      c.faces.push(<Face>avc, <Face>bvc);
      v.faces.push(<Face>avc, <Face>bvc);
    }
    if (d) {
      a.faces.push(<Face>avd);
      b.faces.push(<Face>bvd);
      d.faces.push(<Face>avd, <Face>bvd);
      v.faces.push(<Face>avd, <Face>bvd);
    }
    // edges: add vertices: already done
    // edges: add faces
    if (c) {
      (<Edge>ac).faces.push(<Face>avc);
      av.faces.push(<Face>avc);
      (<Edge>bc).faces.push(<Face>bvc);
      vb.faces.push(<Face>bvc);
      (<Edge>vc).faces.push(<Face>avc, <Face>bvc);
    }
    if (d) {
      av.faces.push(<Face>avd);
      (<Edge>ad).faces.push(<Face>avd);
      vb.faces.push(<Face>bvd);
      (<Edge>bd).faces.push(<Face>bvd);
      (<Edge>vd).faces.push(<Face>avd, <Face>bvd);
    }
    // faces: add vertices: already done
    // faces: add edges: already done

    // add new stuff to global lists
    this.vertices.push(v);
    this.edges.push(av, vb);
    if (c) { this.edges.push(<Edge>vc); }
    if (d) { this.edges.push(<Edge>vd); }
    if (c) {
      this.faces.push(<Face>avc, <Face>bvc);
    }
    if (d) {
      this.faces.push(<Face>avd, <Face>bvd);
    }

    // remove original edge
    this.disconnectEdge(e);
    // remove original faces
    for (let f of e.faces) {
      this.disconnectFace(f);
    }

    // set the crep list of the two created sub edges of e to be orig crep;
    av.crep.push(...e.crep);
    vb.crep.push(...e.crep);

    // push the four edges of F(p) on stack;
    const stack = new Stack<Edge>();
    if (ac) { stack.push(ac); }
    if (ad) { stack.push(ad); }
    if (bc) { stack.push(bc); }
    if (bd) { stack.push(bd); }

    this.flipEdges(stack);

    return v;
  }

  private insertPointInFace(p: V2, f: Face): Vertex {
    // v = new vertex created by inserting p in f
    const v: Vertex = {
      position: p,
      edges: [],
      faces: []
    };
    const a = f.vertices[0];
    const b = f.vertices[1];
    const c = f.vertices[2];
    const ab = <Edge>a.edges.find(edge => edge.vertices.some(vert => vert === b));
    const bc = <Edge>b.edges.find(edge => edge.vertices.some(vert => vert === c));
    const ca = <Edge>c.edges.find(edge => edge.vertices.some(vert => vert === a));

    this.disconnectFace(f);

    const va: Edge = {
      vertices: [v, a],
      faces: [],
      crep: []
    };
    const vb: Edge = {
      vertices: [v, b],
      faces: [],
      crep: []
    };
    const vc: Edge = {
      vertices: [v, c],
      faces: [],
      crep: []
    };
    const vab: Face = {
      vertices: [v, a, b],
      edges: [ab, va, vb],
      debug: 'insertPointInFace'
    };
    const vbc: Face = {
      vertices: [v, b, c],
      edges: [vb, bc, vc],
      debug: 'insertPointInFace'
    };
    const vca: Face = {
      vertices: [v, c, a],
      edges: [vc, ca, va],
      debug: 'insertPointInFace'
    };

    // update verts
    a.edges.push(va);
    b.edges.push(vb);
    c.edges.push(vc);
    v.edges.push(va, vb, vc);
    a.faces.push(vab, vca);
    b.faces.push(vab, vbc);
    c.faces.push(vbc, vca);
    v.faces.push(vab, vbc, vca);

    // update edges
    ab.faces.push(vab);
    bc.faces.push(vbc);
    ca.faces.push(vca);
    va.faces.push(vab, vca);
    vb.faces.push(vab, vbc);
    vc.faces.push(vbc, vca);

    this.vertices.push(v);
    this.edges.push(va, vb, vc);
    this.faces.push(vab, vbc, vca);

    // push the three edges of F(p) on stack;
    const stack = new Stack<Edge>();
    stack.push(ab);
    stack.push(bc);
    stack.push(ca);

    this.flipEdges(stack);

    return v;
  }

  private getIntersections2(a: Vertex, b:Vertex): Intersection[] {
    const unexploredFaces = new Stack<Face>();
    a.faces.forEach(f => unexploredFaces.push(f));
    const intersections: Intersection[] = [];
    const exploredEdges = new Set<Edge>();
    while (!unexploredFaces.isEmpty()) {
      const f = <Face>unexploredFaces.pop();
      for (let e of f.edges) {
        if (exploredEdges.has(e)) { continue; }
        exploredEdges.add(e);

        // note, let's consider a very low epsilon, so that we don't have to reroute
        const intersection = lineToLineIntersection3(a.position, b.position, e.vertices[0].position, e.vertices[1].position, 0.00001);
        if (intersection.type === 'none') { continue; }
        if (intersection.type === 'equal') { return []; }
        if (intersection.type === 'point') {
          const next = e.faces.find(a => a !== f);
          if (next) { unexploredFaces.push(next); }
          intersections.push(<Intersection>{ point: (<PointIntersection>intersection).point, edge: e });
        }
        if (intersection.type === 'colinear') {
          const colinearIntersections = (<ColinearIntersection>intersection).intersections;
          // we know that points a and b can't be on an existing edge,
          // because then insertPointInEdge would have occurred in insertConstraint
          // so let's only consider cases where c or d fall on ab
          const intersectingVerts = colinearIntersections.filter(i => i > 1).map(i => e.vertices[i-2]);
          // make sure the order of intersections is correct
          intersectingVerts.sort((u, v) => V2.dist(a.position, u.position) - V2.dist(a.position, v.position));
          for (let vert of intersectingVerts) {
            const next = vert.faces.filter(a => a !== f);
            if (next.length > 0) { next.forEach(n => unexploredFaces.push(n)); }
            intersections.push(<Intersection>{ vertex: vert});
          }
        }
        if (intersection.type === 'vertex') {
          if ((<VertexIntersection>intersection).vertex === 0 || (<VertexIntersection>intersection).vertex === 1) {
            continue;
          }
          const vert = (<VertexIntersection>intersection).vertex === 2 ? e.vertices[0] : e.vertices[1];
          const next = vert.faces.filter(a => a !== f);
          if (next.length > 0) { next.forEach(n => unexploredFaces.push(n)); }
          intersections.push(<Intersection>{ vertex: vert});
        }
      }
    }
    return intersections;
  }

  private findConnectingEdge(v: Vertex, s: Vertex): Edge | null {
    return v.edges.find(e => e.vertices.some(vert => vert === s)) || null;
  }

  private candidateIntersectsAnEdge(v1: Vertex, v2: Vertex, edges: Edge[]): boolean {
    for (let edge of edges) {
      const intersection = lineToLineIntersection3(v1.position, v2.position, edge.vertices[0].position, edge.vertices[1].position, this.ɛ);
      if (
        intersection.type !== 'none'
      ) {
        return true;
      }
    }
    return false;
  }

  private findIllegalEdges(edges: Edge[]): Edge[] {
    const illegal: Edge[] = [];
    for (let edge of edges) {
      if (!this.edgeIsConstrained(edge) && !this.edgeIsDelaunay(edge)) {
        illegal.push(edge);
      }
    }
    return illegal;
  }

  // TODO improve performance... currently uses this.edges
  private findEdgeCandidate(vertices: Vertex[]): [Vertex, Vertex] | null {
    for (let i = 0; i < vertices.length - 1; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const v1 = vertices[i];
        const v2 = vertices[j];
        if (!this.candidateIntersectsAnEdge(v1, v2, this.edges)/*  && this.candidateIsInsidePolygon2(v1.position, v2.position, outerEdges) */) {
          return [v1, v2];
        }
      }
    }
    return null;
  }

  private findEdgesInVertexArray(vertices: Vertex[]): Edge[] {
    const edges: Edge[] = [];
    for (let vertex of vertices) {
      const edgesInFace = vertex.edges.filter(
        edge => edge.vertices.some(v => v !== vertex && vertices.includes(v))
      ).filter(e => !edges.includes(e));
      edges.push(...edgesInFace);
    }
    return edges;
  }

  private formFace(vertices: Vertex[]) {
    if (vertices.length !== 3) {
      return;
    }
    const edges: Edge[] = this.findEdgesInVertexArray(vertices);
    if (edges.length !== 3) {
      console.error("Expected face to have 3 edges");
    }
    const face: Face = {
      vertices,
      edges,
      debug: 'formFace'
    }
    vertices.forEach(v => v.faces.push(face));
    edges.forEach(e => e.faces.push(face));
    this.faces.push(face);
  }

  private hasFace(vertices: Vertex[]) {
    if (vertices.length !== 3) { throw new Error('Incorrect argument length') }
    return vertices[0].faces.some(f => f.vertices.every(v => vertices.includes(v)));
  }

  private findCommonVertices(edge: Edge, vertices: Vertex[]): Vertex[] {
    const commonVerts: Vertex[] = [];
    const exploredVerts: Vertex[] = [];
    for (let vertex of edge.vertices) {
      for (let edge2 of vertex.edges) {
        if (edge2 === edge) { continue; }
        const v = edge2.vertices.find(v => v !== vertex && vertices.includes(v))
        if (v) {
          if (exploredVerts.includes(v)) {
            commonVerts.push(v);
          }
          exploredVerts.push(v);
        }
      }
    }
    return commonVerts;
  }

  private divideVertexSet(edge: Edge, vertices: Vertex[]): [Vertex[], Vertex[]] {
    const left: Vertex[] = [];
    const right: Vertex[] = [];
    for (let vertex of vertices) {
      if (edge.vertices.includes(vertex)) { continue; }
      if (pointIsOnLeftHalfplane(vertex.position[0], vertex.position[1], edge.vertices[0].position[0], edge.vertices[0].position[1], edge.vertices[1].position[0], edge.vertices[1].position[1])) {
        left.push(vertex);
      } else {
        right.push(vertex);
      }
    }
    return [left, right];
  }

  private findClosestVertexFromSet(edge: Edge, vertices: Vertex[]): Vertex | undefined {
    let best: Vertex | undefined = undefined;
    let bestVal: number = Infinity;
    for (let vertex of vertices) {
      const dist = pointDistToLineSegment(vertex.position, edge.vertices[0].position, edge.vertices[1].position);
      if (dist < bestVal) {
        bestVal = dist;
        best = vertex;
      }
    }
    return best;
  }

  private formFaces3(vertices: Vertex[]) {
    const edges = this.findEdgesInVertexArray(vertices);
    for (let edge of edges) {
      const [left, right] = this.divideVertexSet(edge, vertices);
      const leftCommon = this.findCommonVertices(edge, left);
      const rightCommon = this.findCommonVertices(edge, right);
      const closestLeft = this.findClosestVertexFromSet(edge, leftCommon);
      const closestRight = this.findClosestVertexFromSet(edge, rightCommon);
      if (closestLeft) {
        const faceCandidate = [edge.vertices[0], edge.vertices[1], closestLeft];
        if (!this.hasFace(faceCandidate)) {
          this.formFace(faceCandidate);
        }
      }
      if (closestRight) {
        const faceCandidate = [edge.vertices[0], edge.vertices[1], closestRight];
        if (!this.hasFace(faceCandidate)) {
          this.formFace(faceCandidate);
        }
      }
    }
  }

  private getConnectedEdgesOfVertexWithinSet(vertex: Vertex, vertices: Vertex[], exclude: Edge): Edge[] {
    return vertex.edges.filter(e => e !== exclude && e.vertices.some(v => v !== vertex && vertices.includes(v)));
  }

  private triangulateFace2(vertices: Vertex[]): Edge[] {
    const addedEdges: Edge[] = [];
    let candidate = this.findEdgeCandidate(vertices);
    while (candidate !== null) {
      // add edge v1, v2
      const edge: Edge = {
        vertices: [candidate[0], candidate[1]],
        faces: [],
        crep: [],
        debug: 'triangulateFace'
      }
      this.edges.push(edge);
      candidate[0].edges.push(edge);
      candidate[1].edges.push(edge);
      addedEdges.push(edge);
      candidate = this.findEdgeCandidate(vertices);
    }

    this.formFaces3(vertices);
    return addedEdges;
  }

  private getQuadrilateral(edge: Edge): Edge[] {
    return [
      ...edge.faces[0].edges.filter(e => e !== edge),
      ...edge.faces[1].edges.filter(e => e !== edge),
    ]
  }

  // TODO... mega slow
  private edgeExists(edge: Edge): boolean {
    return this.edges.includes(edge);
  }

  private DTriangulate2(vertices: Vertex[]) {
    if (this.findEdgesInVertexArray(vertices).length < vertices.length) {
      console.error("Polygon should have at least an equal amount of edges to vertices.");
    }
    // get any triangulation
    const innerEdges = this.triangulateFace2(vertices);
    // flip any illegal edges
    const edgesToCheck = new Stack<Edge>();
    innerEdges.forEach(e => edgesToCheck.push(e));
    while (!edgesToCheck.isEmpty()) {
      const edge = <Edge>edgesToCheck.pop();
      if (!this.edgeExists(edge) || this.edgeIsConstrained(edge) || this.edgeIsDelaunay(edge)) { continue; }
      this.flipEdge(edge);
      this.getQuadrilateral(edge).forEach(e => {
        edgesToCheck.push(e);
      });
    }
  }

  private retriangulate(edge: Edge, removed: Edge[]) {
    if (removed.length === 0) { return {}; }
    const vertexSet = new Set<Vertex>();
    removed.forEach(e => e.vertices.forEach(v => vertexSet.add(v)));
    const left: Vertex[] = [edge.vertices[1], edge.vertices[0]];
    const right: Vertex[] = [edge.vertices[1], edge.vertices[0]];
    for (let v of Array.from(vertexSet)) {
      if (pointIsOnLeftHalfplane(v.position[0], v.position[1], edge.vertices[0].position[0], edge.vertices[0].position[1], edge.vertices[1].position[0], edge.vertices[1].position[1])) {
        left.push(v);
      } else {
        right.push(v);
      }
    }
    if (left.length < 3 || right.length < 3) {
      console.error('Attempted to retriangulate non-crossing edges');
    }
    
    this.DTriangulate2(left);
    this.DTriangulate2(right);
  }

  private insertSegment(startVertex: Vertex, endVertex: Vertex, constraintIdx: number) {
    const intersections = this.getIntersections2(startVertex, endVertex);
    const constrained: Intersection[] = [];
    const unconstrained: Intersection[] = [];
    const vertices: Vertex[] = [startVertex];
    const destroyedEdges: Edge[][] = [[]];

    if (intersections.length === 0) {
      const connecting = this.findConnectingEdge(startVertex, endVertex);
      if (connecting === null) {
        console.error('Expected connecting edge to exist.');
      }
    }

    let vertIdx = 0;
    intersections.forEach(intersection => {
      if ((intersection.edge && intersection.edge.crep.length > 0) || intersection.vertex) {
        // intercepts at a constrained edge or a vertex
        constrained.push(intersection);
        destroyedEdges.push([]);
        vertIdx++;
      } else {
        // intercepts at an unconstrained edge
        unconstrained.push(intersection);
        destroyedEdges[vertIdx].push(<Edge>intersection.edge);
      }
    });

    // Step 1: Add vertices on intersecting constrained edges
    // edge list = all constrained edges crossed by segment {v1,v2};
    // for all edges e in edge list
    for (let i of constrained) {
      const v = i.vertex || this.insertPointInEdge(<V2>i.point, <Edge>i.edge);
      vertices.push(v);
    }

    // Step 2: Remove unconstrained intersecting edges
    // edge list = all edges crossed by segment {v1,v2};
    // for all edges e in edge list
    for (let i of unconstrained) {
      // remove edge e from the CDT;
      this.disconnectEdge(<Edge>i.edge);
      (<Edge>i.edge).faces.forEach(face => this.disconnectFace(face));
    }

    // Step 3: Retriangulate
    vertices.push(endVertex);
    // vertex list = all vertices crossed by segment {v1,v2};
    // for all vertices v in vertex list
    for (let i = 0; i < vertices.length - 1; i++) {
      const v = vertices[i];
      // vs = successor vertex of v in vertex list;
      const s = vertices[i + 1];
      // if ( if v and vs are connected by an edge )
      const connectingEdge = this.findConnectingEdge(v, s);
      if (connectingEdge !== null) {
        // e = edge connecting v and vs;
        // add index i to e->crep;
        if (!connectingEdge.crep.includes(constraintIdx)) { connectingEdge.crep.push(constraintIdx); }
      } else {
        if (unconstrained.length === 0) { console.error("Expected edge to already exist since it doesn't intersect with any other edges"); }
        // e = add new edge in the CDT connecting v and vs;
        // add index i to e->crep;
        const e: Edge = {
          vertices: [v, s],
          faces: [],
          crep: [constraintIdx],
          debug: 'insertSegment'
        }
        this.edges.push(e);
        v.edges.push(e);
        s.edges.push(e);
        // retriangulate the two faces adjacent to e;

        this.retriangulate(e, destroyedEdges[i]);
      }
    }
  }

  insertConstraint(C: V2[], constraintIdx: number) {
    const vertices: Vertex[] = [];
    for (let p of C) {
      const lr = this.locatePoint(p);
      let v: Vertex;
      if (lr.vertex !== undefined) {
        v = lr.vertex;
      } else if (lr.edge !== undefined) {
        v = this.insertPointInEdge(p, lr.edge);
      } else if (lr.face !== undefined) {
        v = this.insertPointInFace(p, lr.face);
      } else {
        throw new Error('locatePoint returned nothing.');
      }
      vertices.push(v);
    }
    for (let i = 0; i < vertices.length - 1; i++) {
      const v = vertices[i];
      const succ = vertices[i + 1]; // successor of v
      this.insertSegment(v, succ, constraintIdx);
    }
  };
}
