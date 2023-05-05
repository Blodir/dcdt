import { Tri } from "./dcdt2";

export const DFS = (root: Tri) => {
  const visited: Set<Tri> = new Set();
  const unexplored: Tri[] = [ root ];
  while (unexplored.length > 0) {
    const tri = <Tri>unexplored.pop();
    for (const te of tri) {
      if (te.neighbor && !visited.has(te.neighbor)) {
        unexplored.push(te.neighbor);
      }
    }
    visited.add(tri);
  }
  return Array.from(visited);
};
