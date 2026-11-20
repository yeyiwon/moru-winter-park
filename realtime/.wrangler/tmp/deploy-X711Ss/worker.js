var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../server/request-body.js
async function boundedRequest(request, maxBytes = 8192) {
  if (["GET", "HEAD"].includes(request.method) || !request.body) return request;
  if (Number(request.headers.get("content-length") || 0) > maxBytes) throw new RangeError("Request body too large");
  const reader = request.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RangeError("Request body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request.url, { method: request.method, headers: request.headers, body });
}
__name(boundedRequest, "boundedRequest");

// auth.js
var enc = new TextEncoder();
var keys = /* @__PURE__ */ new Map();
var bytes = /* @__PURE__ */ __name((value) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0)), "bytes");
async function key(secret) {
  if (!secret || secret.length < 32) throw Error("Realtime signing key missing");
  if (!keys.has(secret)) {
    if (keys.size > 2) keys.clear();
    keys.set(secret, crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]));
  }
  return keys.get(secret);
}
__name(key, "key");
async function verifyTicket(token, secret, now = Date.now()) {
  try {
    if (typeof token !== "string" || token.length > 4096) return null;
    const [body, signature, extra] = token.split(".");
    if (extra || !await crypto.subtle.verify("HMAC", await key(secret), bytes(signature), enc.encode(body))) return null;
    const payload = JSON.parse(new TextDecoder().decode(bytes(body)));
    return payload.aud === "winter-realtime" && payload.exp > now && payload.exp <= now + 125e3 && /^[a-f0-9]{64}$/.test(payload.id) ? payload : null;
  } catch {
    return null;
  }
}
__name(verifyTicket, "verifyTicket");
async function verifyRPC(body, signature, secret) {
  try {
    return await crypto.subtle.verify("HMAC", await key(secret), bytes(signature), enc.encode(body));
  } catch {
    return false;
  }
}
__name(verifyRPC, "verifyRPC");

// ../dist/region-layout.js
var museumCenter = { x: -77, z: 57 };
var museumGate = { x: -38, z: 25 };
var museumYaw = Math.atan2(museumGate.x - museumCenter.x, museumGate.z - museumCenter.z);
var spaCenter = { x: 94, z: 26 };
var spaGate = { x: 48, z: 7 };
var spaYaw = Math.atan2(spaCenter.x - spaGate.x, spaCenter.z - spaGate.z);
var definitions = {
  park: { id: "park", name: "\uB180\uC774\uACF5\uC6D0", center: { x: 0, z: 0 }, size: { rx: 62, rz: 38 }, depth: 24, phase: 0.2, arrival: { x: 0, z: 24 }, anchors: { ski: { x: 0, z: -28 }, tree: { x: 0, z: 32 }, spa: spaGate, museum: museumGate }, landmarks: { castle: { x: 0, z: -14 }, carousel: { x: 16, z: 3.8 } } },
  ski: { id: "ski", name: "\uC2A4\uD0A4\uC7A5", center: { x: 0, z: -170 }, size: { rx: 144, rz: 144 }, depth: 45, phase: 1.2, arrival: { x: -72, z: 75 }, anchors: { park: { x: 0, z: 117 }, spa: { x: 76, z: 113 } } },
  spa: { id: "spa", name: "\uC628\uCC9C \xB7 \uB8CC\uCE78", center: spaCenter, size: { rx: 37, rz: 32 }, depth: 24, phase: 5.7, yaw: spaYaw, arrival: { x: 0, z: -19 }, anchors: { park: { x: 0, z: -27 }, ski: { x: 24, z: -17 } }, landmarks: { ryokan: { x: 12, z: 7 } } },
  tree: { id: "tree", name: "\uC18C\uC6D0 \uD2B8\uB9AC \uAD11\uC7A5", center: { x: 0, z: 80 }, size: { rx: 32, rz: 29 }, depth: 25, phase: 4.3, arrival: { x: -12, z: -6 }, anchors: { park: { x: 0, z: -24 } }, landmarks: { postOffice: { x: -17, z: -15 } } },
  museum: { id: "museum", name: "\uBCC4\uBE5B \uB9CC\uBB3C\uAD00", center: museumCenter, size: { rx: 34, rz: 31 }, depth: 26, phase: 1.7, yaw: museumYaw, arrival: { x: 0, z: 21.5 }, anchors: { park: { x: 0, z: 28 } }, landmarks: { door: { x: 0, z: 17.4 } } }
};
function resolveRegion(definition) {
  const { center, ...rest } = definition, c = Math.cos(rest.yaw || 0), s = Math.sin(rest.yaw || 0), point2 = /* @__PURE__ */ __name((p3) => ({ ...p3, x: center.x + p3.x * c + p3.z * s, z: center.z - p3.x * s + p3.z * c }), "point");
  return { ...rest, center, arrival: point2(rest.arrival), anchors: Object.fromEntries(Object.entries(rest.anchors).map(([id, p3]) => [id, point2(p3)])), landmarks: Object.fromEntries(Object.entries(rest.landmarks || {}).map(([id, p3]) => [id, point2(p3)])) };
}
__name(resolveRegion, "resolveRegion");
var regions = Object.fromEntries(Object.entries(definitions).map(([id, region]) => [id, resolveRegion(region)]));
var regionConnections = [["park", "ski"], ["park", "tree"], ["park", "spa"], ["ski", "spa"], ["park", "museum"]];
var regionBridges = regionConnections.map(([from, to]) => {
  const start = { ...regions[from].anchors[to] }, end = { ...regions[to].anchors[from] }, length = Math.hypot(end.x - start.x, end.z - start.z), dx = (end.x - start.x) / length, dz = (end.z - start.z) / length;
  return { id: from + "-" + to, from, to, start, end, approachStart: { x: start.x - dx * 6, z: start.z - dz * 6 }, approachEnd: { x: end.x + dx * 6, z: end.z + dz * 6 } };
});
function regionPoint(id, x = 0, z = 0) {
  const r = regions[id], c = Math.cos(r.yaw || 0), s = Math.sin(r.yaw || 0);
  return { x: r.center.x + x * c + z * s, z: r.center.z - x * s + z * c };
}
__name(regionPoint, "regionPoint");
function regionLocalPoint(id, x, z) {
  const r = regions[id], dx = x - r.center.x, dz = z - r.center.z, c = Math.cos(r.yaw || 0), s = Math.sin(r.yaw || 0);
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}
__name(regionLocalPoint, "regionLocalPoint");

// ../dist/spa-transform.js
var spaOriginZ = 119;
var spaYaw2 = regions.spa.yaw || 0;
function spaToWorld(p3) {
  return { ...p3, ...regionPoint("spa", p3.x, p3.z - spaOriginZ), ...p3.yaw !== void 0 ? { yaw: p3.yaw + spaYaw2 } : {} };
}
__name(spaToWorld, "spaToWorld");
function spaToLocal(p3) {
  const local = regionLocalPoint("spa", p3.x, p3.z);
  return { ...p3, x: local.x, z: local.z + spaOriginZ, ...p3.yaw !== void 0 ? { yaw: p3.yaw - spaYaw2 } : {} };
}
__name(spaToLocal, "spaToLocal");

// ../dist/onsen-layout.js
var onsenBasins = [
  { id: "bath", x: -10, z: 124, rx: 7.4, rz: 6.4, access: { x: -10, z: 116.1, y: 0.95 }, entry: { x: -10, z: 119.4, y: 0.28 }, width: 2.6 },
  { id: "smallbath", x: -19, z: 132, rx: 3.7, rz: 3, access: { x: -24, z: 132, y: 0.95 }, entry: { x: -20.8, z: 132, y: 0.28 }, width: 2.2 }
];
var shift = spaToWorld;
var onsenEntrances = Object.fromEntries(onsenBasins.map((b) => [b.id, { ...b, access: shift(b.access), entry: shift(b.entry) }]));
function onsenEntryHeight(b, p3) {
  const dx = b.entry.x - b.access.x, dz = b.entry.z - b.access.z, t = Math.max(0, Math.min(1, ((p3.x - b.access.x) * dx + (p3.z - b.access.z) * dz) / (dx * dx + dz * dz)));
  return b.access.y + (b.entry.y - b.access.y) * t;
}
__name(onsenEntryHeight, "onsenEntryHeight");
function onsenTransitionValid(x, y, z, mode) {
  if (mode !== "bath") return false;
  return Object.values(onsenEntrances).some((b) => {
    const dx = b.entry.x - b.access.x, dz = b.entry.z - b.access.z, l = Math.hypot(dx, dz), along = ((x - b.access.x) * dx + (z - b.access.z) * dz) / l, side = Math.abs((x - b.access.x) * dz - (z - b.access.z) * dx) / l;
    return along >= -0.12 && along <= l + 0.12 && side < b.width / 2 - 0.35 && Math.abs(y - onsenEntryHeight(b, { x, z })) < 0.13;
  });
}
__name(onsenTransitionValid, "onsenTransitionValid");

// ../dist/ryokan-exterior-layout.js
var ryokanGardenTrees = [[-24, 113, 6.4], [-28, 122.8, 7.1], [-26, 126, 6], [-24, 137, 7.8], [-15, 141, 8], [-7, 143, 7], [1, 144, 8.2], [9, 142, 7.5], [17, 139, 7.2], [26, 132, 7.7], [27, 124, 6.6], [25, 114, 6.5], [-11, 100, 5.2], [10, 99, 6.2], [-18, 104, 6.4], [29, 106, 5.6]];
var ryokanCanopyPosts = [{ x: 8.8, z: 112.3, r: 0.25 }, { x: 15.2, z: 112.3, r: 0.25 }];
var ryokanGardenObstacles = [...ryokanCanopyPosts, ...ryokanGardenTrees.map(([x, z]) => ({ x, z, r: 0.2 }))];

