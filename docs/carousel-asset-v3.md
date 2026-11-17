# Winter grand carousel asset

`dist/carousel-model.js` provides a synchronous Three.js model. It introduces no dependency and does not load a remote asset. Horse anatomy is authored as shaped cross-sections, welded into closed equine surfaces in Blender, smoothed, decimated, and saved in `dist/carousel-horse-geometry.js`. The runtime adds the saddle, reins, bridle, stirrups, hoof shoes, carved mane, tail, eyes and nostrils. Eight horses use three leg poses. The roof, columns, parquet and warm bulb trim use cream, navy, champagne gold, silver and restrained burgundy.

## Integration contract

```js
import {buildCarousel} from './carousel-model.js';
const carousel = buildCarousel();
world.add(carousel.root);
carousel.root.position.set(x, groundY, z);
carousel.update(elapsedSeconds, reducedMotion);
```

- Root scale is **1**, units are meters; do not retain the old carousel's 1.6 scale.
- Footprint radius: 7 m; moving horse orbit: 4.6 m; deck surface: 0.5 m.
- `rotor` and everything below it must be excluded from static batching. Painted horse meshes use vertex colors.
- `seats` contains eight physical saddle-surface sockets. Their local forward axis is **+Z**, matching the horse. Use `getWorldQuaternion`, rather than inferring facing from the seat index.
- The seated avatar origin is the socket world position plus **0.82 m in world Y**. Saddle surface Y is 2.42 ± 0.16 m before world placement.
- The roof and offset lift poles leave at least 2.3 m above the saddle center and sampled head footprint clear throughout rotation. Lift poles sit to the side, not through the rider.
- Use a horse-specific straddling pose: feet approximately x ±0.55, y −0.8, z 0.1–0.2 relative to avatar origin, with hands directed toward the reins. Existing chair-riding poses need adaptation in the caller.
- `update(time, true)` freezes the current rotation and bob pose. The rotation speed is 0.10 rad/s; bob amplitude is 0.16 m.

Runtime budget: 48 meshes (including one instanced bulb mesh), 8 materials, 248,496 geometry triangles. This is a detailed landmark; visibility culling belongs to the world renderer.

## Regeneration and export

```sh
node scripts/export-carousel.mjs --source
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/sculpt-carousel-horses.py
node scripts/export-carousel.mjs
MORU_ASSET_OUTPUT=/path/to/output /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/review-carousel.py
node --test tests/carousel-model.test.mjs
```

The second export reads the baked geometry used by the live world. `review-carousel.py` exports a Draco-compressed GLB with the group hierarchy and all eight named saddle sockets, then renders overall and horse-detail JPGs with Blender Cycles. Review stage, cameras and lighting are excluded from the GLB. The GLB is an optional review/reuse artifact; the application uses the local JS geometry and does not require a GLB loader. Animation remains in `update`, rather than GLB animation tracks.

## Validation

Four tests verify finite geometry and render budget, all four legs surviving the Blender bake, saddle position/orbit and 2.3 m head clearance against actual triangles, and consistent horse-facing direction/frozen motion. Blender 5.2.1 LTS completed export and rendered the exact runtime geometry. Offline renders do not substitute for the parent's in-world camera, boarding, mobile and collision checks.
