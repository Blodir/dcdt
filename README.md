Sample implementation an algorithm that inserts line-segments into a triangulation by finding the intersecting "channel" of triangles and applying an edge-flipping procedure. The essential flow of the algorithm is as follows:
- Insert the endpoints of `ab`
- Find the channel defined by `ab` (the particular implementation in this repo advances incrementally edge-flipping the intersecting edges behind)
- While the channel is not empty
  - Find a convex vertex on the boundary of the channel
  - Flip intersecting edges until that vertex has only one connected intersecting edge
  - Flipping the last edge always removes the vertex from the channel (as the vertex no longer has any intersecting edges)

https://helda.helsinki.fi/items/1a90aa29-0389-4fb6-9800-e33a5c2deed8

Requires: `node & npm`. Install: `npm i`. Run demo: `npm start` (hosts the visualization at localhost:8080)