// ../dist/mountain-layout.js
var clamp = /* @__PURE__ */ __name((t) => Math.max(0, Math.min(1, t)), "clamp");
var smooth = /* @__PURE__ */ __name((t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
}, "smooth");
var mix = /* @__PURE__ */ __name((a, b, t) => a + (b - a) * t, "mix");
var mountainZ = /* @__PURE__ */ __name((z) => z < -260 ? -260 + (z + 260) * 0.38 : z, "mountainZ");
var mountainX = /* @__PURE__ */ __name((x, z) => x * (1 - 0.54 * smooth((-z - 260) / 500)), "mountainX");
var mountainY = /* @__PURE__ */ __name((y, z) => 0.09 + (y - 0.09) * (1 - 0.5 * smooth((-z - 260) / 500)), "mountainY");
var controlPoints = /* @__PURE__ */ __name((points) => points.map(([z, x]) => [mountainZ(z), mountainX(x, z)]), "controlPoints");
function mountainSpline(z, nodes) {
  let i = 0;
  while (i < nodes.length - 2 && z > nodes[i + 1][0]) i++;
  const a = nodes[i], b = nodes[i + 1], t = clamp((z - a[0]) / (b[0] - a[0])), prev = nodes[Math.max(0, i - 1)], next = nodes[Math.min(nodes.length - 1, i + 2)], m0 = (b[1] - prev[1]) / (b[0] - prev[0]), m1 = (next[1] - a[1]) / (next[0] - a[0]), d = b[0] - a[0];
  return (2 * t ** 3 - 3 * t * t + 1) * a[1] + (t ** 3 - 2 * t * t + t) * m0 * d + (-2 * t ** 3 + 3 * t * t) * b[1] + (t ** 3 - t * t) * m1 * d;
}
__name(mountainSpline, "mountainSpline");
var mountainBounds = { minX: -610, maxX: 610, minZ: mountainZ(-5300), maxZ: -137 };
var mountainForm = { x: 0, z: (mountainZ(-5300) - 137) / 2, rx: 610, rz: (-137 - mountainZ(-5300)) / 2, depth: 120 };
var outline = controlPoints([[-5300, 0], [-5150, 250], [-4900, 1050], [-4500, 1e3], [-3600, 1150], [-2500, 1100], [-1600, 800], [-900, 640], [-440, 390], [-280, 220], [-170, 164], [-145, 82], [-137, 0]]);
function mountainHalfWidth(z) {
  return Math.max(0, mountainSpline(z, outline));
}
__name(mountainHalfWidth, "mountainHalfWidth");
function mountainDistance(x, z) {
  return Math.max(Math.abs(x) - mountainHalfWidth(z), mountainBounds.minZ - z, z - mountainBounds.maxZ);
}
__name(mountainDistance, "mountainDistance");
var mainShape = controlPoints([[-4850, -470], [-4500, -320], [-4080, -380], [-3700, -110], [-3240, 420], [-2840, 540], [-2410, 170], [-2020, -380], [-1620, -440], [-1210, -120], [-820, 170], [-430, 90], [-172, -6]]);
var grades = [[-4900, 1800.09], [-4850, 1800.09], [-4700, 1715.91], [-4400, 1571.91], [-4100, 1409.91], [-3800, 1281.91], [-3500, 1123.909999], [-3200, 967.909999], [-2900, 817.909999], [-2600, 681.910001], [-2300, 571.91], [-2e3, 473.91], [-1600, 361.909999], [-1200, 275.91], [-1e3, 221.91], [-600, 113.91], [-300, 25.909999], [-205, 1.1], [-172, 0.09]].map(([z, y]) => [mountainZ(z), mountainY(y, z)]);
var gradeTangents = grades.map((p3, i) => {
  const a = grades[Math.max(0, i - 1)], b = grades[Math.min(grades.length - 1, i + 1)], left = (p3[1] - a[1]) / (p3[0] - a[0] || 1), right = (b[1] - p3[1]) / (b[0] - p3[0] || 1);
  return i === 0 ? right : i === grades.length - 1 ? left : left * right <= 0 ? 0 : 2 * left * right / (left + right);
});
function authoredRunHeight(z) {
  let i = 0;
  while (i < grades.length - 2 && z > grades[i + 1][0]) i++;
  const a = grades[i], b = grades[i + 1], d = b[0] - a[0], t = clamp((z - a[0]) / d);
  return Math.max(0.09, (2 * t ** 3 - 3 * t * t + 1) * a[1] + (t ** 3 - 2 * t * t + t) * gradeTangents[i] * d + (-2 * t ** 3 + 3 * t * t) * b[1] + (t ** 3 - t * t) * gradeTangents[i + 1] * d);
}
__name(authoredRunHeight, "authoredRunHeight");
var runoutStart = -460;
var runoutEnd = -244;
var runoutHeight = authoredRunHeight(runoutStart);
var runoutGrade = (authoredRunHeight(runoutStart + 0.1) - authoredRunHeight(runoutStart - 0.1)) / 0.2;
var skiArrival = Object.freeze({ startZ: runoutEnd, finishZ: runoutEnd + 44 });
function skiRunHeight(z) {
  if (z <= runoutStart) return authoredRunHeight(z);
  if (z >= runoutEnd) return 0.09;
  const d = runoutEnd - runoutStart, t = (z - runoutStart) / d;
  return (2 * t ** 3 - 3 * t * t + 1) * runoutHeight + (t ** 3 - 2 * t * t + t) * runoutGrade * d + (-2 * t ** 3 + 3 * t * t) * 0.09;
}
__name(skiRunHeight, "skiRunHeight");
var main = mainShape.map(([z, x]) => [z, -6 + (x + 6) * 0.6685110867023468]);
var mainX = /* @__PURE__ */ __name((z) => mountainSpline(z, main), "mainX");
var lines = {
  main,
  easy: controlPoints([[-1200, -75], [-1050, -195], [-900, -230], [-780, -200], [-600, -130], [-410, -80], [-270, -45], [-174, -26]]),
  curve: controlPoints([[-3100, 325], [-2800, 720], [-2400, 700], [-2140, 545], [-1800, 450], [-1430, 340], [-1100, 290], [-780, 230], [-480, 110], [-250, 25], [-174, 25]]),
  advanced: controlPoints([[-3500, 90], [-3160, 40], [-2700, -40], [-2300, 30], [-1900, -110], [-1500, -70], [-1100, 40], [-700, 0], [-172, -6]]),
  explore: controlPoints([[-4050, -245], [-3800, -600], [-3430, -720], [-3e3, -550], [-2680, -180], [-2400, 110]])
};
for (const point2 of lines.easy) point2[1] += 66 * smooth((-point2[0] - 230) / 180);
for (const id of ["easy", "curve", "advanced", "explore"]) lines[id][0][1] = mainX(lines[id][0][0]);
lines.explore.at(-1)[1] = mainX(lines.explore.at(-1)[0]);
lines.advanced.at(-2)[1] = mainX(lines.advanced.at(-2)[0]);
var skiRuns = [
  { id: "main", name: "\uC740\uD558 \uD30C\uB178\uB77C\uB9C8", level: "\uC911\uAE09", color: "#68bcf4", startZ: -4850, finish: -172, width: 32, adjacent: ["advanced", "curve", "easy", "explore"], merges: [] },
  { id: "easy", name: "\uB208\uAF43 \uBA54\uB3C4\uC6B0", level: "\uCD08\uAE09", color: "#69ccaa", startZ: -1200, finish: -174, width: 32, adjacent: ["main"], merges: [{ with: "main", z: -1200 }] },
  { id: "curve", name: "\uC2E4\uBC84 \uD3EC\uB808\uC2A4\uD2B8", level: "\uCD08\uC911\uAE09", color: "#b0a4ef", startZ: -3100, finish: -174, width: 25, adjacent: ["main", "explore"], merges: [{ with: "main", z: -3100 }] },
  { id: "advanced", name: "\uD06C\uB9AC\uC2A4\uD138 \uB9AC\uC9C0", level: "\uC0C1\uAE09", color: "#ee947e", startZ: -3500, finish: -172, width: 17, adjacent: ["main"], merges: [{ with: "main", z: -3500 }, { with: "main", z: -700 }] },
  { id: "explore", name: "\uAD6C\uB984\uC232 \uC5F0\uACB0\uB85C", level: "\uC5F0\uACB0", color: "#e4d297", startZ: -4050, finish: -2400, width: 21, adjacent: ["main", "curve"], merges: [{ with: "main", z: -4050 }, { with: "main", z: -2400 }] }
];
for (const run of skiRuns) {
  run.startZ = mountainZ(run.startZ);
  run.finish = mountainZ(run.finish);
  run.merges = run.merges.map((m) => ({ ...m, z: mountainZ(m.z) }));
}
function skiRunCenter(z, id = "main") {
  const own = mountainSpline(z, lines[id] || main);
  return id === "advanced" ? mix(own, mainX(z), smooth((z - mountainZ(-900)) / (mountainZ(-700) - mountainZ(-900)))) : own;
}
__name(skiRunCenter, "skiRunCenter");
function skiRunHalfWidth(z, id = "main") {
  const run = skiRuns.find((r) => r.id === id) || skiRuns[0];
  return run.width * (0.85 + 0.15 * smooth((z - run.startZ) / 40));
}
__name(skiRunHalfWidth, "skiRunHalfWidth");
for (const run of skiRuns) run.startX = skiRunCenter(run.startZ, run.id);
var skiStarts = skiRuns.map((r) => ({ id: r.id, name: r.name, level: r.level, x: r.startX, z: r.startZ, r: 8 }));
var skiRunouts = [{ x: -25, z: -165, rx: 28, rz: 18 }, { x: 0, z: -165, rx: 28, rz: 18 }, { x: 25, z: -165, rx: 28, rz: 18 }];
var summit = { x: -73, z: mountainZ(-920), height: skiRunHeight(mountainZ(-920)), rx: 68, rz: 45 };
var peakSummit = { x: mainX(mountainZ(-4850)), z: mountainZ(-4880), height: mountainY(1800.09, -4880), rx: 140, rz: 48 };
var middleSummit = { x: mountainX(780, -2420), z: mountainZ(-2420), height: skiRunHeight(mountainZ(-2420) - 17), rx: 90, rz: 55 };
var ridgeBase = { x: middleSummit.x + 54, z: middleSummit.z - 34, height: middleSummit.height, rx: 32, rz: 30 };
var ridgeSummit = { x: peakSummit.x + 82, z: peakSummit.z + 6, height: peakSummit.height, rx: 30, rz: 32 };
var gondolaBase = { x: -126, z: -210, height: 0.09, rx: 40, rz: 42 };
var mountainTerraces = [summit, peakSummit, middleSummit, ridgeBase, ridgeSummit, gondolaBase];
var skiJumps = [[-4490, -11], [-3899, 11], [-3132, -11], [-2737, -11], [-2107, 11], [-1589, 11], [-1041, -11]].map(([authoredZ, offset], i) => {
  const z = mountainZ(authoredZ);
  const yaw = Math.atan2(mainX(z + 1) - mainX(z - 1), 2);
  return { id: "snow-kicker-" + (i + 1), x: mainX(z) + Math.cos(yaw) * offset, z: z - Math.sin(yaw) * offset, yaw, length: 18, width: 10, height: 2.8 };
});
function skiJumpCoordinates(jump, x, z) {
  const dx = x - jump.x, dz = z - jump.z;
  return { along: dx * Math.sin(jump.yaw) + dz * Math.cos(jump.yaw), side: dx * Math.cos(jump.yaw) - dz * Math.sin(jump.yaw) };
}
__name(skiJumpCoordinates, "skiJumpCoordinates");
function skiJumpHeight(x, z) {
  let height = 0;
  for (const jump of skiJumps) {
    if (Math.abs(z - jump.z) > 32 || Math.abs(x - jump.x) > 32) continue;
    const p3 = skiJumpCoordinates(jump, x, z);
    if (p3.along < -jump.length || p3.along > 8 || Math.abs(p3.side) > jump.width / 2) continue;
    const edge = 1 - smooth((Math.abs(p3.side) - jump.width / 2 + 1.5) / 1.5), rise = p3.along <= 0 ? ((p3.along + jump.length) / jump.length) ** 2 : 1 - smooth(p3.along / 8);
    height = Math.max(height, jump.height * rise * edge);
  }
  return height;
}
__name(skiJumpHeight, "skiJumpHeight");
var mountainAprons = [
  { x: summit.x + 2, z: summit.z, rx: 35, rz: 24, height: summit.height },
  { x: middleSummit.x + 42, z: middleSummit.z - 17, rx: 57, rz: 47, height: middleSummit.height, downhillStart: 24 },
  { x: peakSummit.x + 25, z: peakSummit.z, rx: 88, rz: 50, height: peakSummit.height }
];
function mountainGroundHeight(x, z) {
  if (z >= -244) return 0.09;
  const height = skiRunHeight(z), halfWidth = mountainHalfWidth(z);
  let left = -85, right = 85, proximity = 0, pisteDistance = Infinity;
  for (const run of skiRuns) {
    if (z < run.startZ - 75 || z > run.finish + 25) continue;
    const center = skiRunCenter(z, run.id), width = skiRunHalfWidth(z, run.id), along = smooth((z - run.startZ + 75) / 75);
    left = Math.min(left, mix(-85, center - width - 30, along));
    right = Math.max(right, mix(85, center + width + 30, along));
    if (z >= run.startZ && z <= run.finish) pisteDistance = Math.min(pisteDistance, Math.abs(x - center) - width);
    proximity = Math.max(proximity, (1 - smooth((Math.abs(x - center) - width) / 110)) * along);
  }
  const shoulder = x < left ? 1 - smooth((left - x) / Math.max(1, left + halfWidth)) : x > right ? 1 - smooth((x - right) / Math.max(1, halfWidth - right)) : 1;
  const back = smooth((z - mountainBounds.minZ) / 155);
  const relief = (Math.sin(x * 0.012 + z * 6e-3) * 2.8 + Math.sin(z * 0.019 - x * 8e-3) * 1.5) * (1 - proximity) * smooth((height - 8) / 55);
  let y = 0.09 + Math.max(0, height - 0.09 + relief) * shoulder * back;
  for (const apron of mountainAprons) {
    const wx = 1 - smooth((Math.abs(x - apron.x) - apron.rx) / 100), wz = 1 - smooth((Math.abs(z - apron.z) - apron.rz) / 90);
    const downhill = smooth((z - apron.z - (apron.downhillStart ?? 12)) / 55), level = mix(apron.height, height, downhill);
    y = mix(y, level, wx * wz);
  }
  const stationDistance = Math.hypot((x - gondolaBase.x) / gondolaBase.rx, (z - gondolaBase.z) / gondolaBase.rz);
  y = mix(y, gondolaBase.height, 1 - smooth((stationDistance - 0.8) / 0.2));
  y = mix(y, height, proximity);
  const pad = mountainAprons[1], padX = 1 - smooth((Math.abs(x - pad.x) - pad.rx) / 65), padZ = 1 - smooth((Math.abs(z - pad.z) - pad.rz) / 65);
  y = mix(y, mix(pad.height, height, smooth((z - pad.z - 24) / 55)), padX * padZ * smooth(pisteDistance / 28));
  return Math.max(0.09, Math.min(peakSummit.height, y));
}
__name(mountainGroundHeight, "mountainGroundHeight");
var alpineHeight = /* @__PURE__ */ __name((x, z) => mountainGroundHeight(x, z) + skiJumpHeight(x, z), "alpineHeight");
var summitTransfer = [{ x: summit.x - 22, z: summit.z }, { x: summit.x - 22, z: summit.z + 7 }, { x: summit.x, z: summit.z + 7 }, { x: skiRunCenter(mountainZ(-900), "easy"), z: mountainZ(-900) }];
var beginnerAccess = { start: summitTransfer[0], end: summitTransfer.at(-1), halfWidth: 9 };
var liftLayout = { x: -72, z: -188, dx: summit.x - 22 + 72, dz: summit.z + 188, spacing: 4, hanger: 3.1, supports: Array.from({ length: 10 }, (_, i) => i / 9) };
var upperLiftLayout = { x: 72, z: -202, dx: middleSummit.x + 20 - 72, dz: middleSummit.z + 202, spacing: 4, hanger: 3.1, supports: Array.from({ length: 22 }, (_, i) => i / 21) };
var ridgeLiftLayout = { x: ridgeBase.x + 16, z: ridgeBase.z, dx: ridgeSummit.x + 16 - ridgeBase.x - 16, dz: ridgeSummit.z - ridgeBase.z, spacing: 4, hanger: 3.1, supports: Array.from({ length: 9 }, (_, i) => i / 8) };
var ridgeLiftEntry = { x: ridgeBase.x + 16, z: ridgeBase.z + 6 };
var ridgeTransfers = [
  [{ x: middleSummit.x + 20, z: middleSummit.z }, { x: middleSummit.x + 20, z: middleSummit.z + 16 }, { x: ridgeBase.x + 16, z: middleSummit.z + 16 }, { x: ridgeBase.x + 16, z: ridgeBase.z + 6 }],
  [{ x: ridgeSummit.x + 16, z: ridgeSummit.z + 6 }, { x: peakSummit.x + 65, z: peakSummit.z + 28 }, { x: mainX(mountainZ(-4850)), z: mountainZ(-4850) }]
];
var upperLiftEntry = { x: 72, z: -196 };
function cableProfile(line, offsets, seatHeight, clearance) {
  const length = Math.hypot(line.dx, line.dz), nx = -line.dz / length, nz = line.dx / length;
  const ground = /* @__PURE__ */ __name((t) => {
    const x = line.x + line.dx * t, z = line.z + line.dz * t;
    let y = 0.09;
    for (const o of offsets) y = Math.max(y, alpineHeight(x + nx * o, z + nz * o));
    return y;
  }, "ground");
  const count = Math.ceil(length / 70), heights = Array.from({ length: count + 1 }, (_, i) => ground(i / count) + (i === 0 || i === count ? seatHeight : clearance)), top = heights.at(-1);
  const maxStep = length / count * (line === liftLayout ? 0.48 : line === upperLiftLayout ? 0.6 : 0.7);
  const normalize = /* @__PURE__ */ __name(() => {
    for (let i = count - 1; i > 0; i--) heights[i] = Math.max(heights[i], heights[i + 1] - maxStep);
    for (let i = 1; i < count; i++) heights[i] = Math.min(top, Math.max(heights[i - 1], heights[i]));
  }, "normalize");
  const slopes = /* @__PURE__ */ __name(() => heights.map((y, i) => {
    if (i === 0 || i === count) return 0;
    const a = y - heights[i - 1], b = heights[i + 1] - y;
    return a * b <= 0 ? 0 : 2 * a * b / (a + b);
  }), "slopes");
  const sample = /* @__PURE__ */ __name((i, t, m2) => {
    const a = heights[i], b = heights[i + 1];
    return (2 * t ** 3 - 3 * t * t + 1) * a + (t ** 3 - 2 * t * t + t) * m2[i] + (-2 * t ** 3 + 3 * t * t) * b + (t ** 3 - t * t) * m2[i + 1];
  }, "sample");
  normalize();
  for (let pass = 0; pass < 18; pass++) {
    const m2 = slopes();
    let changed = false;
    for (let i = 0; i < count; i++) for (let j = 1; j < 24; j++) {
      const u = j / 24, t = (i + u) / count, minimum = ground(t) + seatHeight, deficit = minimum - sample(i, u, m2);
      if (deficit <= 1e-3) continue;
      if (i > 0) heights[i] = Math.min(top, heights[i] + deficit * (i + 1 === count ? 1.2 / Math.max(1e-3, 1 - smooth(u)) : 1.8));
      if (i + 1 < count) heights[i + 1] = Math.min(top, heights[i + 1] + deficit * (i === 0 ? 1.2 / Math.max(1e-3, smooth(u)) : 1.8));
      changed = true;
    }
    normalize();
    if (!changed) break;
  }
  const m = slopes(), points = [], samples = count * 24;
  for (let n = 0; n <= samples; n++) {
    const t = n / samples, f = t * count, i = Math.min(count - 1, Math.floor(f));
    points.push([line.x + line.dx * t, sample(i, f - i, m), line.z + line.dz * t]);
  }
  return points;
}
__name(cableProfile, "cableProfile");
function cablePoint(points, t) {
  const f = clamp(t) * (points.length - 1), i = Math.min(points.length - 2, Math.floor(f)), u = f - i, a = points[i], b = points[i + 1];
  return a.map((v, k) => mix(v, b[k], u));
}
__name(cablePoint, "cablePoint");
var leftCable = cableProfile(liftLayout, [0, 4], 0.69, 13);
var rightCable = cableProfile(upperLiftLayout, [0, 4], 0.69, 15);
var ridgeCable = cableProfile(ridgeLiftLayout, [0, 4], 0.69, 15);
var liftPoint = /* @__PURE__ */ __name((t) => cablePoint(leftCable, t), "liftPoint");
var upperLiftPoint = /* @__PURE__ */ __name((t) => cablePoint(rightCable, t), "upperLiftPoint");
var ridgeLiftPoint = /* @__PURE__ */ __name((t) => cablePoint(ridgeCable, t), "ridgeLiftPoint");
var gondolaTop = { x: peakSummit.x - 34, z: peakSummit.z };
var gondolaLine = { x: gondolaBase.x, z: gondolaBase.z, dx: gondolaTop.x - gondolaBase.x, dz: gondolaTop.z - gondolaBase.z };
var gondolaPoints = cableProfile(gondolaLine, [-3, 0, 12, 15], 0.07, 19);
var gondolaPoint = /* @__PURE__ */ __name((t) => cablePoint(gondolaPoints, t), "gondolaPoint");
var cableLength = Math.hypot(gondolaLine.dx, gondolaLine.dz);
var spans = Math.ceil(cableLength / 90);
var cableNX = -gondolaLine.dz / cableLength;
var cableNZ = gondolaLine.dx / cableLength;
var gondolaSupports = Array.from({ length: spans + 1 }, (_, i) => gondolaPoint(i / spans)).filter((p3, i) => i === 0 || i === spans || skiRuns.every((r) => p3[2] < r.startZ || p3[2] > r.finish || Math.abs(p3[0] + cableNX * 6 - skiRunCenter(p3[2] + cableNZ * 6, r.id)) - skiRunHalfWidth(p3[2], r.id) > 7));
var gondolaStations = [0, gondolaPoints.length - 1].map((index) => {
  const p3 = gondolaPoints[index], a = gondolaPoints[Math.max(0, index - 1)], b = gondolaPoints[Math.min(gondolaPoints.length - 1, index + 1)], yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  return { x: p3[0], z: p3[2], y: alpineHeight(p3[0], p3[2]), yaw, columns: [-16, -4, 4].flatMap((x) => [-5, 5].map((z) => ({ x: p3[0] + x * Math.cos(yaw) + z * Math.sin(yaw), z: p3[2] + z * Math.cos(yaw) - x * Math.sin(yaw), r: 0.18 }))) };
});
var gondolaEntry = { x: gondolaStations[0].x - Math.sin(gondolaStations[0].yaw) * 12, z: gondolaStations[0].z - Math.cos(gondolaStations[0].yaw) * 12 };
var gondolaApproach = [{ x: -62, z: -150 }, { x: -80, z: -157 }, { x: -80, z: -194 }, gondolaEntry];
var liftApproach = [...gondolaApproach.slice(0, 2), { x: -80, z: -172 }, { x: liftLayout.x, z: -172 }, { x: liftLayout.x, z: -185 }];
var skiNetwork = skiRuns.map((r) => {
  const count = Math.ceil((r.finish - r.startZ) / 3), points = Array.from({ length: count + 1 }, (_, i) => {
    const z = mix(r.startZ, r.finish, i / count);
    return { x: skiRunCenter(z, r.id), y: alpineHeight(skiRunCenter(z, r.id), z), z, width: skiRunHalfWidth(z, r.id) * 2, grade: (skiRunHeight(z - 0.5) - skiRunHeight(z + 0.5)) / Math.hypot(skiRunCenter(z + 0.5, r.id) - skiRunCenter(z - 0.5, r.id), 1) };
  });
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    length += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  return { ...r, points, start: points[0], end: points.at(-1), length, drop: points[0].y - points.at(-1).y };
});
var mountainZones = [{ id: "summit", name: "\uAD6C\uB984 \uC704 \uB2A5\uC120", from: -5300, to: -4e3 }, { id: "upper", name: "\uD06C\uB9AC\uC2A4\uD138 \uC124\uC6D0", from: -4e3, to: -2900 }, { id: "forest", name: "\uC740\uBE5B \uCE68\uC5FD\uC218 \uACC4\uACE1", from: -2900, to: -900 }, { id: "lower", name: "\uB9AC\uC870\uD2B8 \uD558\uC0B0\uB85C", from: -900, to: -205 }, { id: "base", name: "\uD558\uB2E8 \uBCA0\uC774\uC2A4", from: -205, to: -137 }].map((p3) => ({ ...p3, from: mountainZ(p3.from), to: mountainZ(p3.to) }));
var middleTransfer = [{ x: middleSummit.x + 35, z: middleSummit.z }, { x: middleSummit.x + 25, z: middleSummit.z + 10 }, { x: skiRunCenter(mountainZ(-2400), "curve"), z: mountainZ(-2400) }];
var mountainRest = [{ id: "alpine-forest-bench-west", x: middleSummit.x + 6, z: middleSummit.z - 25, yaw: 0 }, { id: "alpine-forest-bench-east", x: middleSummit.x + 30, z: middleSummit.z - 25, yaw: 0 }];
var mountainShelter = { x: middleSummit.x + 24, z: middleSummit.z - 26, width: 40, depth: 14 };
var mountainWayfinders = [
  { id: "gondola-base", x: gondolaEntry.x - 14, z: gondolaEntry.z + 4, lines: ["\uAD6C\uB984\uC815\uC0C1 \uACE4\uB3CC\uB77C \u2196", "\u2190 \uC5B4\uBB35 \xB7 \uBAA8\uB2E5\uBD88"] },
  { id: "left-queue", x: liftLayout.x - 14, z: -182, lines: ["\uB208\uAF43 \uB9AC\uD504\uD2B8 \u2196", "\uCD08\uAE09 \uCF54\uC2A4 \xB7 \uC27C\uD130"] },
  { id: "right-queue", x: upperLiftLayout.x + 10, z: -187, lines: ["\uD3EC\uB808\uC2A4\uD2B8 \uB9AC\uD504\uD2B8 \u2196", "\uC911\uAC04 \uC27C\uD130 \xB7 \uCD08\uC911\uAE09"] },
  { id: "snow-meadow", x: summit.x - 35, z: summit.z + 18, lines: ["\uB208\uAF43 \uBA54\uB3C4\uC6B0 \u2192", "\uCD08\uAE09 \xB7 \uBCA0\uC774\uC2A4"] },
  { id: "forest-rest", x: middleSummit.x + 2, z: middleSummit.z + 18, lines: ["\u2190 \uC2E4\uBC84 \uD3EC\uB808\uC2A4\uD2B8", "\uC27C\uD130 \xB7 \uB2A5\uC120 \uBC29\uD5A5"] },
  { id: "ridge-transfer", x: ridgeBase.x + 42, z: ridgeBase.z + 15, lines: ["\uC815\uC0C1 \uB9AC\uD504\uD2B8 \u2196", "\uAD6C\uB984\uC815\uC0C1 \xB7 \uC911\uAE09"] },
  { id: "ridge-top", x: ridgeSummit.x + 24, z: ridgeSummit.z + 18, lines: ["\u2190 \uC740\uD558 \uD30C\uB178\uB77C\uB9C8", "\uAD6C\uB984\uC815\uC0C1 \xB7 \uBCA0\uC774\uC2A4"] },
  { id: "peak", x: peakSummit.x + 48, z: peakSummit.z + 9, lines: ["\u2190 \uC740\uD558 \uD30C\uB178\uB77C\uB9C8", "\uC911\uAE09 \xB7 \uBCA0\uC774\uC2A4"] }
].map((p3) => ({ ...p3, yaw: 0 }));

