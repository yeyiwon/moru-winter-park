// Local coordinates belong to the existing 24 × 22 m lodge and spa terrain cutouts.
export const ryokanGardenTrees=[[-24,113,6.4],[-28,122.8,7.1],[-26,126,6],[-24,137,7.8],[-15,141,8],[-7,143,7],[1,144,8.2],[9,142,7.5],[17,139,7.2],[26,132,7.7],[27,124,6.6],[25,114,6.5],[-11,100,5.2],[10,99,6.2],[-18,104,6.4],[29,106,5.6]];
export const ryokanCanopyPosts=[{x:8.8,z:112.3,r:.25},{x:15.2,z:112.3,r:.25}];
export const ryokanGardenObstacles=[...ryokanCanopyPosts,...ryokanGardenTrees.map(([x,z])=>({x,z,r:.2}))];