// ../dist/resort-blueprint.js
var spaShift = -40;
var alpine = { x: 0, z: -260, r: 144, landZ: -230, rx: 144, rz: 174 };
var spa = { x: 0, z: 119 + spaShift, r: 31 };
var skiTicketBooth = { x: -110, z: -187 };
function columns(line, half, t) {
  const length = Math.hypot(line.dx, line.dz), nx = -line.dz / length, nz = line.dx / length;
  return [-1, 1].flatMap((side) => [-1.65, 1.65].map((d) => ({ x: line.x + line.dx * t + (2 + side * half) * nx - d * nz, z: line.z + line.dz * t + (2 + side * half) * nz + d * nx, r: 0.3 })));
}
__name(columns, "columns");
var summitFacilities = [
  { id: "trail-map", name: "\uC2AC\uB85C\uD504 \uC548\uB0B4", interactive: false, x: 9, z: -153, r: 3.2, model: { x: 9, z: -156 } },
  { id: "odeng", name: "\uC5B4\uBB35 \uD3EC\uC7A5\uB9C8\uCC28", x: -53, z: -163, model: { x: -53, z: -167 }, view: { distance: 9, yaw: 0.25, pitch: 0.3 } },
  { id: "marshmallow", name: "\uB9C8\uC2DC\uBA5C\uB85C \uD2B8\uB7ED", x: -68, z: -160, model: { x: -68, z: -164 }, view: { distance: 9, yaw: 0.25, pitch: 0.3 } },
  { id: "campfire", name: "\uBAA8\uB2E5\uBD88", x: -39, z: -151, r: 2.2, model: { x: -39, z: -154 }, view: { distance: 11, yaw: 0.25, pitch: 0.3 } },
  { id: "gondola", name: "\uAD6C\uB984\uC815\uC0C1 \uACE4\uB3CC\uB77C", ...gondolaEntry, r: 6, model: { x: gondolaStations[0].x, z: gondolaStations[0].z } },
  { id: "ridgelift", name: "\uC815\uC0C1 \uC5F0\uACB0 \uB9AC\uD504\uD2B8", ...ridgeLiftEntry, r: 5.5, model: { x: ridgeLiftLayout.x, z: ridgeLiftLayout.z } },
  { id: "upperlift", name: "\uD3EC\uB808\uC2A4\uD2B8 \uB9AC\uD504\uD2B8 \xB7 \uCD08\uC911\uAE09", ...upperLiftEntry, r: 5.5, model: { x: upperLiftLayout.x, z: upperLiftLayout.z }, view: { distance: 24, yaw: 0.75, pitch: 0.3 } }
];
var summitObstacles = [...mountainWayfinders.map((p3) => ({ x: p3.x, z: p3.z, r: 1.9 })), ...mountainRest.map((p3) => ({ ...p3, w: 2, d: 0.7 })), ...gondolaStations.flatMap((s) => s.columns), ...[-18, 18].flatMap((dx) => [-5, 5].map((dz) => ({ x: mountainShelter.x + dx, z: mountainShelter.z + dz, r: 0.12 }))), ...columns(ridgeLiftLayout, 5.2, 0), ...columns(ridgeLiftLayout, 4.8, 1), ...columns(liftLayout, 5.2, 0), ...columns(liftLayout, 4.8, 1), ...columns(upperLiftLayout, 5.2, 0), ...columns(upperLiftLayout, 4.8, 1), ...summitFacilities.filter((p3) => ["odeng", "marshmallow"].includes(p3.id)).map((p3) => ({ ...p3.model, w: 4.15, d: 1.85 })), { x: -39, z: -154, r: 1.65 }, { x: -42.8, z: -154, w: 0.6, d: 1.6 }, { x: -35.2, z: -154, w: 0.6, d: 1.6 }];
var resortDestinations = [
  { id: "ski", name: "\uCD08\uAE09 \uB9AC\uD504\uD2B8", x: liftLayout.x, z: -185, kind: "ski", view: { distance: 24, yaw: 0.6, pitch: 0.3, lookAhead: -1.8, lookHeight: 0 } },
  { id: "onsen", name: "\uC124\uB9BC \uB178\uCC9C \uC628\uCC9C", x: -10, z: 114 + spaShift, kind: "onsen", view: { distance: 40, yaw: 2.65, pitch: 0.62 } },
  { id: "sauna", name: "\uB8CC\uCE78", x: 12, z: 113.6 + spaShift, kind: "sauna", view: { distance: 32, yaw: 2.65, pitch: 0.55 } }
];
var restSeats = { onsen: { x: -17.8, y: 1.35, z: 124 + spaShift, yaw: Math.PI / 2 }, sauna: { x: 7.5, y: 1.55, z: 125 + spaShift, yaw: Math.PI / 2 }, healing: { x: 50, y: 1, z: 35.5, yaw: Math.PI } };
var spaPavilion = { x: 12, z: 126 + spaShift, w: 24, d: 22, sideDoorZ: 121.5 + spaShift };
var spaActivities = Object.fromEntries(Object.entries({
  bath: { x: -10, y: 0.28, z: 121, yaw: Math.PI, mode: "bath", label: "\uB178\uCC9C\uD0D5 \xB7 WASD\uB85C \uCC9C\uCC9C\uD788 \uC774\uB3D9", pool: { x: -10, z: 124, rx: 5.8, rz: 4.8 }, view: { distance: 12, yaw: 2.7, pitch: 0.32 } },
  smallbath: { x: -19, y: 0.28, z: 132, yaw: Math.PI, mode: "bath", label: "\uC791\uC740 \uC628\uCC9C \xB7 \uBB3C\uC18C\uB9AC \uB4E3\uAE30", pool: { x: -19, z: 132, rx: 2.4, rz: 1.7 }, view: { distance: 10, yaw: 2.7, pitch: 0.35 } },
  footbath: { x: 20.6, y: 1.05, z: 132.5, yaw: -Math.PI / 2, mode: "bath", label: "\uCC3D\uAC00 \uC871\uC695", pool: { x: 20.6, z: 132.5, rx: 1.25, rz: 0.95 }, view: { distance: 6, yaw: 2.25, pitch: 0.3 } },
  lounge: { x: 1.8, y: 1.66, z: 127.5, yaw: Math.PI / 2, mode: "sauna", label: "\uCC3D\uAC00 \uC18C\uD30C", view: { distance: 6, yaw: 1.2, pitch: 0.24 } },
  sauna: { x: 7.5, y: 1.8, z: 125, yaw: Math.PI / 2, mode: "sauna", label: "\uD3B8\uBC31 \uBCA4\uCE58 \xB7 \uD3EC\uADFC\uD558\uAC8C \uBAB8 \uB179\uC774\uAE30", view: { distance: 5, yaw: 1.2, pitch: 0.18, lookHeight: -0.8 } },
  lie: { x: 17, y: 1.98, z: 124.9, yaw: 0, mode: "lie", label: "\uB530\uB73B\uD55C \uB9E4\uD2B8 \xB7 \uB204\uC6CC \uC26C\uB294 \uC911", view: { distance: 6, yaw: 2.7, pitch: 0.18, lookHeight: -0.9 } },
  tea: { x: 15.2, y: 1.28, z: 118.8, yaw: 0, mode: "tea", label: "\uCC3B\uC790\uB9AC \xB7 \uB530\uB73B\uD55C \uCC28 \uD55C \uC794", view: { distance: 5, yaw: 0.35, pitch: 0.2, lookHeight: -0.8 } }
}).map(([id, p3]) => [id, { ...p3, z: p3.z + spaShift, ...p3.pool ? { pool: { ...p3.pool, z: p3.pool.z + spaShift } } : {} }]));
function spaPositionValid(x, y, z, mode) {
  return Object.values(spaActivities).some((a) => {
    if (a.mode !== mode || Math.abs(y - a.y) > 0.12) return false;
    if (a.pool) return ((x - a.pool.x) / a.pool.rx) ** 2 + ((z - a.pool.z) / a.pool.rz) ** 2 <= 1.02;
    return Math.hypot(x - a.x, z - a.z) < 0.15;
  });
}
__name(spaPositionValid, "spaPositionValid");
var topStation = gondolaStations.at(-1);
var gondolaExit = { x: topStation.x - Math.sin(topStation.yaw) * 10, z: topStation.z - Math.cos(topStation.yaw) * 10 };
var ski = skiNetwork[0].points.map((p3) => [p3.x, p3.y, p3.z]);
var lift = Array.from({ length: 321 }, (_, i) => liftPoint(i / 320));
var upperlift = Array.from({ length: 601 }, (_, i) => upperLiftPoint(i / 600));
var resortRides = {
  lift: { bodyOffset: 0.82, heightMode: "seat", points: lift, exit: [summitTransfer[0].x, alpineHeight(summitTransfer[0].x, summitTransfer[0].z), summitTransfer[0].z], duration: 35, arrivalYaw: 0.65 },
  upperlift: { bodyOffset: 0.82, heightMode: "seat", points: upperlift, exit: [middleSummit.x + 20, alpineHeight(middleSummit.x + 20, middleSummit.z), middleSummit.z], duration: 68, arrivalYaw: 0.6 },
  ridgelift: { bodyOffset: 0.82, heightMode: "seat", points: Array.from({ length: 321 }, (_, i) => ridgeLiftPoint(i / 320)), exit: [ridgeTransfers[1][0].x, alpineHeight(ridgeTransfers[1][0].x, ridgeTransfers[1][0].z), ridgeTransfers[1][0].z], duration: 62, arrivalYaw: 0.6 },
  gondola: { smoothHeading: true, bodyOffset: 0.82, heightMode: "seat", points: gondolaPoints, exit: [gondolaExit.x, alpineHeight(gondolaExit.x, gondolaExit.z), gondolaExit.z], baseExit: [gondolaEntry.x, alpineHeight(gondolaEntry.x, gondolaEntry.z), gondolaEntry.z], duration: 95, boardingSeconds: 5, arrivalSeconds: 5, doorSeconds: 0.5, turnSeconds: 6, arrivalYaw: 0 },
  ski: { heightMode: "surface", points: ski, duration: 480 }
};
var resortObstacles = [
  { x: -97, z: -176, w: 9.3, d: 6 },
  { ...skiTicketBooth, w: 1.5, d: 1.4 },
  ...summitObstacles,
  ...[
    ...ryokanGardenObstacles,
    { x: -10, z: 124, rx: 7.4, rz: 6.4 },
    { x: -19, z: 132, rx: 3.7, rz: 3 },
    { x: 12, z: 137, w: 12, d: 0.18 },
    { x: 24, z: 126, w: 0.18, d: 11 },
    { x: 0, z: 117.1, w: 0.18, d: 2.1 },
    { x: 0, z: 130.4, w: 0.18, d: 6.6 },
    { x: 12, z: 115, w: 12, d: 0.18, door: { x: 12, w: 2.2 } },
    { x: 7.5, z: 125, w: 1.1, d: 5 },
    { x: 17, z: 127, w: 1.1, d: 3 },
    { x: 12, z: 130, r: 1.5 },
    { x: 16.5, z: 120, w: 1.7, d: 0.75 },
    { x: 5.2, z: 118.5, w: 1.4, d: 0.3 },
    { x: 20.6, z: 132.5, rx: 2.15, rz: 1.75 },
    { x: 1.8, z: 127.5, w: 0.9, d: 2.4 },
    { x: 2.1, z: 118.8, r: 0.32 },
    { x: 22, z: 118.8, r: 0.32 },
    { x: -16, z: 101, rx: 3.4, rz: 2.5 },
    { x: -22, z: 98, rx: 3.1, rz: 2.4 },
    { x: -27, z: 106, rx: 3.4, rz: 2.1 },
    { x: 23, z: 112, rx: 2.8, rz: 2.1 }
  ].map((p3) => ({ ...p3, z: p3.z + spaShift }))
];
function resortGround(x, z) {
  if (z < -137) return alpineHeight(x, z);
  const localZ = z - spaShift;
  if (x > 0 && x < 24 && localZ > 115 && localZ < 137) return 0.34;
  if (Math.abs(x - 12) < 2.2 && localZ >= 114.2 && localZ <= 115) return 0.09 + 0.25 * (localZ - 114.2) / 0.8;
  if (x >= -0.8 && x <= 0 && Math.abs(z - spaPavilion.sideDoorZ) < 2.3) return 0.09 + 0.25 * (x + 0.8) / 0.8;
  return 0.09;
}
__name(resortGround, "resortGround");
function resortRidePosition(x, y, z, mode) {
  if (!Number.isFinite(x + y + z)) return false;
  if (mode === "lift") return Object.values(resortRides).filter((r) => r.heightMode === "seat").some((r) => r.points.slice(1).some((b, i) => {
    const a = r.points[i], dx = b[0] - a[0], dz = b[2] - a[2], t = ((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz || 1);
    if (t < -1e-6 || t > 1 + 1e-6) return false;
    return Math.hypot(x - a[0] - t * dx, z - a[2] - t * dz) < 2 && Math.abs(y - 0.82 - a[1] - t * (b[1] - a[1])) < (r.boardingSeconds ? 1.2 : 0.2);
  }));
  const airLimit = mode === "ski" && skiRuns.some((r) => z >= r.startZ && z <= r.finish + 12 && Math.abs(x - skiRunCenter(z, r.id)) <= skiRunHalfWidth(z, r.id)) ? skiJumps.some((j) => Math.hypot(x - j.x, z - j.z) < 160) ? 32 : 16 : 3;
  return ["summit", "ski"].includes(mode) && z >= mountainBounds.minZ && z <= mountainBounds.maxZ && x > mountainBounds.minX && x < mountainBounds.maxX && y >= alpineHeight(x, z) - 0.1 && y <= alpineHeight(x, z) + airLimit;
}
__name(resortRidePosition, "resortRidePosition");

// ../dist/resort-layout.js
var alpineShift = regions.ski.center.z - alpine.z;
var spaX = regions.spa.center.x;
var spaShift2 = regions.spa.center.z - 119;
var spaPoint = /* @__PURE__ */ __name((p3) => ({ ...spaToWorld({ ...p3, z: p3.z - spaShift }), yaw: (p3.yaw || 0) + spaYaw2, ...p3.door ? { door: { ...p3.door, offset: p3.door.x - p3.x } } : {}, ...p3.view ? { view: { ...p3.view, yaw: p3.view.yaw + spaYaw2 } } : {} }), "spaPoint");
var point = /* @__PURE__ */ __name((p3) => ({ ...p3, z: p3.z + alpineShift }), "point");
var vector = /* @__PURE__ */ __name((p3) => [p3[0], p3[1], p3[2] + alpineShift], "vector");
var alpine2 = { ...point(alpine), landZ: alpine.z + alpineShift, rz: 144 };
var summit2 = point(summit);
var peakSummit2 = point(peakSummit);
var middleSummit2 = point(middleSummit);
var gondolaEntry2 = point(gondolaEntry);
var upperLiftLayout2 = point(upperLiftLayout);
var liftLayout2 = point(liftLayout);
var upperLiftEntry2 = point(upperLiftEntry);
var ridgeBase2 = point(ridgeBase);
var ridgeSummit2 = point(ridgeSummit);
var ridgeLiftLayout2 = point(ridgeLiftLayout);
var ridgeLiftEntry2 = point(ridgeLiftEntry);
var ridgeTransfers2 = ridgeTransfers.map((path) => path.map(point));
var mountainTerraces2 = mountainTerraces.map(point);
var middleTransfer2 = middleTransfer.map(point);
var mountainRest2 = mountainRest.map(point);
var summitTransfer2 = summitTransfer.map(point);
var skiStarts2 = skiStarts.map(point);
var skiRunouts2 = skiRunouts.map(point);
var skiNetwork2 = skiNetwork.map((r) => ({ ...r, startZ: r.startZ + alpineShift, finish: r.finish + alpineShift, start: point(r.start), end: point(r.end), points: r.points.map(point), merges: r.merges.map((m) => ({ ...m, z: m.z + alpineShift })) }));
var skiArrival2 = { startZ: skiArrival.startZ + alpineShift, finishZ: skiArrival.finishZ + alpineShift };
var skiJumps2 = skiJumps.map(point);
var skiRuns2 = skiRuns.map((p3) => ({ ...p3, startZ: p3.startZ + alpineShift, finish: p3.finish + alpineShift }));
var beginnerAccess2 = { ...beginnerAccess, start: point(beginnerAccess.start), end: point(beginnerAccess.end) };
var summitObstacles2 = summitObstacles.map(point);
var summitFacilities2 = summitFacilities.map((p3) => ({ ...point(p3), ...p3.model ? { model: point(p3.model) } : {} }));
var resortDestinations2 = resortDestinations.map((p3) => p3.id === "ski" ? point(p3) : spaPoint(p3));
var resortRides2 = Object.fromEntries(Object.entries(resortRides).map(([id, p3]) => [id, { ...p3, points: p3.points.map(vector), ...p3.exit ? { exit: vector(p3.exit) } : {}, ...p3.baseExit ? { baseExit: vector(p3.baseExit) } : {} }]));
var gondolaApproach2 = gondolaApproach.map(point);
var liftApproach2 = liftApproach.map(point);
var skiMapDestinations = [
  { ...resortDestinations2.find((p3) => p3.id === "ski"), name: "\uCD08\uAE09 \uB9AC\uD504\uD2B8 \xB7 \uC67C\uCABD", icon: "lift", mapOnly: false },
  { id: "ski-right-base", name: "\uD3EC\uB808\uC2A4\uD2B8 \uB9AC\uD504\uD2B8 \xB7 \uC624\uB978\uCABD", ...upperLiftEntry2, icon: "lift", view: { distance: 27, yaw: 0.65, pitch: 0.32 } },
  { id: "ski-middle", name: "\uC911\uD131 \xB7 \uCD08\uAE09 \uCD9C\uBC1C", x: resortRides2.lift.exit[0], z: resortRides2.lift.exit[2], icon: "ski", view: { distance: 26, yaw: Math.PI, pitch: 0.55 } },
  { id: "ski-forest", name: "\uC911\uAC04 \uC27C\uD130 \xB7 \uD3EC\uB808\uC2A4\uD2B8 \uCD9C\uBC1C", x: resortRides2.upperlift.exit[0], z: resortRides2.upperlift.exit[2], icon: "ski", view: { distance: 26, yaw: Math.PI, pitch: 0.55 } },
  { id: "ski-gondola-base", name: "\uAD6C\uB984\uC815\uC0C1 \uACE4\uB3CC\uB77C", ...gondolaEntry2, icon: "gondola", view: { distance: 27, yaw: 0.65, pitch: 0.32 } },
  { id: "ski-ridge-base", name: "\uC911\uAC04 \uC27C\uD130 \xB7 \uC815\uC0C1 \uB9AC\uD504\uD2B8", ...ridgeLiftEntry2, icon: "lift", view: { distance: 27, yaw: 0.65, pitch: 0.32 } },
  { id: "ski-ridge-top", name: "\uC815\uC0C1 \uB9AC\uD504\uD2B8 \xB7 \uC740\uD558 \uD30C\uB178\uB77C\uB9C8", x: resortRides2.ridgelift.exit[0], z: resortRides2.ridgelift.exit[2], icon: "ski", view: { distance: 26, yaw: Math.PI, pitch: 0.55 } },
  { id: "ski-peak", name: "\uAD6C\uB984\uC815\uC0C1 \xB7 \uC740\uD558 \uD30C\uB178\uB77C\uB9C8", x: resortRides2.gondola.exit[0], z: resortRides2.gondola.exit[2], icon: "summit", view: { distance: 28, yaw: Math.PI, pitch: 0.62 } }
].map((p3) => {
  const stations = { ski: ["lift", 0], "ski-right-base": ["upperlift", 0], "ski-middle": ["lift", -1], "ski-forest": ["upperlift", -1], "ski-gondola-base": ["gondola", 0], "ski-ridge-base": ["ridgelift", 0], "ski-ridge-top": ["ridgelift", -1], "ski-peak": ["gondola", -1] }, [kind, index] = stations[p3.id], station = resortRides2[kind].points.at(index);
  return { mapOnly: true, ...p3, region: "ski", y: alpineHeight(p3.x, p3.z - alpineShift), mapAnchor: { x: station[0], y: alpineHeight(station[0], station[2] - alpineShift), z: station[2] } };
});
var resortObstacles2 = resortObstacles.map((p3) => p3.z < 0 ? point(p3) : spaPoint(p3));
var alpineHeight2 = /* @__PURE__ */ __name((x, z) => alpineHeight(x, z - alpineShift), "alpineHeight");
var resortRidePosition2 = /* @__PURE__ */ __name((x, y, z, mode) => resortRidePosition(x, y, z - alpineShift, mode), "resortRidePosition");
var spa2 = { ...spa, ...regions.spa.center };
var spaPavilion2 = { ...spaPoint(spaPavilion), sideDoor: spaToWorld({ x: 0, z: spaPavilion.sideDoorZ - spaShift }) };
var spaActivities2 = Object.fromEntries(Object.entries(spaActivities).map(([id, p3]) => [id, { ...spaPoint(p3), ...p3.pool ? { pool: spaPoint(p3.pool) } : {} }]));
function spaPositionValid2(x, y, z, mode) {
  const p3 = spaToLocal({ x, z });
  return spaPositionValid(p3.x, y, p3.z + spaShift, mode) || onsenTransitionValid(x, y, z, mode);
}
__name(spaPositionValid2, "spaPositionValid");
var restSeats2 = Object.fromEntries(Object.entries(restSeats).filter(([id]) => id !== "healing").map(([id, p3]) => [id, spaPoint(p3)]));
function resortGround2(x, z) {
  const p3 = spaToLocal({ x, z });
  if (Math.abs(p3.x) < 39 && Math.abs(p3.z - 119) < 34) return resortGround(p3.x, p3.z + spaShift);
  return z < -40 ? alpineHeight2(x, z) : 0.09;
}
__name(resortGround2, "resortGround");

// ../dist/ferris-layout.js
var ferrisDimensions = Object.freeze({
  center: Object.freeze({ x: -42, y: 17, z: -6 }),
  get entrance() {
    return ferrisGroundPoint(0, 9.5);
  },
  scale: 2.35,
  yaw: 0.35,
  radius: 5.7,
  cabinCount: 12,
  seatsPerCabin: 2,
  rotationPeriod: 240,
  cabinWidth: 2.18,
  cabinDepth: 2.18,
  cabinDepthOffset: 1.5,
  floorHeight: -1.3,
  ceilingHeight: 0.12,
  seatSpacing: 1.32,
  seatDepth: 0.66,
  avatarOriginOffset: 0.82
});
function ferrisGroundPoint(x, z) {
  const { center, yaw } = ferrisDimensions;
  return { x: center.x + x * Math.cos(yaw) + z * Math.sin(yaw), z: center.z - x * Math.sin(yaw) + z * Math.cos(yaw) };
}
__name(ferrisGroundPoint, "ferrisGroundPoint");
function ferrisSeatAnchor(index) {
  return { x: 0, y: ferrisDimensions.floorHeight, z: index === 1 ? ferrisDimensions.seatDepth : -ferrisDimensions.seatDepth, yaw: index === 1 ? Math.PI : 0 };
}
__name(ferrisSeatAnchor, "ferrisSeatAnchor");

// ../dist/park-layout.js
var carouselLayout = { x: 16, z: 3.8, scale: 1, r: 7 };
var parkStalls = [{ x: -32, z: 15, yaw: 0, kind: "popcorn" }, { x: -24, z: 15, yaw: 0, kind: "candy" }, { x: -16, z: 15, yaw: 0, kind: "waffle" }];
var stallEntrance = /* @__PURE__ */ __name((kind) => {
  const stall = parkStalls.find((p3) => p3.kind === kind);
  return { x: stall.x + Math.sin(stall.yaw) * 3.5, z: stall.z + Math.cos(stall.yaw) * 3.5 };
}, "stallEntrance");
var parkBenches = [{ x: -5, z: 14, yaw: 0 }, { x: 13, z: 19, yaw: 0 }, { x: 30, z: -5, yaw: -Math.PI / 2 }, { x: -25, z: -8, yaw: 0.5 }];
var parkLamps = [...[-1, 1].flatMap((side) => [28, 9, 2, -11.5].map((z) => ({ x: side * 3.8, z }))), ...[-1, 1].map((side) => ferrisGroundPoint(side * 5.4, 11)), { x: -15, z: 8 }, { x: 30, z: 18 }, { x: 22, z: -12 }, { x: -27, z: 29 }];
var sparklerKiosk = { x: -24, z: -14, yaw: 0.8 };
var sparklerEntrance = { x: sparklerKiosk.x + Math.sin(sparklerKiosk.yaw) * 3.7, z: sparklerKiosk.z + Math.cos(sparklerKiosk.yaw) * 3.7 };
var balloonCart = { x: 8, z: 20, yaw: -0.35 };
var parkFountain = { x: -5, z: 20 };
var parkFlowerbeds = [{ ...parkFountain, rx: 2.1, rz: 1.1, tone: 0 }, { x: -31, z: -10, rx: 2.4, rz: 1.3, tone: 1 }, { x: 28, z: 22, rx: 2.2, rz: 1.2, tone: 2 }];
var parkObstacles = [
  { x: carouselLayout.x, z: carouselLayout.z, r: carouselLayout.r },
  { x: ferrisDimensions.center.x, z: ferrisDimensions.center.z, r: 6 },
  ...parkStalls.map((p3) => ({ x: p3.x, z: p3.z, r: 2.6 })),
  ...parkBenches.map((p3) => ({ x: p3.x, z: p3.z, r: 2.1 })),
  ...parkLamps.map((p3) => ({ x: p3.x, z: p3.z, r: 0.43 })),
  { x: -24, z: -14, r: 2.4 },
  { ...balloonCart, r: 1.35 },
  ...parkFlowerbeds
];
var p = /* @__PURE__ */ __name((point2) => [point2.x, point2.z], "p");
var ferrisForecourt = ferrisGroundPoint(0, 15);
var parkWalkways = [
  { width: 5.5, points: [[0, 26], [0, 13], [0, -7]] },
  { width: 5, points: [[0, 26], [-10, 25], [-27, 25], [-38, 22], [-43, 15], p(ferrisForecourt)] },
  { width: 4.6, points: [p(ferrisForecourt), p(ferrisDimensions.entrance)] },
  { width: 5, points: [p(ferrisForecourt), [-30, 8], [-22, 3], [-12, -3], [0, -7]] },
  { width: 4.4, points: [[-10, 25], [-10, 17], [-10, 9], [-12, -3]] },
  { width: 5, points: [[0, -7], [8, -6], [22, -6], [27, 1], [26, 14], [19, 23], [0, 26]] },
  { width: 4.4, points: [[0, 14], [16, 14], [26, 14]] },
  { width: 3, points: [[16, 14], [16, 12.2]] },
  ...parkStalls.map((stall) => ({ width: 3, points: [[stall.x, 25], p(stallEntrance(stall.kind))] }))
];

// ../dist/festival-layout.js
var candyStall = { x: -50, z: 11 };
var festivalDestinations = [
  { id: "festival-photo", name: "\uACA8\uC6B8 \uD3EC\uD1A0\uC874", x: -49, z: 3, kind: "photo", view: { distance: 13, pitch: 0.18, yaw: -1.4, lookHeight: -0.3 } },
  { id: "candyfloss", name: "\uC19C\uC0AC\uD0D5 \uBD80\uC2A4", x: candyStall.x, z: candyStall.z + 3, kind: "snack", approach: [[ferrisGroundPoint(0, 15).x, ferrisGroundPoint(0, 15).z], [-43, 11], [-46, 14]] }
];
var festivalLamps = [[-54, 1], [-35, -23]].map(([x, z]) => ({ x, z }));
var festivalBenches = [{ x: -53, z: -5 }, { x: -46, z: 21 }];
var festivalObstacles = [
  ...festivalLamps.map((p3) => ({ ...p3, r: 0.43 })),
  ...festivalBenches.map((p3) => ({ ...p3, w: 2.05, d: 0.7 })),
  { ...candyStall, rx: 1.75, rz: 1.1 }
];
function amusementPositionValid(x, y, z, mode) {
  if (!Number.isFinite(x + y + z)) return false;
  if (mode === "carousel") return Math.hypot(x - 16, z - 3.8) < 5 && y > 2.4 && y < 4.4;
  if (mode === "ferris") {
    const dx = x - ferrisDimensions.center.x, dz = z - ferrisDimensions.center.z, lx = (dx * Math.cos(ferrisDimensions.yaw) - dz * Math.sin(ferrisDimensions.yaw)) / ferrisDimensions.scale, lz = (dx * Math.sin(ferrisDimensions.yaw) + dz * Math.cos(ferrisDimensions.yaw)) / ferrisDimensions.scale, ly = (y - ferrisDimensions.avatarOriginOffset - ferrisDimensions.center.y) / ferrisDimensions.scale - ferrisDimensions.floorHeight;
    return Math.abs(Math.hypot(lx, ly) - ferrisDimensions.radius) < 0.5 && Math.abs(lz - ferrisDimensions.cabinDepthOffset) < ferrisDimensions.seatDepth + 0.2;
  }
  return false;
}
__name(amusementPositionValid, "amusementPositionValid");

// ../dist/tree-layout.js
var treeLayout = Object.freeze({ ...regions.tree.center, height: 32, radius: 9.4, arrival: Object.freeze({ ...regions.tree.arrival }) });
var treeShift = regions.tree.center.x - 108;

// ../dist/bench-layout.js
var allTreeBenches = [[19, 0], [19, 0], [21.5, 0.05], [21.5, 0], [19, 0], [24, 0.05], [21, 0.05], [19.5, 0.05]].map(([r, offset], i) => {
  const a = i * Math.PI / 4 + 0.2 + offset;
  return { id: "tree-bench-" + i, x: treeLayout.x + Math.cos(a) * r, z: treeLayout.z + Math.sin(a) * r, yaw: -a - Math.PI / 2 };
});
var treeBenches = allTreeBenches.filter((b) => b.id !== "tree-bench-5");
var benches = [
  ...parkBenches.map((p3, i) => ({ ...p3, id: "park-bench-" + i, region: "outdoors", seatY: 0.64 })),
  ...festivalBenches.map((p3, i) => ({ ...p3, yaw: Math.PI, id: "festival-bench-" + i, region: "outdoors", seatY: 0.64 })),
  ...allTreeBenches.map((p3, i) => ({ ...p3, region: "outdoors", seatY: 0.64 })),
  { id: "ryokan-tea-bench", region: "ryokan", x: 387, z: 10, yaw: Math.PI, seatY: 0.6775, mode: "tea", access: { x: 392, z: 9 } },
  { id: "ryokan-sauna-bench", region: "ryokan", x: 387, z: -13.7, yaw: 0, seatY: 0.74, mode: "sauna" },
  { id: "ryokan-tatami", region: "ryokan", x: 412, z: -6, yaw: Math.PI, seatY: 0.31, offset: 3, mode: "tea", access: { x: 409, z: -4.6 } },
  { id: "museum-bench-west", region: "museum", x: 582, z: 16, yaw: Math.PI, seatY: 0.64 },
  { id: "museum-bench-east", region: "museum", x: 618, z: 16, yaw: Math.PI, seatY: 0.64 },
  { id: "ryokan-tea-side", region: "ryokan", x: 382.8, z: 7, yaw: Math.PI / 2, seatY: 0.6775, mode: "tea", access: { x: 384.5, z: 4.2 } },
  { id: "ryokan-sauna-side", region: "ryokan", x: 382, z: -8.5, yaw: Math.PI / 2, seatY: 0.74, mode: "sauna" },
  { id: "alpine-hearth-west", region: "outdoors", x: -42.8, z: -154 + alpineShift, yaw: Math.PI / 2, seatY: 0.64, access: { x: -44, z: -151.5 + alpineShift } },
  { id: "alpine-hearth-east", region: "outdoors", x: -35.2, z: -154 + alpineShift, yaw: -Math.PI / 2, seatY: 0.64, access: { x: -34, z: -151.5 + alpineShift } },
  ...mountainRest2.map((p3) => ({ ...p3, region: "outdoors", seatY: alpineHeight2(p3.x, p3.z) + 0.55 })),
  { id: "ryokan-tatami-back", region: "ryokan", x: 412, z: -12, yaw: 0, seatY: 0.31, offset: 3, mode: "tea", access: { x: 409, z: -14 } },
  { id: "ryokan-tea-cushions", region: "ryokan", x: 387, z: 4.6, yaw: 0, seatY: 0.31, offset: 1, mode: "tea", access: { x: 387, z: 2.6 } },
  ...[-1, 1].map((side) => ({ id: "ryokan-footbath-" + (side < 0 ? "north" : "south"), region: "ryokan", x: 400, z: -11 + side * 2.1, yaw: side > 0 ? Math.PI : 0, seatY: 0.6, offset: 2.1, mode: "footbath", access: { x: 400, z: -11 + side * 3.7 } }))
].map((b, cabin) => ({ ...b, cabin, mode: b.mode || "rest" })).filter((b) => b.id !== "tree-bench-5" && b.region !== "museum");
function benchSeatPose(cabin, seat = 0) {
  const b = benches.find((b2) => b2.cabin === cabin);
  if (!b || ![0, 1].includes(seat)) return null;
  const offset = (seat === 1 ? 1 : -1) * (b.offset ?? 0.94);
  return { x: b.x + Math.cos(b.yaw) * offset, y: b.seatY + (b.mode === "footbath" ? 0.68 : 0.82), z: b.z - Math.sin(b.yaw) * offset, yaw: b.yaw, mode: b.mode };
}
__name(benchSeatPose, "benchSeatPose");
function benchAccess(b) {
  return b.access ? { ...b.access } : { x: b.x + Math.sin(b.yaw) * 3, z: b.z + Math.cos(b.yaw) * 3 };
}
__name(benchAccess, "benchAccess");
var benchInteractions = benches.map((b) => ({ id: b.id, name: b.mode === "footbath" ? "\uC871\uC695" : b.mode === "tea" ? "\uCC28 \uB9C8\uC2DC\uAE30" : b.mode === "sauna" ? "\uCC1C\uC9C8" : b.id === "ryokan-tatami" ? "\uB2E4\uB2E4\uBBF8" : "\uBCA4\uCE58", kind: "bench", room: b.region === "outdoors" ? null : b.region, cabin: b.cabin, ...benchAccess(b), r: 2.5 }));
function benchPoseValid(reservation, position) {
  if (reservation?.kind !== "bench") return false;
  const pose = benchSeatPose(reservation.cabin, reservation.seat);
  return !!pose && position.mode === pose.mode && Math.hypot(position.x - pose.x, position.z - pose.z) < 0.25 && Math.abs(position.y - pose.y) < 0.25;
}
__name(benchPoseValid, "benchPoseValid");

// ../dist/ryokan-service.js
var diningEntrance = { x: 412, z: 3.7, region: "ryokan" };
var diningSeats = [410, 412, 414].map((x, seat) => Object.freeze({ seat, room: "ryokan", x, y: 1.57, z: 2.1, yaw: Math.PI, seatY: 0.75, mode: "dining" }));
function diningSeatPose(reservation) {
  if (reservation?.kind !== "dining" || reservation.cabin !== 0 || !Number.isInteger(reservation.seat)) return null;
  const seat = diningSeats[reservation.seat];
  return seat ? { ...seat, diningStartedAt: reservation.startedAt } : null;
}
__name(diningSeatPose, "diningSeatPose");
function diningPoseValid(reservation, pose) {
  const seat = diningSeatPose(reservation);
  return !!seat && pose.mode === "dining" && Number.isFinite(pose.x + pose.y + pose.z) && Math.hypot(pose.x - seat.x, pose.z - seat.z) < 0.22 && Math.abs(pose.y - seat.y) < 0.2;
}
__name(diningPoseValid, "diningPoseValid");

// ../dist/winter-rides.js
var clamp2 = /* @__PURE__ */ __name((n, a, b) => Math.max(a, Math.min(b, n)), "clamp");
var angle = /* @__PURE__ */ __name((a) => Math.atan2(Math.sin(a), Math.cos(a)), "angle");
var routeLengths = /* @__PURE__ */ new WeakMap();
function sampleRide(route, progress) {
  let cache2 = routeLengths.get(route);
  if (!cache2) {
    const lengths = [0];
    for (let i2 = 1; i2 < route.points.length; i2++) {
      const a2 = route.points[i2 - 1], b2 = route.points[i2];
      lengths.push(lengths.at(-1) + Math.hypot(b2[0] - a2[0], b2[1] - a2[1], b2[2] - a2[2]));
    }
    cache2 = { lengths, total: lengths.at(-1) };
    routeLengths.set(route, cache2);
  }
  const distance = Math.max(0, Math.min(1, progress)) * cache2.total;
  let lo = 0, hi = cache2.lengths.length - 1;
  while (lo + 1 < hi) {
    const m = lo + hi >> 1;
    if (cache2.lengths[m] <= distance) lo = m;
    else hi = m;
  }
  const i = Math.min(route.points.length - 2, lo), t = (distance - cache2.lengths[i]) / (cache2.lengths[i + 1] - cache2.lengths[i] || 1), a = route.points[i], b = route.points[i + 1];
  let yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  if (route.smoothHeading) {
    const before = route.points[Math.max(0, i - 1)], after = route.points[Math.min(route.points.length - 1, i + 2)], ya = Math.atan2(b[0] - before[0], b[2] - before[2]), yb = Math.atan2(after[0] - a[0], after[2] - a[2]);
    yaw = ya + angle(yb - ya) * t;
  }
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t + (route.bodyOffset ?? (route.heightMode === "seat" ? 0.55 : 0.86)), z: a[2] + (b[2] - a[2]) * t, yaw };
}
__name(sampleRide, "sampleRide");
function sampleCableRide(route, elapsed) {
  if (!route.boardingSeconds) return { ...sampleRide(route, elapsed / route.duration), arrived: elapsed >= route.duration, doors: 0 };
  const door = route.doorSeconds || 2, dwell = route.boardingSeconds, travel = route.duration, ramp = 6, topDwell = route.arrivalSeconds || 12, turn = route.turnSeconds || 9.5, cycle = dwell + travel * 2 + topDwell + turn * 2;
  const t = (elapsed % cycle + cycle) % cycle, topAt = dwell + travel, returnAt = topAt + topDwell + turn;
  const travelProgress = /* @__PURE__ */ __name((t2) => {
    t2 = clamp2(t2, 0, travel);
    return (t2 < ramp ? t2 * t2 / (2 * ramp) : t2 > travel - ramp ? travel - ramp - (travel - t2) ** 2 / (2 * ramp) : t2 - ramp / 2) / (travel - ramp);
  }, "travelProgress");
  const smooth2 = /* @__PURE__ */ __name((t2) => t2 * t2 * (3 - 2 * t2), "smooth");
  let p3, doors = 0, arrived = false, station = "";
  if (t < dwell) {
    p3 = sampleRide(route, 0);
    doors = Math.min(clamp2(t / door, 0, 1), clamp2((dwell - t) / door, 0, 1));
    station = "base";
    arrived = elapsed >= cycle;
  } else if (t < topAt) p3 = sampleRide(route, travelProgress(t - dwell));
  else if (t < topAt + topDwell) {
    p3 = sampleRide(route, 1);
    station = "summit";
    arrived = true;
    doors = Math.min(clamp2((t - topAt) / door, 0, 1), clamp2((topAt + topDwell - t) / door, 0, 1));
  } else if (t < returnAt) {
    p3 = sampleRide(route, 1);
    const a = smooth2((t - topAt - topDwell) / turn) * Math.PI, c = Math.cos(p3.yaw), s = Math.sin(p3.yaw);
    p3.x += -c * 6 * (1 - Math.cos(a)) + s * 6 * Math.sin(a);
    p3.z += s * 6 * (1 - Math.cos(a)) + c * 6 * Math.sin(a);
    p3.yaw += a;
  } else if (t < returnAt + travel) {
    p3 = sampleRide(route, 1 - travelProgress(t - returnAt));
    p3.x -= Math.cos(p3.yaw) * 12;
    p3.z += Math.sin(p3.yaw) * 12;
    p3.yaw += Math.PI;
  } else {
    p3 = sampleRide(route, 0);
    const a = smooth2((t - returnAt - travel) / turn) * Math.PI, c = Math.cos(p3.yaw), s = Math.sin(p3.yaw);
    p3.x -= c * 6 * (1 + Math.cos(a)) + s * 6 * Math.sin(a);
    p3.z += s * 6 * (1 + Math.cos(a)) - c * 6 * Math.sin(a);
    p3.yaw += Math.PI + a;
  }
  return { ...p3, arrived: arrived && doors >= 0.99, doors, station, cycle, dwellRemaining: station === "base" ? dwell - t : station === "summit" ? topAt + topDwell - t : 0 };
}
__name(sampleCableRide, "sampleCableRide");

// ../dist/ride-seats.js
var sharedRideKinds = ["ferris", "lift", "upperlift", "ridgelift", "gondola", "bench", "dining"];
function sharedSeatChoices(kind, benchId) {
  if (kind === "dining") return diningSeats.map((p3) => ({ ...p3, kind, cabin: 0, placeId: "interior-dining", region: "ryokan", benchId: void 0, access: diningEntrance }));
  const b = kind === "bench" && benches.find((b2) => b2.id === benchId);
  return b ? [0, 1].map((seat) => ({ kind, cabin: b.cabin, seat, benchId: b.id, placeId: b.id, region: b.region, ...benchSeatPose(b.cabin, seat), seatY: b.seatY, access: benchAccess(b) })) : [];
}
__name(sharedSeatChoices, "sharedSeatChoices");
var selectableSeats = [...sharedSeatChoices("dining"), ...benches.flatMap((b) => sharedSeatChoices("bench", b.id))];
function sharedSeatPose(reservation, now) {
  if (!reservation || !sharedRideKinds.includes(reservation.kind)) return null;
  if (reservation.kind === "bench") return benchSeatPose(reservation.cabin, reservation.seat);
  if (reservation.kind === "dining") return diningSeatPose(reservation);
  const side = reservation.seat === 1 ? 1 : -1;
  if (reservation.kind === "ferris") {
    const { yaw, scale, center, radius, cabinCount, rotationPeriod, cabinDepthOffset, avatarOriginOffset } = ferrisDimensions, anchor2 = ferrisSeatAnchor(reservation.seat), a = reservation.cabin * Math.PI * 2 / cabinCount + now / 1e3 % rotationPeriod / rotationPeriod * Math.PI * 2, x = Math.cos(a) * radius + anchor2.x, z = cabinDepthOffset + anchor2.z;
    const angle2 = yaw + anchor2.yaw;
    return { x: center.x + (x * Math.cos(yaw) + z * Math.sin(yaw)) * scale, y: center.y + (Math.sin(a) * radius + anchor2.y) * scale + avatarOriginOffset, z: center.z + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * scale, yaw: Math.atan2(Math.sin(angle2), Math.cos(angle2)), mode: "ferris" };
  }
  const route = resortRides2[reservation.kind], elapsed = Math.max(0, (now - rideClockStart(reservation)) / 1e3), p3 = sampleCableRide(route, elapsed), offset = side * 0.95;
  if (reservation.kind === "gondola") {
    const seat = gondolaSeat(reservation.seat), c = Math.cos(p3.yaw), s = Math.sin(p3.yaw), at = reservation.startedAt - rideClockStart(reservation);
    const exiting = at >= (route.boardingSeconds + route.duration) * 1e3, progress = Math.max(0, Math.min(1, (now - reservation.startedAt) / gondolaTransitionMs));
    const point2 = /* @__PURE__ */ __name((x, z) => ({ x: p3.x + c * x + s * z, y: p3.y, z: p3.z - s * x + c * z }), "point");
    let pose = { ...point2(seat.x, seat.z), yaw: p3.yaw + seat.yaw }, transition = "";
    if (at > 0 && (exiting || progress < 1)) {
      transition = exiting ? "exiting" : "boarding";
      const exit = p3.station === "base" ? route.baseExit : route.exit, entry = exiting ? { x: exit[0], y: exit[1] + 0.86, z: exit[2] } : { x: route.baseExit[0], y: route.baseExit[1] + 0.86, z: route.baseExit[2] };
      const door = point2(0, -3.2), aisle = point2(0, seat.z), chair = point2(seat.x, seat.z), path = exiting ? [chair, aisle, door, entry] : [entry, door, aisle, chair];
      const lengths = [0];
      for (let i2 = 1; i2 < path.length; i2++) lengths.push(lengths.at(-1) + Math.hypot(path[i2].x - path[i2 - 1].x, path[i2].y - path[i2 - 1].y, path[i2].z - path[i2 - 1].z));
      const distance = progress * progress * (3 - 2 * progress) * lengths.at(-1);
      let i = 0;
      while (i < 2 && distance > lengths[i + 1]) i++;
      const a = path[i], b = path[i + 1], t = (distance - lengths[i]) / (lengths[i + 1] - lengths[i] || 1);
      pose = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
      if (!exiting && progress > 0.82) {
        const d = Math.atan2(Math.sin(p3.yaw + seat.yaw - pose.yaw), Math.cos(p3.yaw + seat.yaw - pose.yaw));
        pose.yaw += d * (progress - 0.82) / 0.18;
      }
    }
    return { ...p3, ...pose, mode: "lift", elapsed, finished: false, transition, walking: !!transition && progress < 1, transitionDone: exiting && progress >= 1, center: { x: p3.x, y: p3.y - 0.82, z: p3.z, yaw: p3.yaw } };
  }
  return { ...p3, x: p3.x + Math.cos(p3.yaw) * offset, z: p3.z - Math.sin(p3.yaw) * offset, mode: "lift", elapsed, finished: elapsed >= route.duration };
}
__name(sharedSeatPose, "sharedSeatPose");
function gondolaSeat(index) {
  const side = index < 3 ? -1 : 1;
  return { x: side * 1.4, z: (index % 3 - 1) * 1.9, yaw: -side * Math.PI / 2 };
}
__name(gondolaSeat, "gondolaSeat");
var gondolaTransitionMs = 1e3;
var rideClockStart = /* @__PURE__ */ __name((r) => r.kind === "gondola" ? r.cabin ?? r.startedAt : r.startedAt, "rideClockStart");
var gondolaCycleMs = sampleCableRide(resortRides2.gondola, 0).cycle * 1e3;
var gondolaSchedule = Object.freeze({ count: 26, cycle: gondolaCycleMs, interval: gondolaCycleMs / 26, boarding: (resortRides2.gondola.boardingSeconds - resortRides2.gondola.doorSeconds - 0.5) * 1e3 });

// ../dist/district-layout.js
var museumLayout = { ...regions.museum.center, rx: 16.5, rz: 16.5, height: 19.3, door: regions.museum.landmarks.door, arrival: regions.museum.arrival, yaw: regions.museum.yaw };
var interiorDoors = { ryokan: { id: "sauna", ...spaToWorld({ x: 12, z: 113.6, yaw: 0 }) }, museum: { id: "quiz", ...museumLayout.door, yaw: museumLayout.yaw } };
var districtObstacles = [{ x: museumLayout.x, z: museumLayout.z, rx: museumLayout.rx, rz: museumLayout.rz }];

// ../dist/castle-layout.js
var castleLayout = Object.freeze({
  x: 0,
  z: -14,
  width: 34.6,
  height: 45.5,
  passage: Object.freeze({ x: 0, z: -18, halfWidth: 4.25, height: 7.2, frontZ: -8, backZ: -27 }),
  plaza: Object.freeze({ x: 0, z: -3, rx: 19, rz: 12 })
});
var castleTowers = Object.freeze([
  { x: 0, z: -5, r: 2.55, base: 22, height: 14, roof: 7.9, central: true },
  { x: -7.2, z: -6.5, r: 1.65, base: 0, height: 25, roof: 6.3 },
  { x: 7.2, z: -6.5, r: 1.65, base: 0, height: 25, roof: 6.3 },
  { x: -14, z: -2.5, r: 2.15, base: 0, height: 16.5, roof: 6.6 },
  { x: 14, z: -2.5, r: 2.15, base: 0, height: 16.5, roof: 6.6 },
  { x: -10.2, z: -8, r: 1.15, base: 12.6, height: 6.8, roof: 4.8 },
  { x: 10.2, z: -8, r: 1.15, base: 12.6, height: 6.8, roof: 4.8 },
  { x: -3.2, z: -4, r: 0.88, base: 22.8, height: 6.1, roof: 4.2 },
  { x: 3.2, z: -4, r: 0.88, base: 22.8, height: 6.1, roof: 4.2 }
]);
var castleObstacles = [-1, 1].flatMap((side) => [
  { x: side * 8.05, z: -18.2, w: 3.55, d: 5.6 },
  { x: side * 14, z: -16.5, r: 2.38 },
  { x: side * 7.2, z: -20.5, r: 1.85 }
]);
var castleView = Object.freeze({ distance: 42, yaw: 0.33, pitch: 0.04, lookHeight: 10, fov: 56 });

// ../dist/ryokan-aquarium-layout.js
var aquariumLayout = Object.freeze({ x: 0, y: 4.95, z: -20.6, width: 38.6, height: 8.8, depth: 8.4, frontZ: -16.4 });
var aquariumBounds = Object.freeze({ x: 18.7, y: 4.02, z: 3.8 });
var aquariumRocks = Object.freeze([
  { x: -14, y: -2.7, z: 1.5, sx: 3.5, sy: 1.4, sz: 1.7 },
  { x: -17, y: -1.7, z: 2.2, sx: 2.1, sy: 2.4, sz: 1.4 },
  { x: -10, y: -3.2, z: 2.5, sx: 2.8, sy: 0.95, sz: 1.2 },
  { x: 9.1, y: -2.4, z: 1.1, sx: 1.35, sy: 1.8, sz: 1.6 },
  { x: 14.5, y: -2.5, z: 1.6, sx: 1.6, sy: 1.7, sz: 1.5 },
  { x: 11.9, y: -0.65, z: 1.4, sx: 3.5, sy: 0.85, sz: 1.7 },
  { x: 16.8, y: -3, z: 2.9, sx: 2.2, sy: 1.2, sz: 0.8 },
  { x: -3, y: -3.4, z: 3.1, sx: 2.7, sy: 0.8, sz: 0.6 }
]);

// ../dist/observatory-layout.js
var observatoryLayout = Object.freeze({
  radius: 22,
  domeBase: 6,
  telescope: { x: 0, z: 0, r: 3.6 },
  console: { x: 0, z: 6.4, rx: 1.55, rz: 0.65 },
  quiz: { x: 0, z: 8.1, r: 2 },
  guide: { x: -19.8, z: 3.8, r: 0.85 },
  piers: Array.from({ length: 16 }, (_, index) => {
    const angle2 = index / 16 * Math.PI * 2;
    return { index, angle: angle2, x: Math.sin(angle2) * 21, z: Math.cos(angle2) * 21, r: 0.55 };
  }).filter((p3) => p3.index !== 12),
  site: { latitude: 37.5665, longitude: 126.978 }
});

// ../dist/interior-layout.js
var floor = 0.09;
var interiorRooms = {
  museum: { id: "museum", name: "\uBCC4\uBE5B \uB9CC\uBB3C\uAD00", x: 600, z: 0, rx: 24, rz: 22, floor, ceiling: 28, shape: "rectangle", entry: { x: 590, z: 0 }, exit: { x: 577, z: 0 }, arrivalYaw: Math.PI / 2, ambient: "#b7d8e9" },
  ryokan: { id: "ryokan", name: "\uB8CC\uCE78", x: 400, z: 0, rx: 21, rz: 17, floor, ceiling: 11.5, shape: "rectangle", entry: { x: 400, z: 5.3 }, exit: { x: 400, z: 15.2 }, arrivalYaw: Math.PI, ambient: "#e9c79e" }
};
var ryokanFixtures = [
  { id: "aquarium", x: aquariumLayout.x, z: aquariumLayout.z, rx: aquariumLayout.width / 2 + 0.45, rz: aquariumLayout.depth / 2 + 0.12 },
  { id: "reception", x: 13, z: 10, rx: 4, rz: 1.1 },
  { id: "tea-table", x: -13, z: 7, rx: 2.25, rz: 1.1 },
  { id: "tea-bench-back", x: -13, z: 10, rx: 3.5, rz: 0.65 },
  { id: "tea-bench-side", x: -17.2, z: 7, rx: 0.65, rz: 2.6 },
  { id: "tatami-table", x: 12, z: -9, rx: 2.6, rz: 1.1 },
  { id: "tatami-cabinet", x: 17.8, z: -13.5, rx: 2.1, rz: 0.75 },
  { id: "sauna-bench-back", x: -13, z: -13.7, rx: 5, rz: 1 },
  { id: "sauna-bench-side", x: -18, z: -8.5, rx: 1, rz: 4.2 },
  { id: "sauna-stove", x: -8.6, z: -11, rx: 1.05, rz: 1.05 },
  { id: "footbath", x: 0, z: -11, rx: 4.6, rz: 2.35 },
  { id: "omakase-counter", x: 12, z: 0, rx: 4, rz: 0.9 },
  { id: "chef-preparation", x: 12, z: -2.3, rx: 4, rz: 1.4 },
  ...[10, 12, 14].map((x) => ({ id: "dining-seat-" + x, x, z: 2.1, r: 0.55 })),
  { id: "locker", x: 17.7, z: 4.8, rx: 2, rz: 0.7 },
  ...[[-18.5, 13], [-18.5, -1.5], [18.5, 14], [18, 0], [5, -14.7]].map(([x, z], i) => ({ id: "planter-" + i, x, z, r: 0.65 })),
  // Wide doors in the sauna's south wall and east screen connect it to the hall.
  { id: "sauna-wall-south-left", x: -18, z: -1.4, rx: 2.8, rz: 0.14 },
  { id: "sauna-wall-south-right", x: -6.8, z: -1.4, rx: 2.5, rz: 0.14 },
  { id: "sauna-wall-east-rear", x: -4.5, z: -11.8, rx: 0.14, rz: 4.6 },
  { id: "sauna-wall-east-front", x: -4.5, z: -2.5, rx: 0.14, rz: 1.2 },
  { id: "tatami-screen", x: 6, z: -1.4, rx: 0.14, rz: 3.8 }
];
var interiorInteractions = [
  { id: "exit-museum", name: "\uBC16\uC73C\uB85C", room: "museum", kind: "exit", x: 577, z: 0 },
  { id: "observatory-quiz", name: "\uD034\uC988 \uD480\uAE30", room: "museum", kind: "quiz-station", x: 600 + observatoryLayout.quiz.x, z: observatoryLayout.quiz.z, r: observatoryLayout.quiz.r },
  { id: "exit-ryokan", name: "\uBC16\uC73C\uB85C", room: "ryokan", kind: "exit", x: 400, z: 15.2 },
  { id: "interior-tea", name: "\uCC28", room: "ryokan", kind: "tea", x: 387, z: 8.7 },
  { id: "interior-sauna", name: "\uCC1C\uC9C8", room: "ryokan", kind: "sauna", x: 387, z: -11.7 },
  { id: "interior-rest", name: "\uB2E4\uB2E4\uBBF8", room: "ryokan", kind: "rest", x: 410, z: -5 },
  { id: "interior-dining", name: "\uC624\uB9C8\uCE74\uC138", room: "ryokan", kind: "dining", x: 412, z: 3.7 }
];
var interiorActivityPoses = {
  "interior-tea": { room: "ryokan", x: 387, y: 1.4975, z: 10, yaw: Math.PI, seatY: 0.6775 },
  "interior-sauna": { room: "ryokan", x: 386.06, y: 1.56, z: -13.7, yaw: 0, seatY: 0.74 },
  "interior-rest": { room: "ryokan", x: 409, y: 1.13, z: -6, yaw: Math.PI, seatY: 0.31 },
  "interior-dining": { room: "ryokan", x: 412, y: 1.57, z: 2.1, yaw: Math.PI, seatY: 0.75 }
};
function interiorActivityPoseValid(x, y, z) {
  return Number.isFinite(x + y + z) && [...Object.values(interiorActivityPoses), ...diningSeats].some((p3) => Math.hypot(x - p3.x, z - p3.z) < 0.22 && Math.abs(y - p3.y) < 0.2);
}
__name(interiorActivityPoseValid, "interiorActivityPoseValid");
function interiorAt(x, z) {
  if (!Number.isFinite(x + z)) return null;
  return Object.values(interiorRooms).find((r) => Math.abs(x - r.x) <= r.rx + 0.6 && Math.abs(z - r.z) <= r.rz + 0.6) || null;
}
__name(interiorAt, "interiorAt");
var museumFixtures = [observatoryLayout.telescope, observatoryLayout.console, observatoryLayout.guide, ...observatoryLayout.piers];
function interiorSurfaceHeight(x, z) {
  return interiorAt(x, z) ? floor : null;
}
__name(interiorSurfaceHeight, "interiorSurfaceHeight");
function interiorCanStandAt(x, z, radius = 0.35) {
  const room = interiorAt(x, z);
  if (!room || !Number.isFinite(radius) || radius < 0) return false;
  const dx = x - room.x, dz = z - room.z;
  if (room.shape === "ellipse") {
    if ((dx / (room.rx - radius - 0.25)) ** 2 + (dz / (room.rz - radius - 0.25)) ** 2 > 1) return false;
  } else if (Math.abs(dx) > room.rx - radius - 0.25 || Math.abs(dz) > room.rz - radius - 0.25) return false;
  const obstacles2 = room.id === "museum" ? museumFixtures : ryokanFixtures;
  return !obstacles2.some((o) => o.r ? Math.hypot(dx - o.x, dz - o.z) < o.r + radius : Math.abs(dx - o.x) < o.rx + radius && Math.abs(dz - o.z) < o.rz + radius);
}
__name(interiorCanStandAt, "interiorCanStandAt");
function interiorPositionValid(x, y, z) {
  if (!Number.isFinite(x + y + z)) return false;
  if (interiorActivityPoseValid(x, y, z)) return true;
  if (!interiorCanStandAt(x, z, 0.1)) return false;
  const ground = interiorSurfaceHeight(x, z);
  return y >= ground - 0.15 && y <= ground + 3.9;
}
__name(interiorPositionValid, "interiorPositionValid");

// ../dist/world-layout.js
var terrainIds = { park: "park", ski: "alpine", spa: "spa", tree: "wish", museum: "philosophy" };
var islands = Object.values(regions).map((r) => ({ id: terrainIds[r.id], name: r.name, ...r.center, r: Math.min(r.size.rx, r.size.rz), spawn: r.arrival, color: r.id === "spa" ? "#b5cdc0" : "#bdd9e7", ...r.id === "park" ? { view: castleView } : r.id === "tree" ? { view: { distance: 40, yaw: Math.PI, pitch: 0.15, lookHeight: 12 } } : {} }));
for (const id of ["science", "law", "art", "history"]) islands.push({ id, hidden: true, x: 0, z: 0, r: 1, spawn: regions.park.arrival });
var promenadeTrees = [{ x: 17, z: 28, h: 4.1, r: 0.35 }, { x: treeLayout.x + 15, z: treeLayout.z + 12, h: 4.6, r: 0.35 }, { x: treeLayout.x + 16, z: treeLayout.z - 12, h: 4.4, r: 0.35 }];
var bridgeHalfWidth = 3.6;
var bridges = regionBridges.map((b) => [{ ...b.start, r: 1 }, { ...b.end, r: 1 }]);
function bridgeHeight(x, z) {
  for (const [a, b] of bridges) {
    const length = Math.hypot(b.x - a.x, b.z - a.z), d = ((x - a.x) * (b.x - a.x) + (z - a.z) * (b.z - a.z)) / length;
    if (d >= 0 && d <= length && segmentDistance(x, z, a, b) < bridgeHalfWidth + 0.4) return 0.09 + Math.sin(d / length * Math.PI) * Math.min(0.7, length * 0.025);
  }
  return 0.09;
}
__name(bridgeHeight, "bridgeHeight");
function segmentDistance(x, z, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
}
__name(segmentDistance, "segmentDistance");
var landforms = Object.values(regions).map((r) => ({ id: terrainIds[r.id], ...r.center, ...r.size, depth: r.depth, phase: r.phase, yaw: r.yaw || 0, ...r.id === "ski" ? { ...mountainForm, z: mountainForm.z + alpineShift } : {} }));
function landRadius(form2, angle2) {
  if (form2.id === "alpine") {
    let lo = 0, hi = 2;
    for (let i = 0; i < 23; i++) {
      const r = (lo + hi) / 2;
      if (mountainDistance(form2.x + Math.cos(angle2) * form2.rx * r, form2.z - alpineShift + Math.sin(angle2) * form2.rz * r) < 0) lo = r;
      else hi = r;
    }
    return (lo + hi) / 2;
  }
  return 1 + 0.018 * Math.sin(angle2 * 5 + form2.phase) + 0.012 * Math.sin(angle2 * 9 - form2.phase);
}
__name(landRadius, "landRadius");
function landDistance(x, z, form2) {
  if (form2.id === "alpine") return mountainDistance(x, z - alpineShift);
  const c = Math.cos(form2.yaw || 0), s = Math.sin(form2.yaw || 0), x0 = x - form2.x, z0 = z - form2.z, dx = (x0 * c - z0 * s) / form2.rx, dz = (x0 * s + z0 * c) / form2.rz;
  return (Math.hypot(dx, dz) - landRadius(form2, Math.atan2(dz, dx))) * Math.min(form2.rx, form2.rz);
}
__name(landDistance, "landDistance");
var snowfields = landforms.map((f) => ({ a: { x: f.x, z: f.z }, b: { x: f.x, z: f.z }, r: f.rz }));
function snowfieldDistance(x, z) {
  return Math.min(...landforms.map((f) => landDistance(x, z, f)), ...bridges.map(([a, b]) => segmentDistance(x, z, a, b) - bridgeHalfWidth));
}
__name(snowfieldDistance, "snowfieldDistance");
function terrainAt(x, z) {
  return Number.isFinite(x + z) && (!!interiorAt(x, z) || snowfieldDistance(x, z) < -0.35);
}
__name(terrainAt, "terrainAt");
function surfaceHeight(x, z) {
  const interior = interiorSurfaceHeight(x, z);
  return interior !== null ? interior : Math.max(bridgeHeight(x, z), resortGround2(x, z));
}
__name(surfaceHeight, "surfaceHeight");

// ../dist/park-guide-layout.js
var parkGuideLayout = Object.freeze({
  plaza: Object.freeze({ x: -6.5, z: 3, r: 1.02, yaw: 0.2, message: "\uC5EC\uAE30\uC11C \uBD88\uAF43\uB180\uC774\uB97C \uC2E0\uCCAD\uD560 \uC218 \uC788\uC5B4\uC694. \uD568\uAED8 \uBC24\uD558\uB298\uC744 \uBC1D\uD600 \uBCF4\uC138\uC694." }),
  tree: Object.freeze({ x: treeLayout.x - 7, z: treeLayout.z - 12, r: 0.85, yaw: Math.PI, message: "\uC18C\uC6D0\uC744 \uBE4C\uACE0, \uB9C8\uC74C\uC5D0 \uB4DC\uB294 \uC7A5\uC2DD\uC73C\uB85C \uD2B8\uB9AC\uB97C \uAFB8\uBA70 \uBCF4\uC138\uC694." })
});

// ../dist/collision-grid.js
function createStaticColliderIndex(obstacles2, { size = 12, padding = 0 } = {}) {
  const cells2 = /* @__PURE__ */ new Map(), empty = [];
  for (const obstacle of obstacles2) {
    const c = Math.abs(Math.cos(obstacle.yaw || 0)), s = Math.abs(Math.sin(obstacle.yaw || 0)), u = (obstacle.rx ?? obstacle.r ?? obstacle.w ?? 0) + padding, v = (obstacle.rz ?? obstacle.r ?? obstacle.d ?? 0) + padding, rx = u * c + v * s, rz = u * s + v * c;
    for (let x = Math.floor((obstacle.x - rx) / size); x <= Math.floor((obstacle.x + rx) / size); x++) for (let z = Math.floor((obstacle.z - rz) / size); z <= Math.floor((obstacle.z + rz) / size); z++) {
      const key2 = x + "," + z;
      if (!cells2.has(key2)) cells2.set(key2, []);
      cells2.get(key2).push(obstacle);
    }
  }
  return { query(x, z) {
    return cells2.get(Math.floor(x / size) + "," + Math.floor(z / size)) || empty;
  } };
}
__name(createStaticColliderIndex, "createStaticColliderIndex");
function colliderContains(o, x, z, padding = 0) {
  const c = Math.cos(o.yaw || 0), s = Math.sin(o.yaw || 0), wx = x - o.x, wz = z - o.z, dx = wx * c - wz * s, dz = wx * s + wz * c;
  if (o.door && Math.abs(dx - (o.door.offset ?? o.door.x - o.x)) < o.door.w - padding) return false;
  if (o.rx) return (dx / (o.rx + padding)) ** 2 + (dz / (o.rz + padding)) ** 2 < 1;
  return o.r ? Math.hypot(dx, dz) < o.r + padding : Math.abs(dx) < o.w + padding && Math.abs(dz) < o.d + padding;
}
__name(colliderContains, "colliderContains");

// ../dist/retreat-layout.js
var officeOrigin = regions.tree.landmarks.postOffice;
var postOffice = { ...officeOrigin, w: 6, d: 4, yaw: Math.PI / 2 };
postOffice.entry = boothPoint(postOffice, 0, 4.8);
var hostPoint = boothPoint(postOffice, 4.6, 3);
var postOfficeHost = { ...hostPoint, r: 0.75, yaw: Math.atan2(regions.tree.anchors.park.x - hostPoint.x, regions.tree.anchors.park.z - hostPoint.z) };
function boothPoint(p3, x, z) {
  const yaw = p3.yaw || 0;
  return { x: p3.x + x * Math.cos(yaw) + z * Math.sin(yaw), z: p3.z - x * Math.sin(yaw) + z * Math.cos(yaw) };
}
__name(boothPoint, "boothPoint");
var retreatObstacles = [
  { x: postOffice.x, z: postOffice.z, w: postOffice.d / 2, d: postOffice.w / 2 },
  { ...boothPoint(postOffice, postOffice.w / 2 + 0.8, 1.15), r: 0.37 },
  ...[-1, 1].map((side) => ({ ...boothPoint(postOffice, side * postOffice.w * 0.41, postOffice.d / 2 + 0.5), r: 0.18 }))
];
function retreatCanStandAt(x, z, bodyRadius2 = 0.35) {
  if (!Number.isFinite(x + z + bodyRadius2)) return false;
  return !retreatObstacles.some((o) => o.r ? Math.hypot(x - o.x, z - o.z) < o.r + bodyRadius2 : Math.abs(x - o.x) < o.w + bodyRadius2 && Math.abs(z - o.z) < o.d + bodyRadius2);
}
__name(retreatCanStandAt, "retreatCanStandAt");

// ../dist/mountain-forest.js
var forestTileSize = 128;
var cache = /* @__PURE__ */ new Map();
function nearCable(x, z, line) {
  const t = ((x - line.x) * line.dx + (z - line.z) * line.dz) / (line.dx ** 2 + line.dz ** 2);
  return t >= 0 && t <= 1 && Math.hypot(x - line.x - t * line.dx, z - line.z - t * line.dz) < 12;
}
__name(nearCable, "nearCable");
function mountainTrees(tx, tz) {
  const key2 = tx + ":" + tz;
  if (cache.has(key2)) return cache.get(key2);
  let seed2 = ((tx + 100) * 73856093 ^ (tz + 100) * 19349663) >>> 0;
  const random2 = /* @__PURE__ */ __name(() => {
    seed2 = Math.imul(seed2, 1664525) + 1013904223 >>> 0;
    return seed2 / 4294967296;
  }, "random"), trees = [];
  for (let i = 0; i < 35; i++) {
    const x = (tx + random2()) * forestTileSize, z = (tz + random2()) * forestTileSize, h = 6 + random2() * 8;
    if (z > -390 || z < mountainZ(-4200) || mountainDistance(x, z) > -25) continue;
    if (random2() > (z < mountainZ(-3200) ? 0.28 : 0.8) * (0.55 + 0.45 * Math.sin(x * 7e-3 + z * 4e-3) ** 2)) continue;
    if (skiRuns.some((r) => z >= r.startZ - 25 && z <= r.finish + 30 && Math.abs(x - skiRunCenter(z, r.id)) < skiRunHalfWidth(z, r.id) + h * 0.5 + 8)) continue;
    if (mountainTerraces.some((p3) => Math.hypot((x - p3.x) / (p3.rx + 12), (z - p3.z) / (p3.rz + 12)) < 1.2)) continue;
    if ([liftLayout, upperLiftLayout, ridgeLiftLayout].some((l) => nearCable(x, z, l)) || gondolaPoints.some((p3) => Math.hypot(p3[0] - x, p3[2] - z) < 24)) continue;
    const y = alpineHeight(x, z), grade = Math.hypot(alpineHeight(x + 2, z) - alpineHeight(x - 2, z), alpineHeight(x, z + 2) - alpineHeight(x, z - 2)) / 4;
    if (grade > 1.1) continue;
    trees.push({ x, z, y, h, r: h * 0.03, turn: random2() * Math.PI * 2 });
  }
  if (cache.size >= 96) cache.delete(cache.keys().next().value);
  cache.set(key2, trees);
  return trees;
}
__name(mountainTrees, "mountainTrees");
function mountainTrunkBlocks(x, z, radius) {
  const tx = Math.floor(x / forestTileSize), tz = Math.floor(z / forestTileSize);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const t of mountainTrees(tx + dx, tz + dz)) if ((x - t.x) ** 2 + (z - t.z) ** 2 < (t.r + radius) ** 2) return true;
  return false;
}
__name(mountainTrunkBlocks, "mountainTrunkBlocks");

// ../dist/world-paths.js
var spa3 = /* @__PURE__ */ __name((x, z) => p2(spaToWorld({ x, z })), "spa");
var p2 = /* @__PURE__ */ __name((point2) => [point2.x, point2.z], "p");
var anchor = /* @__PURE__ */ __name((id, other) => {
  const bridge = regionBridges.find((b) => b.from === id && b.to === other || b.to === id && b.from === other);
  return p2(bridge.from === id ? bridge.approachStart : bridge.approachEnd);
}, "anchor");
var worldPathLinks = [
  ...gondolaApproach2.slice(1).map((b, i) => [p2(gondolaApproach2[i]), p2(b), 7]),
  ...regionBridges.flatMap((b) => [[p2(b.approachStart), p2(b.start), 6], [p2(b.start), p2(b.end), 6], [p2(b.end), p2(b.approachEnd), 6]]),
  [[0, 26], anchor("park", "tree"), 6],
  [[0, -7], anchor("park", "ski"), 5.5],
  [anchor("ski", "park"), [-24, -149 + alpineShift], 6],
  [[-24, -149 + alpineShift], [-62, -150 + alpineShift], 5.5],
  ...liftApproach2.slice(2).map((b, i) => [p2(liftApproach2[i + 1]), p2(b), 5.5]),
  [[-24, -149 + alpineShift], [52, -153 + alpineShift], 6],
  [[52, -153 + alpineShift], [upperLiftLayout2.x - 8, -174 + alpineShift], 6],
  [[upperLiftLayout2.x - 8, -174 + alpineShift], p2(upperLiftEntry2), 6],
  [anchor("ski", "spa"), [52, -153 + alpineShift], 6],
  [[26, 14], [34, 12], 6],
  [[34, 12], anchor("park", "spa"), 6],
  [anchor("spa", "park"), p2(regions.spa.arrival), 5.5],
  [anchor("spa", "ski"), spa3(16, 108), 4.4],
  [spa3(16, 108), spa3(12, 108), 4.4],
  [spa3(12, 108), p2(regions.spa.arrival), 4.4],
  [spa3(12, 108), spa3(12, 113.6), 5],
  [anchor("tree", "park"), [-8, 62], 5],
  [[-8, 62], p2(postOffice.entry), 5],
  [p2(postOffice.entry), p2(regions.tree.arrival), 5],
  [anchor("tree", "park"), [12, 68], 5],
  [[12, 68], [15, 86], 5],
  [[15, 86], [0, 99], 5],
  [[0, 99], [-16, 89], 5],
  [[-16, 89], p2(regions.tree.arrival), 5],
  [[-27, 25], anchor("park", "museum"), 5.5],
  [anchor("museum", "park"), p2(regions.museum.arrival), 5.5],
  [p2(regions.museum.arrival), p2(museumLayout.door), 5]
];

// ../dist/alpine-forest-layout.js
var form = { x: 0, z: -230, rx: 144, rz: 174 };
var liftLines = [liftPoint, upperLiftPoint].map((point2) => Array.from({ length: 49 }, (_, i) => {
  const p3 = point2(i / 48);
  return { x: p3[0] + 2, z: p3[2] };
}));
var distanceToLine = /* @__PURE__ */ __name((x, z, points) => Math.min(...points.slice(1).map((p3, i) => segmentDistance(x, z, points[i], p3))), "distanceToLine");
function clear(x, z, h) {
  if (Math.hypot((x - gondolaBase.x) / (gondolaBase.rx + 12), (z - gondolaBase.z) / (gondolaBase.rz + 12)) < 1.25 || gondolaPoints.some((p3) => Math.hypot(x - p3[0], z - p3[2]) < h * 0.5 + 13)) return false;
  if (mountainDistance(x, z) > -h * 0.45 - 4) return false;
  if (worldPathLinks.some(([a, b, width]) => a[1] < -40 && b[1] < -40 && segmentDistance(x, z + alpineShift, { x: a[0], z: a[1] }, { x: b[0], z: b[1] }) < width / 2 + h * 0.2 + 1)) return false;
  if (Math.hypot(x - alpine.x, z - alpine.z) > alpine.r - 9 || z > -169 || z < alpine.z - 118) return false;
  if (skiRunouts.some((a) => Math.hypot((x - a.x) / (a.rx + 6), (z - a.z) / (a.rz + 6)) < 1)) return false;
  if ([summit, peakSummit].some((s) => Math.hypot((x - s.x) / (s.rx + 7), (z - s.z) / (s.rz + 7)) < 1)) return false;
  if (skiRuns.some((run) => z > run.startZ - 8 && z < run.finish + 14 && Math.abs(x - skiRunCenter(z, run.id)) < skiRunHalfWidth(z, run.id) + 8)) return false;
  if (liftLines.some((line) => distanceToLine(x, z, line) < 9) || distanceToLine(x, z, summitTransfer) < 9) return false;
  if (Math.abs(x + 97) < 16 && Math.abs(z + 176) < 15) return false;
  if (Math.abs(x + 36) < 8 && z > -196 && z < -169) return false;
  if (summitFacilities.some((p3) => Math.hypot(x - (p3.model?.x ?? p3.x), z - (p3.model?.z ?? p3.z)) < h * 0.4 + 7)) return false;
  const grade = Math.hypot(alpineHeight(x + 1, z) - alpineHeight(x - 1, z), alpineHeight(x, z + 1) - alpineHeight(x, z - 1)) / 2;
  return grade <= 1.4;
}
__name(clear, "clear");
var seed = 4277;
var random = /* @__PURE__ */ __name(() => {
  seed = seed * 16807 % 2147483647;
  return (seed - 1) / 2147483646;
}, "random");
var authoredTrees = [];
for (let attempt = 0; attempt < 2400 && authoredTrees.length < 185; attempt++) {
  const angle2 = random() * Math.PI * 2, r = Math.sqrt(0.04 + random() * 0.82), edge = 1;
  const x = form.x + Math.cos(angle2) * form.rx * edge * r, z = form.z + Math.sin(angle2) * form.rz * edge * r, h = 5 + random() * 7;
  if (!clear(x, z, h) || authoredTrees.some((p3) => Math.hypot(x - p3.x, z - p3.z) < 3.2)) continue;
  authoredTrees.push({ x, z, h, y: alpineHeight(x, z), r: h * 0.045, turn: random() * Math.PI * 2, shade: Math.floor(random() * 3), decorated: false });
}
var ranked = [...authoredTrees].sort((a, b) => {
  const score = /* @__PURE__ */ __name((p3) => Math.min(distanceToLine(p3.x, p3.z, liftLines[0]), distanceToLine(p3.x, p3.z, summitTransfer), Math.hypot(p3.x + 55, p3.z + 176)), "score");
  return score(a) - score(b);
});
var lit = [];
for (const tree of ranked) {
  if (lit.length >= 24) break;
  if (lit.some((p3) => Math.hypot(tree.x - p3.x, tree.z - p3.z) < 10)) continue;
  tree.decorated = true;
  lit.push(tree);
}
var alpineTrees = authoredTrees.map((p3) => ({ ...p3, z: p3.z + alpineShift }));
var cells = /* @__PURE__ */ new Map();
var cellKey = /* @__PURE__ */ __name((x, z) => `${Math.floor(x / 16)},${Math.floor(z / 16)}`, "cellKey");
for (const tree of alpineTrees) {
  const key2 = cellKey(tree.x, tree.z);
  if (!cells.has(key2)) cells.set(key2, []);
  cells.get(key2).push(tree);
}
function alpineTrunkBlocks(x, z, bodyRadius2) {
  if (z > -160 + alpineShift) return false;
  if (z < -390 + alpineShift) return mountainTrunkBlocks(x, z - alpineShift, bodyRadius2);
  const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const tree of cells.get(`${cx + dx},${cz + dz}`) || []) {
    if ((x - tree.x) ** 2 + (z - tree.z) ** 2 < (tree.r + bodyRadius2) ** 2) return true;
  }
  return false;
}
__name(alpineTrunkBlocks, "alpineTrunkBlocks");

// ../dist/movement.js
var obstacles = [
  ...districtObstacles,
  ...promenadeTrees,
  postOfficeHost,
  ...resortObstacles2,
  ...festivalObstacles,
  spaToWorld({ x: 12, z: 126, w: 12, d: 11, yaw: 0 }),
  { x: treeLayout.x, z: treeLayout.z, r: 9.4 },
  ...parkObstacles,
  ...treeBenches.map((p3) => ({ ...p3, r: 2.1 })),
  ...Object.values(parkGuideLayout),
  ...castleObstacles
];
var bodyRadius = 0.35;
var obstacleIndex = createStaticColliderIndex(obstacles, { padding: bodyRadius });
function canStandAt(x, z) {
  if (!Number.isFinite(x + z) || !terrainAt(x, z)) return false;
  if (interiorAt(x, z)) return interiorCanStandAt(x, z, bodyRadius);
  if (bridges.some(([a, b]) => {
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz), along = ((x - a.x) * dx + (z - a.z) * dz) / len, side = Math.abs(((x - a.x) * dz - (z - a.z) * dx) / len);
    return along > a.r - 1 && along < len - b.r + 1 && Math.abs(side - bridgeHalfWidth) < bodyRadius + 0.1;
  })) return false;
  if (!retreatCanStandAt(x, z, bodyRadius)) return false;
  if (alpineTrunkBlocks(x, z, bodyRadius)) return false;
  return !obstacleIndex.query(x, z).some((o) => colliderContains(o, x, z, bodyRadius));
}
__name(canStandAt, "canStandAt");

// ../server/pose-validation.js
function reservedRidePose(b, reservation, now = Date.now()) {
  if (!["lift", "ferris"].includes(b.mode)) return true;
  if (!reservation || (b.mode === "ferris" ? reservation.kind !== "ferris" : !["lift", "upperlift", "ridgelift", "gondola"].includes(reservation.kind))) return false;
  const sampled = Number.isFinite(b.seatAt) && b.seatAt <= now + 250 && b.seatAt >= now - 8e3 ? b.seatAt : now;
  const expected = sharedSeatPose(reservation, sampled);
  return !!expected && Math.hypot(b.x - expected.x, b.y - expected.y, b.z - expected.z) <= 3;
}
__name(reservedRidePose, "reservedRidePose");
function currentReservedPose(b, reservation, now = Date.now()) {
  if (!["lift", "ferris"].includes(b?.mode) || !reservation) return null;
  return sharedSeatPose(reservation, now);
}
__name(currentReservedPose, "currentReservedPose");
function validPose(b, reservation, now = Date.now()) {
  if (!b || ![b.x, b.y, b.z, b.yaw].every(Number.isFinite)) return false;
  if (!reservedRidePose(b, reservation, now)) return false;
  if (b.mode === "lift" && reservation?.kind === "gondola") return true;
  const bench = benchPoseValid(reservation, b) || diningPoseValid(reservation, b);
  if (["dining", "footbath"].includes(b.mode) && !bench) return false;
  const rest = b.mode === "rest" && Object.values(restSeats2).some((p3) => Math.hypot(b.x - p3.x, b.z - p3.z) < 0.15 && Math.abs(b.y - p3.y) < 0.15);
  return interiorPositionValid(b.x, b.y, b.z) || canStandAt(b.x, b.z) && b.y >= surfaceHeight(b.x, b.z) + 0.5 && b.y <= surfaceHeight(b.x, b.z) + 3 || rest || bench || amusementPositionValid(b.x, b.y, b.z, b.mode) || spaPositionValid2(b.x, b.y, b.z, b.mode) || resortRidePosition2(b.x, b.y, b.z, b.mode);
}
__name(validPose, "validPose");

// ../dist/balloon-design.js
var balloonColors = ["#ed91b3", "#79cfe1", "#c4a0ed", "#f0c56b", "#91d9b5", "#ed9980", "#a8b9f0"];
var balloonStyles = ["classic", "star", "snow"];

// ../dist/activity-state.js
var gestures = ["", "wave", "bubble", "warm", "eat", "roast", "drink", "heart", "joy", "sad", "surprise", "dance"];
var activityGestures = [...gestures, ...balloonStyles.flatMap((style) => balloonColors.map((_, tone) => `balloon-${style}-${tone}`)), "odeng-eat", "marshmallow-carry", "marshmallow-roast", "marshmallow-toasted", "marshmallow-eat", "coffee-carry", "coffee-drink", "cocoa-carry", "cocoa-drink", "balloon-carry", "icecream-carry", "icecream-eat", "candyfloss-carry", "candyfloss-eat", "popcorn-carry", "popcorn-eat", "bubble-carry", "sparkler-carry", "sparkler-wave"];

// world.js
var realtimeLimits = Object.freeze({ capacity: 100, peers: 32, maxMessage: 2048, rate: 15, idleMs: 15e3 });
var modes = /* @__PURE__ */ new Set(["", "lift", "summit", "ski", "rest", "bath", "sauna", "lie", "tea", "dining", "carousel", "ferris", "view", "footbath"]);
var RealtimeWorld = class {
  static {
    __name(this, "RealtimeWorld");
  }
  constructor({ now = Date.now, restore = [] } = {}) {
    this.now = now;
    this.clients = /* @__PURE__ */ new Map();
    this.known = /* @__PURE__ */ new WeakMap();
    this.farSent = /* @__PURE__ */ new WeakMap();
    this.recentlyClosed = /* @__PURE__ */ new Map();
    this.revoked = /* @__PURE__ */ new Map();
    this.fireworks = null;
    this.rideSeats = [];
    this.metrics = { since: now(), accepted: 0, closed: 0, reconnected: 0, received: 0, rejected: 0, bytesOut: 0, rejections: {}, clientRTT: [], samples: [] };
    for (const ws of restore) {
      const state = ws.deserializeAttachment();
      if (state && state.exp > now()) this.clients.set(ws, state);
      else ws.close(4001, "Session expired");
    }
  }
  save(ws, state) {
    ws.serializeAttachment?.(state);
  }
  accept(ws, claims) {
    this.prune();
    if (this.revoked.get(claims.id) > this.now()) {
      ws.close(4001, "Session revoked");
      return false;
    }
    const previous = [...this.clients].find(([, s]) => s.id === claims.id);
    if (!previous && this.clients.size >= realtimeLimits.capacity) {
      ws.close(4008, "World full");
      return false;
    }
    if (previous) {
      this.clients.delete(previous[0]);
      previous[0].close(4009, "Connected in another tab");
    }
    if (previous || this.recentlyClosed.get(claims.id) > this.now()) this.metrics.reconnected++;
    this.recentlyClosed.delete(claims.id);
    const state = { id: claims.id, exp: claims.exp, profile: previous?.[1].profile || claims.profile, seq: -1, seen: this.now(), poseAt: this.now(), windowAt: this.now(), messages: 0 };
    this.clients.set(ws, state);
    this.save(ws, state);
    this.metrics.accepted++;
    this.send(ws, { type: "ready", ...this.wireSnapshot(ws, state) });
    return true;
  }
  send(ws, data) {
    const body = JSON.stringify(data);
    try {
      ws.send(body);
      this.metrics.bytesOut += body.length;
    } catch {
      this.close(ws);
    }
  }
  close(ws) {
    const s = this.clients.get(ws);
    if (this.clients.delete(ws)) {
      this.metrics.closed++;
      this.recentlyClosed.set(s.id, this.now() + 6e4);
      while (this.recentlyClosed.size > 100) this.recentlyClosed.delete(this.recentlyClosed.keys().next().value);
    }
  }
  prune() {
    const now = this.now();
    for (const [ws, s] of this.clients) if (s.exp <= now || now - s.seen > realtimeLimits.idleMs) {
      this.clients.delete(ws);
      ws.close(4001, "Session expired");
      this.metrics.closed++;
    }
    for (const [id, expires] of this.revoked) if (expires <= now) this.revoked.delete(id);
  }
  message(ws, raw) {
    const start = performance.now(), now = this.now();
    this.prune();
    const s = this.clients.get(ws);
    if (!s) return;
    this.metrics.received++;
    const reject = /* @__PURE__ */ __name((code) => {
      this.metrics.rejected++;
      this.metrics.rejections[code] = (this.metrics.rejections[code] || 0) + 1;
      this.send(ws, { type: "rejected", code, serverTime: now });
    }, "reject");
    if (typeof raw !== "string" || raw.length > realtimeLimits.maxMessage) {
      ws.close(1009, "Message too large");
      this.close(ws);
      return;
    }
    if (now - s.windowAt >= 1e3) {
      s.windowAt = now;
      s.messages = 0;
    }
    if (++s.messages > realtimeLimits.rate) {
      reject("rate");
      if (s.messages > 30) {
        ws.close(1008, "Message rate exceeded");
        this.close(ws);
      }
      return;
    }
    let b;
    try {
      b = JSON.parse(raw);
    } catch {
      return reject("format");
    }
    if (!b || !["pose", "ping"].includes(b.type)) return reject("type");
    if (!Number.isSafeInteger(b.seq) || b.seq <= s.seq || !Number.isFinite(b.at) || Math.abs(now - b.at) > 3e4) return reject("stale");
    if (b.type === "pose") {
      const p3 = b.pose, reservation = this.rideSeats.find((r) => r.id === s.id && r.expiresAt > now);
      if (!validPose(p3, reservation, now) || !modes.has(p3.mode || "")) return reject("pose");
      const currentSeat = currentReservedPose(p3, reservation, now);
      if (currentSeat) for (const key2 of ["x", "y", "z", "yaw"]) p3[key2] = currentSeat[key2];
      const elapsed = Math.max(0.1, (now - s.poseAt) / 1e3), distance = Math.hypot(p3.x - s.profile.x, p3.z - s.profile.z);
      if (distance > 12 + Math.min(elapsed, 5) * (p3.mode === "ski" ? 48 : ["lift", "summit", "ferris"].includes(p3.mode) ? 24 : 12)) return reject("movement");
      const gesture = activityGestures.includes(p3.gesture) && p3.gesture ? p3.gesture : s.profile.gesture === "wave" && now - s.profile.gestureAt < 2e3 ? "wave" : "";
      s.profile = { ...s.profile, x: p3.x, y: p3.y, z: p3.z, yaw: p3.yaw, mode: p3.mode || "", lean: p3.mode === "ski" && Number.isFinite(p3.lean) ? Math.max(-1, Math.min(1, p3.lean)) : 0, tilt: p3.mode === "ski" && Number.isFinite(p3.tilt) ? Math.max(-0.55, Math.min(0.55, p3.tilt)) : 0, brake: p3.mode === "ski" && p3.brake === true, air: p3.mode === "ski" && Number.isFinite(p3.air) ? Math.max(0, Math.min(1.2, p3.air)) : 0, speed: Math.max(0, Math.min(p3.mode === "ski" ? 56 : 8, Number.isFinite(p3.speed) ? p3.speed : 0)), region: interiorAt(p3.x, p3.z)?.id || "outdoors", updatedAt: now, gesture, gestureAt: gesture === s.profile.gesture ? s.profile.gestureAt : now };
      s.poseAt = now;
    }
    if (Number.isFinite(b.rttMs) && b.rttMs >= 0 && b.rttMs <= 3e4 && now - (s.reportAt || 0) >= 5e3) {
      s.reportAt = now;
      this.metrics.clientRTT.push(b.rttMs);
      if (this.metrics.clientRTT.length > 300) this.metrics.clientRTT.shift();
    }
    s.seq = b.seq;
    s.seen = now;
    this.save(ws, s);
    this.send(ws, { type: "snapshot", ack: b.seq, ...this.wireSnapshot(ws, s) });
    const samples = this.metrics.samples;
    samples.push(performance.now() - start);
    if (samples.length > 300) samples.shift();
  }
  wireSnapshot(ws, self) {
    const snapshot = this.snapshot(self), previous = this.known.get(ws) || /* @__PURE__ */ new Map(), next = /* @__PURE__ */ new Map(), sent = this.farSent.get(ws) || /* @__PURE__ */ new Map(), nextSent = /* @__PURE__ */ new Map(), now = this.now();
    snapshot.people = snapshot.people.map((profile) => {
      const full = { ...profile };
      for (const key2 of ["x", "y", "z", "yaw", "speed", "lean", "tilt", "air"]) if (Number.isFinite(full[key2])) full[key2] = Math.round(full[key2] * 1e3) / 1e3;
      const old = previous.get(full.id), far = Math.hypot(full.x - self.profile.x, full.z - self.profile.z) > 75, last = sent.get(full.id) || 0;
      const defer = far && old && full.mode === old.mode && full.speed !== 0 && now - last < 1e3;
      if (defer) {
        for (const key2 of ["x", "y", "z", "yaw", "speed", "lean", "tilt", "air", "updatedAt"]) if (key2 in old) full[key2] = old[key2];
      }
      nextSent.set(full.id, defer ? last : now);
      next.set(full.id, full);
      if (!old) return full;
      const delta = { id: full.id };
      for (const key2 of Object.keys(full)) if (full[key2] !== old[key2]) delta[key2] = full[key2];
      return delta;
    });
    this.known.set(ws, next);
    this.farSent.set(ws, nextSent);
    return snapshot;
  }
  snapshot(self) {
    const now = this.now(), people = [...this.clients.values()].filter((s) => s.id !== self.id && s.profile.region === self.profile.region).sort((a, b) => Math.hypot(a.profile.x - self.profile.x, a.profile.z - self.profile.z) - Math.hypot(b.profile.x - self.profile.x, b.profile.z - self.profile.z)).slice(0, realtimeLimits.peers).map((s) => ({ ...s.profile, speed: now - s.poseAt > 1500 ? 0 : s.profile.speed, chat: now - s.profile.chatAt < 1e4 ? s.profile.chat : "", gesture: now - s.profile.gestureAt < 6e3 ? s.profile.gesture : "" }));
    return { people, count: this.clients.size, rideSeats: this.rideSeats.filter((s) => s.expiresAt > now), fireworks: this.fireworks, serverTime: now };
  }
  rpc(b) {
    this.prune();
    const now = this.now();
    if (b.action === "authorize") {
      for (const [ws, s] of this.clients) if (s.id === b.id) {
        s.exp = b.exp;
        for (const k of ["name", "color", "colorTop", "accessory", "fluff", "roundness"]) s.profile[k] = b.profile[k];
        this.save(ws, s);
      }
    }
    if (b.action === "checkpoint") {
      for (const [ws, s] of this.clients) if (s.id === b.id) {
        if ((b.profile.updatedAt || 0) >= s.poseAt) {
          s.profile = { ...s.profile, ...b.profile };
          s.poseAt = b.profile.updatedAt;
        }
        s.seen = now;
        this.save(ws, s);
      }
    }
    if (b.action === "relocate") {
      for (const [ws, s] of this.clients) if (s.id === b.id) {
        s.profile = { ...s.profile, ...b.profile, updatedAt: now };
        s.poseAt = now;
        s.seen = now;
        this.save(ws, s);
      }
    }
    if (b.action === "revoke") {
      this.revoked.set(b.id, now + 125e3);
      for (const [ws, s] of this.clients) if (s.id === b.id) {
        this.clients.delete(ws);
        ws.close(4001, "Session revoked");
      }
    }
    if (b.action === "patch") {
      for (const [ws, s] of this.clients) if (s.id === b.id) {
        s.profile = { ...s.profile, ...b.profile };
        this.save(ws, s);
      }
    }
    if ("fireworks" in b) this.fireworks = b.fireworks;
    if (b.rideSeats) this.rideSeats = b.rideSeats;
    if (b.action === "profile") return { profile: [...this.clients.values()].find((s) => s.id === b.id)?.profile || null };
    if (b.action === "metrics") {
      const samples = [...this.metrics.samples].sort((a, b2) => a - b2), regions2 = {};
      for (const s of this.clients.values()) regions2[s.profile.region] = (regions2[s.profile.region] || 0) + 1;
      const { samples: _, clientRTT, ...metrics } = this.metrics, rtt = [...clientRTT].sort((a, b2) => a - b2);
      return { clientRTTMeanMs: rtt.length ? rtt.reduce((a, b2) => a + b2, 0) / rtt.length : null, clientRTTP95Ms: rtt.length ? rtt[Math.floor((rtt.length - 1) * 0.95)] : null, handlerMeanMs: samples.length ? samples.reduce((a, b2) => a + b2, 0) / samples.length : null, connections: this.clients.size, regions: regions2, ...metrics, handlerP95Ms: samples.length ? samples[Math.floor((samples.length - 1) * 0.95)] : null, capacity: realtimeLimits.capacity };
    }
    return { ok: true };
  }
};

// worker.js
var worker_default = { fetch(request, env) {
  const path = new URL(request.url).pathname;
  if (path === "/health" && request.method === "GET") return Response.json({ ok: true, service: "winterlight-realtime", revision: env.RELEASE_REVISION || "local" }, { headers: { "Cache-Control": "no-store" } });
  if (!["/connect", "/rpc"].includes(path)) return new Response("Not found", { status: 404 });
  return env.WORLD.get(env.WORLD.idFromName("winter-plaza")).fetch(request);
} };
var WinterWorld = class {
  static {
    __name(this, "WinterWorld");
  }
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.nonces = /* @__PURE__ */ new Map();
    this.world = new RealtimeWorld({ restore: ctx.getWebSockets() });
    ctx.blockConcurrencyWhile(async () => {
      const saved = await ctx.storage.get("shared");
      if (saved) {
        this.world.rpc(saved);
        this.world.revoked = new Map(saved.revoked || []);
        this.sharedJSON = JSON.stringify(saved);
      }
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/rpc") {
      if (request.method !== "POST" || Number(request.headers.get("content-length") || 0) > 65536) return new Response("Invalid request", { status: 400 });
      try {
        request = await boundedRequest(request, 65536);
      } catch {
        return new Response("Request too large", { status: 413 });
      }
      const raw = await request.text();
      if (raw.length > 65536 || !await verifyRPC(raw, request.headers.get("x-winter-signature"), this.env.REALTIME_SECRET)) return new Response("Unauthorized", { status: 403 });
      const b = JSON.parse(raw);
      if (Math.abs(Date.now() - b.at) > 1e4 || !b.nonce || this.nonces.has(b.nonce)) return new Response("Expired", { status: 403 });
      for (const [key2, time] of this.nonces) if (time < Date.now() - 1e4) this.nonces.delete(key2);
      if (this.nonces.size > 4096) return new Response("Busy", { status: 429 });
      this.nonces.set(b.nonce, Date.now());
      const result = this.world.rpc(b);
      if (b.action === "metrics") {
        result.revision = this.env.RELEASE_REVISION || "local";
        result.protocol = "winter-v1";
      }
      if ("fireworks" in b || b.rideSeats || b.action === "revoke") {
        const shared = { fireworks: this.world.fireworks, rideSeats: this.world.rideSeats, revoked: [...this.world.revoked] }, json = JSON.stringify(shared);
        if (json !== this.sharedJSON) {
          await this.ctx.storage.put("shared", shared);
          this.sharedJSON = json;
        }
      }
      return Response.json(result);
    }
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") return new Response("WebSocket required", { status: 426 });
    const origins = (this.env.ALLOWED_ORIGINS || "").split(",");
    if (!origins.includes(request.headers.get("origin"))) return new Response("Origin denied", { status: 403 });
    const protocols = (request.headers.get("sec-websocket-protocol") || "").split(",").map((s) => s.trim()), token = protocols.find((s) => s.startsWith("auth."))?.slice(5);
    const claims = await verifyTicket(token, this.env.REALTIME_SECRET);
    if (!claims) return new Response("Session expired", { status: 401 });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    this.world.accept(server, claims);
    return new Response(null, { status: 101, webSocket: client, headers: { "Sec-WebSocket-Protocol": "winter-v1" } });
  }
  webSocketMessage(ws, message) {
    this.world.message(ws, message);
  }
  webSocketClose(ws) {
    this.world.close(ws);
  }
  webSocketError(ws) {
    this.world.close(ws);
  }
};
export {
  WinterWorld,
  worker_default as default
};
//# sourceMappingURL=worker.js.map
