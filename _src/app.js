/* ==================================================================
   大冶市低空运行总态势大屏 · 应用逻辑
   结构：DATA → 地图引擎（Canvas） → 面板（ECharts/原生） → 交互 → 演示剧本
   说明：全部数值为演示样例；口径与需求清单「指标口径清单」一致
   ================================================================== */
(function () {
  'use strict';

  /* ========== 1. 数据（演示样例，非生产数据） ========== */
  const DATA = {
    updated: '10:12:36',
    kpi: {
      sorties: { today: 38, yesterday: 34, delta: 11.8, trend: [29, 31, 27, 33, 35, 36, 38] },
      airborne: { count: 6, multi: 4, compound: 2 },
      online: { rate: 92.3, online: 24, total: 26, threshold: 90 },
      safe: { days: 186, since: '2026-05-02' }
    },
    fleet: [
      { key: 'flying', name: '飞行中', value: 6, color: '#1E88E5' },
      { key: 'standby', name: '空闲待命', value: 17, color: '#4FA3E8' },
      { key: 'offline', name: '离线', value: 2, color: '#8CA6C4' },
      { key: 'maint', name: '维保中', value: 1, color: '#F0A030' }
    ],
    links: [
      { name: '无人机遥测 MQTT', state: 'ok' },
      { name: '市级空域平台', state: 'ok' },
      { name: '时序数据库', state: 'ok' },
      { name: '告警事件流', state: 'ok' }
    ],
    platform: { city: '已连接', sync: 1284, calls: 3760, last: '10:12:30' },
    airspace: [
      { key: 'forbid', name: '禁飞区', area: 18.6, pct: 1.2, color: 'rgba(229,87,75,.30)', line: 'rgba(229,87,75,.85)' },
      { key: 'limit', name: '限飞区', area: 42.3, pct: 2.7, color: 'rgba(240,160,48,.26)', line: 'rgba(240,160,48,.85)' },
      { key: 'free', name: '适飞区', area: 1505.1, pct: 96.1, color: 'rgba(53,168,111,.24)', line: 'rgba(53,168,111,.75)' }
    ],
    tasks: [
      { name: '巡检', value: 14 },
      { name: '物流配送', value: 11 },
      { name: '航拍', value: 8 },
      { name: '应急', value: 5 }
    ],
    trend: {
      hours: ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
      today: [1, 3, 5, 6, 4, 3, 2, 3, 4, 2, 2, 1, 1, 1, 0],
      yday: [1, 2, 4, 5, 4, 3, 3, 2, 3, 2, 2, 1, 1, 1, 0]
    },
    ports: [
      { id: 'H1', name: '大冶湖二级枢纽', lon: 115.010, lat: 30.020, level: 2, type: 'hub', pads: 12, charge: '8/12', status: 'normal' },
      { id: 'H2', name: '铜绿山景区起降场', lon: 114.945, lat: 30.050, level: 3, type: 'scenic', pads: 4, charge: '2/4', status: 'normal' },
      { id: 'H3', name: '小雷山景区起降场', lon: 114.830, lat: 30.000, level: 3, type: 'scenic', pads: 3, charge: '0/3', status: 'idle' },
      { id: 'H4', name: '市人民医院起降场', lon: 114.968, lat: 30.090, level: 3, type: 'medical', pads: 2, charge: '1/2', status: 'normal' },
      { id: 'H5', name: '金牛镇驿站', lon: 114.750, lat: 30.045, level: 3, type: 'logistic', pads: 3, charge: '1/3', status: 'normal' },
      { id: 'H6', name: '陈贵镇驿站', lon: 114.845, lat: 30.020, level: 3, type: 'industrial', pads: 3, charge: '2/3', status: 'normal' },
      { id: 'H7', name: '保安镇驿站', lon: 114.865, lat: 30.205, level: 3, type: 'logistic', pads: 3, charge: '1/3', status: 'normal' },
      { id: 'H8', name: '灵乡镇驿站', lon: 114.775, lat: 30.080, level: 3, type: 'logistic', pads: 3, charge: '0/3', status: 'alert' }
    ],
    routes: [
      { id: 'R1', name: '市人民医院—金牛镇卫生院', type: 'medical', km: 12.4, band: '120–300m', sorties: 12, path: [[114.968, 30.090], [114.905, 30.072], [114.750, 30.045]] },
      { id: 'R2', name: '雨润广场—大冶湖新区', type: 'commercial', km: 8.6, band: '80–150m', sorties: 9, path: [[114.974, 30.098], [114.995, 30.070], [115.010, 30.020]] },
      { id: 'R3', name: '铜绿山—小雷山景区', type: 'scenic', km: 15.2, band: '150–300m', sorties: 7, path: [[114.945, 30.050], [114.890, 30.018], [114.830, 30.000]] },
      { id: 'R4', name: '大冶有色—陈贵镇', type: 'industrial', km: 10.8, band: '100–250m', sorties: 5, path: [[114.935, 30.082], [114.890, 30.045], [114.845, 30.020]] },
      { id: 'R5', name: '大冶湖枢纽—花湖机场（干线）', type: 'trunk', km: 32.0, band: '300–600m', sorties: 3, path: [[115.010, 30.020], [115.075, 30.075], [115.150, 30.120]] },
      { id: 'R6', name: '刘仁八—城区农产品外运', type: 'farm', km: 18.0, band: '150–250m', sorties: 2, path: [[114.800, 29.975], [114.870, 30.040], [114.974, 30.098]] }
    ],
    drones: [
      { id: 'DY-UAV-01', model: 'M350', task: '电力巡检', route: 'R4', alt: 186, spd: 42, bat: 76, sig: 4, t: 0.70, dir: 1 },
      { id: 'DY-UAV-03', model: 'M30T', task: '应急巡查', route: 'R2', alt: 120, spd: 38, bat: 64, sig: 3, t: 0.58, dir: -1 },
      { id: 'DY-UAV-07', model: '方舟40', task: '医疗转运', route: 'R1', alt: 240, spd: 62, bat: 18, sig: 4, t: 0.42, dir: 1 },
      { id: 'DY-UAV-12', model: 'M30T', task: '航拍测绘', route: 'R3', alt: 300, spd: 45, bat: 58, sig: 1, t: 0.52, dir: 1 },
      { id: 'DY-UAV-15', model: '方舟40', task: '商业配送', route: 'R2', alt: 150, spd: 55, bat: 82, sig: 4, t: 0.16, dir: 1 },
      { id: 'DY-UAV-21', model: 'M350', task: '农产品外运', route: 'R6', alt: 210, spd: 48, bat: 71, sig: 3, t: 0.38, dir: 1 }
    ],
    alerts: [
      { id: 'A1', time: '09:42', level: 'high', obj: 'DY-UAV-07', msg: '电量 18%，建议就近降落铜绿山起降场', status: '处置中', lon: 114.884, lat: 30.062 },
      { id: 'A2', time: '09:36', level: 'high', obj: 'DY-UAV-12', msg: '信号丢失 3s，链路重连中', status: '已恢复', lon: 114.898, lat: 30.026 },
      { id: 'A3', time: '09:28', level: 'mid', obj: 'DY-UAV-03', msg: '偏航 120m，超出航线阈值', status: '处置中', lon: 115.004, lat: 30.044 },
      { id: 'A4', time: '09:15', level: 'mid', obj: 'H8 灵乡镇驿站', msg: '充电桩故障，2 号桩离线', status: '待派单', lon: 114.775, lat: 30.080 },
      { id: 'A5', time: '09:02', level: 'low', obj: 'DY-UAV-19', msg: '设备离线，心跳超时 90s', status: '已关闭', lon: null, lat: null }
    ],
    towns: [
      { name: '大冶城区', lon: 114.974, lat: 30.112, big: true },
      { name: '铜绿山', lon: 114.932, lat: 30.046 },
      { name: '大冶湖', lon: 115.038, lat: 30.008 },
      { name: '保安镇', lon: 114.868, lat: 30.215 },
      { name: '还地桥', lon: 114.822, lat: 30.268 },
      { name: '陈贵镇', lon: 114.842, lat: 30.006 },
      { name: '灵乡镇', lon: 114.762, lat: 30.072 },
      { name: '刘仁八', lon: 114.798, lat: 29.962 },
      { name: '金牛镇', lon: 114.742, lat: 30.030 },
      { name: '茗山', lon: 114.900, lat: 30.148 },
      { name: '花湖机场方向', lon: 115.168, lat: 30.135, outer: true }
    ]
  };
  const TASK_NAME = { medical: '医疗转运', commercial: '商业配送', scenic: '景区观光', industrial: '工业急件', trunk: '干线货运', farm: '农产品外运' };
  const C = {
    bg: '#E9F3FC', grid: 'rgba(46,127,205,.055)', bound: 'rgba(30,136,229,.42)',
    phos: '#1E88E5', blue: '#4FA3E8', amber: '#F0A030', red: '#E5574B', green: '#35A86F',
    ink: '#1E3A5F', dim: '#7E96B4', ink2: '#46628A'
  };
  const ROUTE_COLOR = { medical: C.phos, commercial: C.blue, scenic: C.amber, industrial: '#F0A030', trunk: '#1E88E5', farm: '#35A86F' };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ========== 2. 投影与几何 ========== */
  const GEO = window.GEO_RING || [];
  const _lons = GEO.map(p => p[0]), _lats = GEO.map(p => p[1]);
  const LON0 = Math.min.apply(null, _lons), LON1 = Math.max.apply(null, _lons);
  const LAT0 = Math.min.apply(null, _lats), LAT1 = Math.max.apply(null, _lats);
  const KX = Math.cos(((LAT0 + LAT1) / 2) * Math.PI / 180);
  const UW = (LON1 - LON0) * KX, UH = (LAT1 - LAT0);
  const toU = (lon, lat) => ({ x: (lon - LON0) * KX, y: (LAT1 - lat) });
  const RING_U = GEO.map(p => toU(p[0], p[1]));

  function chaikin(ptsU, iter) {
    let p = ptsU;
    for (let k = 0; k < (iter == null ? 2 : iter); k++) {
      const q = [];
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i + 1];
        q.push({ x: a.x * .75 + b.x * .25, y: a.y * .75 + b.y * .25 });
        q.push({ x: a.x * .25 + b.x * .75, y: a.y * .25 + b.y * .75 });
      }
      p = q;
    }
    return p;
  }
  function pathLen(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return L;
  }
  function pointAt(pts, t) {
    const total = pathLen(pts);
    let d = Math.max(0, Math.min(1, t)) * total;
    for (let i = 1; i < pts.length; i++) {
      const s = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (d <= s) {
        const r = s ? d / s : 0;
        return {
          x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * r,
          y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * r,
          ang: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x)
        };
      }
      d -= s;
    }
    const last = pts[pts.length - 1];
    return { x: last.x, y: last.y, ang: 0 };
  }
  function circleU(lon, lat, km) {
    const r = km / 111.32, c = toU(lon, lat), pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = i / 48 * Math.PI * 2;
      pts.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
    }
    return pts;
  }

  /* ========== 3. 状态 ========== */
  const state = {
    layers: { air: true, route: true, port: true, target: true, event: true, place: true },
    cam: { x: UW / 2, y: UH / 2, z: 1 },
    camAnim: null,
    hover: null,
    selected: null,
    hits: [],
    mode: 'watch',
    reportClean: false,
    demo: { i: 0, playing: false, t0: 0, tick: null },
    injected: false
  };
  const canvas = $('#mapCanvas'), ctx = canvas.getContext('2d');
  let W = 1132, H = 850, BASE = 1;
  const ROUTE_PTS = {};
  DATA.routes.forEach(r => { ROUTE_PTS[r.id] = chaikin(r.path.map(p => toU(p[0], p[1])), 3); });

  function fit() {
    BASE = Math.min(W / UW, H / UH) * 0.92;
  }
  const S = u => ({ x: W / 2 + (u.x - state.cam.x) * BASE * state.cam.z, y: H / 2 + (u.y - state.cam.y) * BASE * state.cam.z });
  const SU = (sx, sy) => ({ x: (sx - W / 2) / (BASE * state.cam.z) + state.cam.x, y: (sy - H / 2) / (BASE * state.cam.z) + state.cam.y });

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || 1132; H = canvas.clientHeight || 850;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
  }

  /* ========== 4. 地图绘制 ========== */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    drawGraticule();
    drawAir();
    drawBoundary();
    drawRoutes();
    drawPorts();
    drawEvents();
    drawTargets();
    drawTowns();
    if (state.hover) drawHover();
  }
  function screenPath(pts, close) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const s = S(pts[i]);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    }
    if (close) ctx.closePath();
  }
  function drawGraticule() {
    ctx.save();
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
    for (let lon = 114.6; lon <= 115.2; lon += 0.1) {
      const a = S(toU(lon, LAT0)), b = S(toU(lon, LAT1));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let lat = 29.9; lat <= 30.35; lat += 0.1) {
      const a = S(toU(LON0, lat)), b = S(toU(LON1, lat));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(126,150,180,.55)'; ctx.font = '9px "SF Mono",Menlo,monospace';
    for (let lon = 114.6; lon <= 115.2; lon += 0.2) {
      const p = S(toU(lon, LAT0));
      if (p.x > 6 && p.x < W - 40) ctx.fillText(lon.toFixed(1) + '°E', p.x + 3, H - 8);
    }
    for (let lat = 29.9; lat <= 30.35; lat += 0.1) {
      const p = S(toU(LON0, lat));
      if (p.y > 20 && p.y < H - 20) ctx.fillText(lat.toFixed(1) + '°N', 6, p.y - 3);
    }
    ctx.restore();
  }
  function drawBoundary() {
    ctx.save();
    screenPath(RING_U, true);
    ctx.fillStyle = 'rgba(30,136,229,.055)'; ctx.fill();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(30,136,229,.16)'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.strokeStyle = C.bound; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.restore();
    drawInnerGrid();
  }
  // 空域网格：市域内 2km 级网格，作为「空域网格层」的视觉底
  function drawInnerGrid() {
    if (!state.layers.air) return;
    ctx.save();
    screenPath(RING_U, true); ctx.clip();
    ctx.strokeStyle = 'rgba(30,136,229,.055)'; ctx.lineWidth = 1;
    for (let lon = Math.ceil(LON0 * 50) / 50; lon < LON1; lon += 0.02) {
      const a = S(toU(lon, LAT0)), b = S(toU(lon, LAT1));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let lat = Math.ceil(LAT0 * 50) / 50; lat < LAT1; lat += 0.02) {
      const a = S(toU(LON0, lat)), b = S(toU(LON1, lat));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }
  function drawAir() {
    if (!state.layers.air) return;
    ctx.save();
    // 适飞区：整域淡绿
    screenPath(RING_U, true);
    ctx.fillStyle = 'rgba(53,168,111,.10)'; ctx.fill();
    // 限飞：城区环 + 遗址
    [circleU(114.974, 30.098, 5.2), circleU(114.945, 30.050, 2.0)].forEach(pts => {
      screenPath(pts, true);
      ctx.fillStyle = 'rgba(240,160,48,.14)'; ctx.fill();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(240,160,48,.70)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.setLineDash([]);
    });
    // 禁飞：核心 + 机场净空
    [circleU(114.986, 30.101, 1.8), circleU(115.150, 30.126, 2.1)].forEach(pts => {
      screenPath(pts, true);
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(229,87,75,.22)'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(229,87,75,.22)'; ctx.lineWidth = 1;
      for (let i = -H; i < W + H; i += 7) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
      }
      ctx.restore();
      screenPath(pts, true);
      ctx.strokeStyle = 'rgba(229,87,75,.85)'; ctx.lineWidth = 1.1; ctx.stroke();
    });
    ctx.restore();
  }
  function drawRoutes() {
    if (!state.layers.route) return;
    ctx.save();
    DATA.routes.forEach(r => {
      const pts = ROUTE_PTS[r.id], col = ROUTE_COLOR[r.type] || C.phos;
      const glow = r.type === 'trunk' ? 0.20 : 0.13;
      screenPath(pts, false);
      ctx.strokeStyle = hexA(col, glow); ctx.lineWidth = r.type === 'trunk' ? 7 : 5; ctx.stroke();
      screenPath(pts, false);
      ctx.strokeStyle = col; ctx.lineWidth = r.type === 'trunk' ? 2 : 1.4;
      ctx.globalAlpha = r.type === 'trunk' ? .9 : .72; ctx.stroke(); ctx.globalAlpha = 1;
      // 流动虚线
      ctx.save();
      screenPath(pts, false);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1;
      ctx.setLineDash([7, 26]); ctx.lineDashOffset = -(perfT / 1000 * 14) % 33;
      ctx.globalAlpha = .55; ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
  function drawPorts() {
    if (!state.layers.port) return;
    ctx.save();
    DATA.ports.forEach(p => {
      const s = S(toU(p.lon, p.lat));
      const isHub = p.level === 2, r = isHub ? 9 : 5.5;
      const st = p.status === 'alert' ? C.red : p.status === 'idle' ? '#8CA6C4' : C.phos;
      if (isHub) {
        ctx.beginPath(); ctx.arc(s.x, s.y, 14, 0, 7);
        ctx.fillStyle = 'rgba(30,136,229,.10)'; ctx.fill();
        ctx.strokeStyle = 'rgba(30,136,229,.35)'; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7);
      ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.strokeStyle = st; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, 7); ctx.fillStyle = st; ctx.fill();
      if (state.cam.z > 1.35 || isHub) {
        ctx.font = '10.5px "PingFang SC",sans-serif';
        const tw = ctx.measureText(p.name.replace('起降场', '').replace('二级枢纽', '枢纽')).width;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(s.x + r + 4, s.y - 6, tw + 6, isHub ? 24 : 15);
        ctx.fillStyle = 'rgba(30,58,95,.82)';
        ctx.textAlign = 'left';
        ctx.fillText(p.name.replace('起降场', '').replace('二级枢纽', '枢纽'), s.x + r + 6, s.y + 3.5);
        if (isHub) {
          ctx.font = '9px "SF Mono",monospace'; ctx.fillStyle = 'rgba(70,98,138,.75)';
          ctx.fillText('机位 ' + p.pads + ' · 桩 ' + p.charge, s.x + r + 6, s.y + 15);
        }
        ctx.textAlign = 'left';
      }
      state.hits.push({ type: 'port', id: p.id, x: s.x, y: s.y, r: 12 });
    });
    ctx.restore();
  }
  function drawTargets() {
    if (!state.layers.target) return;
    ctx.save();
    const items = [];
    DATA.drones.forEach((d, idx) => {
      const route = ROUTE_PTS[d.route]; if (!route) return;
      const p = pointAt(route, d.t), s = S(p);
      // 尾迹
      if (d.trail && d.trail.length > 1) {
        for (let i = 1; i < d.trail.length; i++) {
          const a = d.trail[i - 1], b = d.trail[i];
          const sa = S(a), sb = S(b);
          const al = i / d.trail.length;
          ctx.strokeStyle = hexA(C.phos, 0.28 * al);
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(sa.x, sa.y); ctx.lineTo(sb.x, sb.y); ctx.stroke();
        }
      }
      const hi = state.selected === d.id || state.hover === d.id;
      ctx.save(); ctx.translate(s.x, s.y);
      if (hi) {
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7);
        ctx.strokeStyle = 'rgba(30,136,229,.55)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7);
        ctx.strokeStyle = 'rgba(30,136,229,.25)'; ctx.stroke();
      }
      ctx.rotate(p.ang + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(5.4, 6); ctx.lineTo(0, 3.4); ctx.lineTo(-5.4, 6); ctx.closePath();
      ctx.fillStyle = d.bat < 25 ? C.amber : C.phos; ctx.fill();
      ctx.strokeStyle = '#C7DDF2'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      state.hits.push({ type: 'drone', id: d.id, x: s.x, y: s.y, r: 15 });
      items.push({ sx: s.x, sy: s.y, id: d.id, sub: d.alt + 'm · ' + d.spd + 'km/h', hi: hi });
    });
    // 标签排布：按锚点纵向顺序打包成一列，保证互不压盖（类似空管数据牌）
    const BW = 86, BH = 25;
    items.forEach(it => { it.bx = it.sx + 15; it.by = it.sy - 12; it.w = BW; it.h = BH; });
    items.sort((a, b) => a.sy - b.sy);
    let lastBottom = -1e9;
    items.forEach(it => {
      it.by = Math.max(it.sy - 12, lastBottom + 4);
      lastBottom = it.by + it.h;
    });
    const spill = lastBottom - (H - 18);
    if (spill > 0) items.forEach(it => { it.by -= spill; });
    items.forEach(it => {
      it.by = Math.max(12, it.by);
      it.bx = Math.max(80, Math.min(W - BW - 6, it.bx));
    });
    items.forEach(it => {
      const ax = it.sx + 7, ay = it.sy - 1;
      const px = ax < it.bx ? it.bx - 2 : (ax > it.bx + it.w ? it.bx + it.w : ax);
      const py = ay < it.by ? it.by : (ay > it.by + it.h ? it.by + it.h : ay);
      ctx.strokeStyle = it.hi ? 'rgba(30,136,229,.8)' : 'rgba(30,58,95,.26)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px, py); ctx.stroke();
      // 数据牌：深底 + 左侧语义竖条，叠在航线/底图上仍可读
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(it.bx - 3, it.by, it.w, it.h - 2);
      ctx.fillStyle = it.hi ? C.phos : 'rgba(30,136,229,.55)';
      ctx.fillRect(it.bx - 3, it.by, 2, it.h - 2);
      ctx.font = '10px "SF Mono",monospace';
      ctx.fillStyle = it.hi ? '#FFFFFF' : 'rgba(30,58,95,.94)';
      ctx.textAlign = 'left';
      ctx.fillText(it.id, it.bx + 3, it.by + 10);
      ctx.font = '8.5px "SF Mono",monospace'; ctx.fillStyle = 'rgba(70,98,138,.82)';
      ctx.fillText(it.sub, it.bx + 3, it.by + 20);
    });
    ctx.restore();
  }
  function drawEvents() {
    if (!state.layers.event) return;
    ctx.save();
    const now = perfT;
    DATA.alerts.forEach((a, i) => {
      if (a.lon == null) return;
      const s = S(toU(a.lon, a.lat));
      const col = a.level === 'high' ? C.red : a.level === 'mid' ? C.amber : '#8CA6C4';
      const maxR = a.level === 'high' ? 26 : 18;
      const ph = (now / 1600 + i * 0.22) % 1;
      for (let k = 0; k < 2; k++) {
        const t = (ph + k * 0.5) % 1;
        ctx.beginPath(); ctx.arc(s.x, s.y, 5 + t * maxR, 0, 7);
        ctx.strokeStyle = hexA(col, (1 - t) * 0.55); ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(s.x, s.y, 3.4, 0, 7);
      ctx.fillStyle = col; ctx.fill();
      if (a.level === 'high') {
        ctx.beginPath(); ctx.arc(s.x, s.y, 7.5, 0, 7);
        ctx.strokeStyle = hexA(col, .75 + Math.sin(now / 700) * .2); ctx.lineWidth = 1; ctx.stroke();
      }
      state.hits.push({ type: 'event', id: a.id, x: s.x, y: s.y, r: 15 });
    });
    ctx.restore();
  }
  function drawTowns() {
    if (!state.layers.place) return;
    ctx.save();
    ctx.textAlign = 'center';
    DATA.towns.forEach(t => {
      const s = S(toU(t.lon, t.lat));
      if (t.big) {
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.6, 0, 7); ctx.fillStyle = 'rgba(30,58,95,.7)'; ctx.fill();
      }
      ctx.font = (t.big ? '11.5px' : '10.5px') + ' "PingFang SC",sans-serif';
      ctx.fillStyle = t.outer ? 'rgba(30,136,229,.55)' : (t.big ? 'rgba(30,58,95,.82)' : 'rgba(70,98,138,.72)');
      ctx.fillText(t.name, s.x, s.y + (t.big ? -8 : -7));
    });
    ctx.textAlign = 'left';
    ctx.restore();
  }
  function drawHover() {
    const h = state.hits.find(x => x.id === state.hover);
    if (!h) return;
    ctx.beginPath(); ctx.arc(h.x, h.y, 16, 0, 7);
    ctx.strokeStyle = 'rgba(30,58,95,.45)'; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
  }
  function hexA(hex, a) {
    const m = hex.replace('#', '');
    const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  let perfT = 0, lastT = 0;
  function loop(t) {
    if (!lastT) lastT = t;
    const dt = Math.min(40, t - lastT); lastT = t; perfT = t;
    state.hits = [];
    // 目标推进
    DATA.drones.forEach(d => {
      const route = ROUTE_PTS[d.route], lenKm = DATA.routes.find(r => r.id === d.route).km;
      const dtSec = dt / 1000;
      d.t += (d.spd / 3600 / lenKm) * dtSec * d.dir;
      if (d.t > 1) { d.t = 1; d.dir = -1; } else if (d.t < 0) { d.t = 0; d.dir = 1; }
      if (!d.trail) d.trail = [];
      if (!d._lastTrail || t - d._lastTrail > 180) {
        d._lastTrail = t; d.trail.push(pointAt(route, d.t));
        if (d.trail.length > 16) d.trail.shift();
      }
    });
    // 告警轻微抖动（模拟遥测）
    if (Math.random() < 0.6) {
      const d = DATA.drones[Math.floor(Math.random() * DATA.drones.length)];
      d.alt = Math.max(60, Math.round(d.alt + (Math.random() - .5) * 2));
    }
    updateCam(dt);
    draw();
    requestAnimationFrame(loop);
  }

  /* ========== 5. 相机 ========== */
  function flyTo(target, ms, z) {
    const from = { x: state.cam.x, y: state.cam.y, z: state.cam.z };
    const to = { x: target.x, y: target.y, z: z == null ? target.z : z };
    state.camAnim = { from, to, t0: performance.now(), ms: ms || 600 };
  }
  function updateCam() {
    const a = state.camAnim; if (!a) return;
    const k = Math.min(1, (performance.now() - a.t0) / a.ms);
    const e = 1 - Math.pow(1 - k, 3);
    state.cam.x = a.from.x + (a.to.x - a.from.x) * e;
    state.cam.y = a.from.y + (a.to.y - a.from.y) * e;
    state.cam.z = a.from.z + (a.to.z - a.from.z) * e;
    if (k >= 1) state.camAnim = null;
  }
  function camTo(lon, lat, z, ms) {
    const u = toU(lon, lat); flyTo({ x: u.x, y: u.y, z: z }, ms);
  }

  /* ========== 6. 面板 ========== */
  function renderKPI() {
    const k = DATA.kpi;
    const strips = [
      { id: 'k1', lab: '今日飞行架次', val: k.sorties.today, unit: '架次', foot: '较昨日同期 ' + k.sorties.yesterday + ' 架次', delta: '+' + k.sorties.delta + '%', refresh: '统计 10min', dcls: 'up', spark: k.sorties.trend, tip: '来源：飞行统计数据 · 按日聚合（跨零点归今日）' },
      { id: 'k2', lab: '在飞目标', val: k.airborne.count, unit: '架', foot: '多旋翼 ' + k.airborne.multi + ' · 复合翼 ' + k.airborne.compound, delta: '点击高亮', dcls: 'flat', spark: null, refresh: '实时 1s', tip: '点击在地图高亮全部在飞目标' },
      { id: 'k3', lab: '设备在线率', val: k.online.rate.toFixed(1), unit: '%', foot: '在线 ' + k.online.online + '/' + k.online.total + ' · 阈值 ' + k.online.threshold + '%', delta: '达标', dcls: 'up', spark: null, refresh: '准实时 30s', tip: '低于阈值转黄；点击查看离线设备明细' },
      { id: 'k4', lab: '安全运行天数', val: k.safe.days, unit: '天', foot: '自 ' + k.safe.since + ' 起连续安全飞行', delta: '累计', dcls: 'flat', spark: null, refresh: '日更', tip: '“安全”= 无等级为「严重」的责任事件' }
    ];
    $('#kpiRow').innerHTML = strips.map(s => {
      const spark = s.spark ? '<div class="spark">' + s.spark.map(v => '<span style="height:' + Math.round(v / Math.max.apply(null, s.spark) * 15 + 1) + 'px"></span>').join('') + '</div>' : '';
      return '<div class="strip" id="' + s.id + '" data-tip="' + s.tip + '">' +
        '<div class="lab"><span>' + s.lab + '</span><em>' + s.refresh + '</em></div>' +
        '<div class="val"><b>' + s.val + '</b><i>' + s.unit + '</i>' + spark + '</div>' +
        '<div class="foot"><span>' + s.foot + '</span><span class="delta ' + s.dcls + '">' + s.delta + '</span></div>' +
        '</div>';
    }).join('');
    $('#k1').addEventListener('click', () => kpiCard('sorties'));
    $('#k2').addEventListener('click', () => { focusAirborne(); flash('#k2'); toast('已在地图高亮 6 架在飞目标'); });
    $('#k3').addEventListener('click', () => openDrill('#k3'));
    $('#k4').addEventListener('click', () => kpiCard('safe'));
    $$('.strip').forEach(el => {
      el.addEventListener('mouseenter', () => { /* 口径提示走底栏，不遮画面 */ });
    });
  }
  function flash(sel) {
    const el = $(sel); if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1200);
  }
  function kpiCard(kind) {
    const k = DATA.kpi;
    if (kind === 'sorties') {
      showDetailAt('#k1', {
        title: '今日飞行架次', who: k.sorties.today + ' 架次',
        rows: [['较昨日同期', '+' + k.sorties.delta + '%（' + k.sorties.yesterday + '）'], ['近 7 日', k.sorties.trend.join(' / ')], ['统计口径', '飞行统计数据 · 按日聚合'], ['刷新频率', '准实时 30s / 统计 10min']],
        actions: ['关闭']
      });
    } else {
      showDetailAt('#k4', {
        title: '安全运行天数', who: k.safe.days + ' 天',
        rows: [['起算日期', k.safe.since], ['判定规则', '无「严重」等级责任事件'], ['数据来源', '事件流 + 飞行执行记录']],
        actions: ['关闭']
      });
    }
  }
  function renderLinks() {
    $('#linkBox').innerHTML = DATA.links.map(l =>
      '<span class="link"><span class="dot ' + (l.state === 'ok' ? '' : 'warn') + '"></span>' + l.name + '</span>'
    ).join('');
  }
  function renderFleet() {
    const total = DATA.fleet.reduce((a, b) => a + b.value, 0);
    $('#fleetLegend').innerHTML = DATA.fleet.map(f =>
      '<div class="fleg" data-key="' + f.key + '" style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:#46628A">' +
      '<i style="width:7px;height:7px;background:' + f.color + ';display:inline-block"></i>' +
      '<span style="flex:1">' + f.name + '</span>' +
      '<b class="num" style="font-size:14px;color:#1E3A5F">' + f.value + '</b>' +
      '<span class="num" style="font-size:10px;color:#7E96B4;width:34px;text-align:right">' + (f.value / total * 100).toFixed(1) + '%</span>' +
      '</div>'
    ).join('');
    const box = $('#fleetChart');
    if (window.echarts) {
      const ch = echarts.init(box, null, { renderer: 'canvas' });
      ch.setOption({
        backgroundColor: 'transparent',
        animationDuration: 600,
        series: [{
          type: 'pie', radius: ['62%', '88%'], center: ['50%', '52%'], avoidLabelOverlap: false,
          itemStyle: { borderColor: '#FFFFFF', borderWidth: 2 },
          label: { show: false }, labelLine: { show: false },
          emphasis: { scale: true, scaleSize: 4, itemStyle: { borderWidth: 2 } },
          data: DATA.fleet.map(f => ({ value: f.value, name: f.name, itemStyle: { color: f.color } }))
        }],
        graphic: [{ type: 'text', left: 'center', top: '46%', style: { text: '在册', fill: '#7E96B4', font: '10px "PingFang SC"' } },
        { type: 'text', left: 'center', top: '53%', style: { text: total + ' 架', fill: '#1E3A5F', font: '600 17px "SF Mono"' } }]
      });
      ch.on('mouseover', p => { p.seriesIndex === 0 && highlightFleet(p.name); });
      state.fleetChart = ch;
    } else {
      fallbackDonut(box, DATA.fleet, 26);
    }
    $$('.fleg').forEach(el => el.addEventListener('mouseenter', () => highlightFleet(DATA.fleet.find(f => f.key === el.dataset.key).name)));
  }
  function highlightFleet(name) {
    const ch = state.fleetChart; if (!ch) return;
    ch.dispatchAction({ type: 'downplay', seriesIndex: 0 });
    ch.dispatchAction({ type: 'highlight', seriesIndex: 0, name: name });
  }
  function renderHealth() {
    const k = DATA.kpi.online, f = DATA.fleet;
    $('#healthBody').innerHTML =
      '<div style="display:flex;gap:2px;margin-bottom:10px">' +
      f.map(x => '<div style="flex:' + x.value + ';height:6px;background:' + x.color + ';opacity:.85"></div>').join('') + '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:#46628A">' +
      f.map(x => '<span>' + x.name + ' <b class="num" style="color:#1E3A5F">' + x.value + '</b></span>').join('') + '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px dashed rgba(46,127,205,.14)">' +
      '<div><span style="font-size:10.5px;color:#7E96B4">平均电量</span><br><b class="num" style="font-size:16px;color:#1E3A5F">68</b><span style="font-size:10px;color:#7E96B4">%</span></div>' +
      '<div><span style="font-size:10.5px;color:#7E96B4">在线率</span><br><b class="num" style="font-size:16px;color:' + (k.rate >= k.threshold ? '#1E88E5' : '#F0A030') + '">' + k.rate.toFixed(1) + '</b><span style="font-size:10px;color:#7E96B4">%</span></div>' +
      '<div><span style="font-size:10.5px;color:#7E96B4">今日告警</span><br><b class="num" style="font-size:16px;color:#F0A030">5</b><span style="font-size:10px;color:#7E96B4">条</span></div>' +
      '</div>';
  }
  function renderAlerts() {
    $('#alertList').innerHTML = DATA.alerts.slice(0, 5).map(a =>
      '<div class="arow" data-id="' + a.id + '" style="display:flex;align-items:flex-start;gap:9px;padding:9px 12px;border-bottom:1px solid rgba(46,127,205,.10);cursor:pointer;' + (a.level === 'high' ? 'background:rgba(229,87,75,.05);' : '') + '">' +
      '<span class="num" style="font-size:10px;color:#7E96B4;padding-top:2px;width:34px;flex:0 0 auto">' + a.time + '</span>' +
      '<span style="font-size:10px;padding:1px 4px;border:1px solid ' + (a.level === 'high' ? '#E5574B' : a.level === 'mid' ? '#F0A030' : '#8CA6C4') + ';color:' + (a.level === 'high' ? '#E5574B' : a.level === 'mid' ? '#C77A12' : '#8CA6C4') + ';flex:0 0 auto">' + (a.level === 'high' ? '高' : a.level === 'mid' ? '中' : '低') + '</span>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:11.5px;color:#1E3A5F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + a.obj + '</div>' +
      '<div style="font-size:11px;color:#8CA6C4;line-height:1.45;margin-top:2px">' + a.msg + '</div>' +
      '</div>' +
      '<span style="font-size:10px;color:#7E96B4;white-space:nowrap;padding-top:2px">' + a.status + '</span>' +
      '</div>'
    ).join('');
    $$('.arow').forEach(el => el.addEventListener('click', () => {
      const a = DATA.alerts.find(x => x.id === el.dataset.id);
      if (a.lon != null) {
        const s2 = S(toU(a.lon, a.lat));
        camTo(a.lon, a.lat, Math.max(state.cam.z, 1.6), 600);
        eventCard(a, s2.x, s2.y);
      } else {
        eventCard(a, 40, 60);
      }
    }));
    $('#alertCount').textContent = '最近 ' + Math.min(5, DATA.alerts.length) + ' 条 · 实时推送';
  }
  function renderTrend() {
    const box = $('#trendChart'), d = DATA.trend;
    if (!window.echarts) { fallbackLine(box, d); return; }
    const ch = echarts.init(box, null, { renderer: 'canvas' });
    ch.setOption({
      backgroundColor: 'transparent',
      animationDuration: 500,
      grid: { left: 34, right: 14, top: 26, bottom: 20 },
      xAxis: {
        type: 'category', data: d.hours, boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(46,127,205,.25)' } },
        axisTick: { show: false },
        axisLabel: { color: '#7E96B4', fontSize: 10, fontFamily: 'SF Mono', interval: 1, formatter: v => v + ':00' }
      },
      yAxis: {
        type: 'value', min: 0, max: 8, interval: 2,
        splitLine: { lineStyle: { color: 'rgba(46,127,205,.10)' } },
        axisLabel: { color: '#7E96B4', fontSize: 10, fontFamily: 'SF Mono' },
        axisLine: { show: false }, axisTick: { show: false }
      },
      tooltip: {
        trigger: 'axis', confine: true, backgroundColor: '#FFFFFF', borderColor: 'rgba(46,127,205,.3)',
        textStyle: { color: '#1E3A5F', fontSize: 11 }, axisPointer: { lineStyle: { color: 'rgba(30,136,229,.4)' } },
        formatter: ps => ps[0].axisValue + ':00<br>' + ps.map(p => p.marker + p.seriesName + ' <b>' + p.value + '</b> 架次').join('<br>')
      },
      series: [
        { name: '昨日同期', type: 'line', data: d.yday, smooth: .3, symbol: 'none', lineStyle: { color: 'rgba(70,98,138,.55)', width: 1, type: [4, 4] } },
        {
          name: '今日', type: 'line', data: d.today, smooth: .3, symbol: 'circle', symbolSize: 3.5, showSymbol: false,
          lineStyle: { color: C.phos, width: 1.8, shadowColor: 'rgba(30,136,229,.35)', shadowBlur: 8 },
          itemStyle: { color: C.phos },
          areaStyle: { color: 'rgba(30,136,229,.10)' },
          markPoint: {
            symbol: 'circle', symbolSize: 6, itemStyle: { color: C.amber, borderColor: '#FFFFFF', borderWidth: 1 },
            label: { show: true, position: 'top', distance: 6, color: '#1E3A5F', fontSize: 10, fontFamily: 'SF Mono', formatter: '峰值 {c}' },
            data: [{ type: 'max', name: '峰值' }]
          }
        }
      ],
      legend: { show: false }
    });
    // 图例直接写在末端，避免来回找
    ch.setOption({ graphic: [
      { type: 'text', right: 8, top: 6, style: { text: '—— 今日', fill: '#1E88E5', font: '10px "PingFang SC"' } },
      { type: 'text', right: 60, top: 6, style: { text: '—— 昨日同期', fill: '#46628A', font: '10px "PingFang SC"' } }
    ] });
    state.trendChart = ch;
  }
  function renderTasks() {
    const total = DATA.tasks.reduce((a, b) => a + b.value, 0);
    const max = Math.max.apply(null, DATA.tasks.map(t => t.value));
    $('#taskBody').innerHTML = DATA.tasks.map((t, i) => {
      const pct = (t.value / total * 100).toFixed(0);
      return '<div style="margin-bottom:13px">' +
        '<div style="display:flex;align-items:baseline;justify-content:space-between;font-size:11.5px;margin-bottom:5px">' +
        '<span style="color:#1E3A5F">' + t.name + '</span>' +
        '<span><b class="num" style="font-size:13px;color:#1E3A5F">' + t.value + '</b><span style="color:#7E96B4;font-size:10px"> 架次 · ' + pct + '%</span></span>' +
        '</div>' +
        '<div style="height:5px;background:rgba(46,127,205,.12)"><div style="height:100%;width:' + (t.value / max * 100) + '%;background:' + (i === 0 ? '#1E88E5' : i === 1 ? '#4FA3E8' : i === 2 ? '#F0A030' : '#8CA6C4') + ';opacity:.85"></div></div>' +
        '</div>';
    }).join('') +
      '<div style="font-size:10px;color:#7E96B4;margin-top:-2px">合计 ' + total + ' 架次 · 来源：飞行统计（任务类型字段）</div>';
  }
  function renderAir() {
    const a = DATA.airspace;
    const routes = DATA.routes.slice().sort((x, y) => y.sorties - x.sorties).slice(0, 3);
    $('#airBody').innerHTML =
      '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#7E96B4;margin-bottom:6px"><span>空域面积构成</span><span>合计 1,566 km²</span></div>' +
      '<div style="display:flex;height:9px;margin-bottom:9px">' +
      a.map(x => '<div style="width:' + x.pct + '%;background:' + x.line + ';opacity:.55"></div>').join('') +
      '</div>' +
      '<div style="display:flex;gap:12px;font-size:10.5px;color:#46628A;margin-bottom:14px">' +
      a.map(x => '<span style="display:flex;align-items:center;gap:5px"><i style="width:7px;height:7px;background:' + x.line + ';display:inline-block"></i>' + x.name + ' <b class="num" style="color:#1E3A5F">' + x.area + '</b><span style="color:#7E96B4">km²</span></span>').join('') +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#7E96B4;margin-bottom:8px;padding-top:10px;border-top:1px dashed rgba(46,127,205,.14)"><span>航线运行 TOP3（今日架次）</span><span>共 6 条</span></div>' +
      routes.map(r => '<div style="margin-bottom:11px">' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">' +
        '<span style="color:#1E3A5F">' + r.id + ' · ' + TASK_NAME[r.type] + '</span>' +
        '<b class="num" style="color:#1E3A5F">' + r.sorties + '</b></div>' +
        '<div style="height:4px;background:rgba(46,127,205,.12)"><div style="height:100%;width:' + (r.sorties / 12 * 100) + '%;background:' + ROUTE_COLOR[r.type] + ';opacity:.8"></div></div>' +
        '<div style="font-size:10px;color:#7E96B4;margin-top:3px">' + r.name + ' · ' + r.km + 'km · ' + r.band + '</div>' +
        '</div>').join('');
  }
  function renderTicker() {
    const items = DATA.alerts.map(a =>
      '<span class="tk-item ' + a.level + '"><b>' + a.time + '</b>' +
      '<span class="lv">' + (a.level === 'high' ? '高' : a.level === 'mid' ? '中' : '低') + '</span>' +
      a.obj + ' · ' + a.msg + '<span style="color:#7E96B4">｜' + a.status + '</span></span>'
    ).join('');
    $('#tickerTrack').innerHTML = items + items;
  }
  function renderPlatform() {
    const p = DATA.platform;
    $('#platformBox').innerHTML =
      '<div class="cell"><span>市级空域平台</span><b class="ok">' + p.city + '</b></div>' +
      '<div class="cell"><span>今日数据同步</span><b>' + p.sync.toLocaleString() + ' 条</b></div>' +
      '<div class="cell"><span>接口调用</span><b>' + p.calls.toLocaleString() + ' 次</b></div>' +
      '<div class="cell"><span>最近同步</span><b>' + p.last + '</b></div>';
  }
  function renderLayers() {
    const cfg = [['air', '空域网格'], ['route', '航线'], ['port', '起降场'], ['target', '实时目标'], ['event', '事件'], ['place', '地名']];
    $('#layerBox').innerHTML = cfg.map(([k, n]) =>
      '<label class="lyr" for="ly_' + k + '"><input type="checkbox" id="ly_' + k + '"' + (state.layers[k] ? ' checked' : '') + ' data-layer="' + k + '">' + n + '</label>'
    ).join('');
    $$('#layerBox input').forEach(inp => inp.addEventListener('change', () => {
      state.layers[inp.dataset.layer] = inp.checked;
      inp.closest('.lyr').classList.toggle('off', !inp.checked);
    }));
    $('#layerAll').addEventListener('click', () => {
      const anyOff = cfg.some(([k]) => !state.layers[k]);
      cfg.forEach(([k]) => state.layers[k] = anyOff);
      $$('#layerBox input').forEach(i => { i.checked = anyOff; i.closest('.lyr').classList.toggle('off', !anyOff); });
      toast(anyOff ? '已开启全部图层' : '已关闭全部图层');
    });
  }

  /* ========== 7. 详情卡 / 下钻 ========== */
  function showDetailAt(anchor, cfg) {
    const el = $('#detail'), a = typeof anchor === 'string' ? $(anchor) : anchor;
    const r = a.getBoundingClientRect(), sr = $('#stage').getBoundingClientRect();
    el.innerHTML = '<div class="dh"><span class="who">' + cfg.who + '</span><span style="color:#7E96B4;font-size:11px">' + cfg.title + '</span><button class="close" aria-label="关闭">×</button></div>' +
      '<dl class="db">' + cfg.rows.map(([k, v]) => '<dt>' + k + '</dt><dd>' + v + '</dd>').join('') + '</dl>' +
      '<div class="df"><button class="dclose">关闭</button></div>';
    const left = Math.min(1892 - 306, Math.max(8, (r.left - sr.left) / scaleFactor() - 120));
    const top = Math.min(1000 - 180, (r.bottom - sr.top) / scaleFactor() + 8);
    el.style.left = left + 'px'; el.style.top = top + 'px'; el.style.display = 'block';
    el.querySelector('.close').onclick = hideDetail;
    el.querySelector('.dclose').onclick = hideDetail;
  }
  function showMapCard(x, y, cfg) {
    const el = $('#detail');
    el.innerHTML = '<div class="dh"><span class="who">' + cfg.who + '</span><span style="color:#7E96B4;font-size:11px">' + cfg.title + '</span><button class="close" aria-label="关闭">×</button></div>' +
      '<dl class="db">' + cfg.rows.map(([k, v, cls]) => '<dt>' + k + '</dt><dd' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</dd>').join('') + '</dl>' +
      '<div class="df">' + (cfg.actions || ['关闭']).map((t, i) => '<button data-act="' + i + '">' + t + '</button>').join('') + '</div>';
    const w = $('#mapWrap').getBoundingClientRect(), sr = $('#stage').getBoundingClientRect();
    let left = (w.left - sr.left) / scaleFactor() + x + 18;
    let top = (w.top - sr.top) / scaleFactor() + y - 10;
    if (left > 1892 - 320) left -= 340;
    if (top > 1000 - 260) top -= 200;
    el.style.left = left + 'px'; el.style.top = top + 'px'; el.style.display = 'block';
    el.querySelector('.close').onclick = hideDetail;
    $$('.detail .df button', el).forEach((b, i) => b.onclick = () => {
      if (cfg.onAction) cfg.onAction(i); else hideDetail();
    });
  }
  function hideDetail() { $('#detail').style.display = 'none'; }
  const scaleFactor = () => {
    const s = $('#stage').getBoundingClientRect().width / 1920;
    return s || 1;
  };
  function openDrill(anchor) {
    const el = $('#drill'), a = typeof anchor === 'string' ? $(anchor) : anchor;
    const r = a.getBoundingClientRect(), sr = $('#stage').getBoundingClientRect();
    el.innerHTML = '<div class="dh">设备在线率下钻 <span class="num" style="margin-left:8px;color:#1E88E5">24/26</span><button class="close" aria-label="关闭">×</button></div>' +
      '<div class="db">' +
      '<div class="row"><span>DY-UAV-19</span><b style="color:#E5574B">离线 · 心跳超时 90s</b></div>' +
      '<div class="row"><span>DY-UAV-22</span><b style="color:#E5574B">离线 · 2h 12m</b></div>' +
      '<div class="row"><span>H8 灵乡镇驿站</span><b style="color:#F0A030">充电桩 2 号故障</b></div>' +
      '<div class="note">口径：在线 = 飞行中 + 空闲待命；离线超过 60s 判定。阈值 90%，当前 92.3% 达标。</div>' +
      '</div>';
    const left = Math.min(1892 - 340, Math.max(8, (r.left - sr.left) / scaleFactor() - 12));
    el.style.left = left + 'px'; el.style.top = (r.bottom - sr.top) / scaleFactor() + 8 + 'px'; el.style.display = 'block';
    el.querySelector('.close').onclick = () => { el.style.display = 'none'; };
  }
  function droneCard(d, x, y) {
    const r = DATA.routes.find(x => x.id === d.route);
    state.selected = d.id;
    showMapCard(x, y, {
      who: d.id, title: '实时目标',
      rows: [
        ['机型', d.model], ['任务', d.task, 'txt'], ['航线', d.route + ' · ' + r.name, 'txt'],
        ['高度', d.alt + ' m'], ['速度', d.spd + ' km/h'], ['电量', d.bat + ' %'],
        ['信号', d.sig + ' / 4'], ['回传', '1 Hz · MQTT'], ['状态', d.bat < 25 ? '低电量告警' : '飞行中', 'txt']
      ],
      actions: ['查看轨迹', '关闭'],
      onAction: i => { if (i === 0) { d.trail = []; toast('已开始回放 ' + d.id + ' 近 60 秒轨迹'); } hideDetail(); }
    });
  }
  function portCard(p, x, y) {
    showMapCard(x, y, {
      who: p.id, title: p.level === 2 ? '二级枢纽' : '三级起降场',
      rows: [
        ['名称', p.name, 'txt'], ['类型', TASK_NAME[p.type] || (p.type === 'hub' ? '综合枢纽' : '物流驿站'), 'txt'],
        ['机位', p.pads + ' 个'], ['充电桩', p.charge],
        ['状态', p.status === 'alert' ? '充电桩故障' : p.status === 'idle' ? '空闲' : '正常', 'txt'],
        ['关联航线', DATA.routes.filter(r => r.path.some(pt => pt[0] === p.lon)).map(r => r.id).join(' / ') || '—', 'txt']
      ],
      actions: ['地图定位', '关闭'],
      onAction: i => { if (i === 0) camTo(p.lon, p.lat, 2.6, 600); hideDetail(); }
    });
  }
  function eventCard(a, x, y) {
    showMapCard(x, y, {
      who: a.obj, title: '事件详情', rows: [
        ['时间', a.time], ['级别', a.level === 'high' ? '高' : a.level === 'mid' ? '中' : '低', 'txt'],
        ['内容', a.msg, 'txt'], ['处置', a.status, 'txt'],
        ['建议', a.level === 'high' ? '就近降落并通知机主' : '派单运维核查', 'txt']
      ],
      actions: ['定位', '关闭'],
      onAction: i => { if (i === 0 && a.lon != null) camTo(a.lon, a.lat, 2.2, 600); hideDetail(); }
    });
  }

  /* ========== 8. 地图交互 ========== */
  let drag = null, moved = 0;
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect();
    drag = { x: e.clientX, y: e.clientY, cx: state.cam.x, cy: state.cam.y, r };
    moved = 0; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      state.camAnim = null;
      state.cam.x = drag.cx - dx / (BASE * state.cam.z);
      state.cam.y = drag.cy - dy / (BASE * state.cam.z);
    } else {
      const hit = state.hits.find(h => Math.hypot(h.x - x, h.y - y) < h.r);
      const id = hit ? hit.id : null;
      if (id !== state.hover) { state.hover = id; canvas.style.cursor = id ? 'pointer' : 'grab'; }
    }
  });
  canvas.addEventListener('pointerup', e => {
    canvas.classList.remove('dragging');
    if (drag && moved < 6) {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const hit = state.hits.find(h => Math.hypot(h.x - x, h.y - y) < h.r);
      if (hit) {
        if (hit.type === 'drone') droneCard(DATA.drones.find(d => d.id === hit.id), x, y);
        else if (hit.type === 'port') portCard(DATA.ports.find(p => p.id === hit.id), x, y);
        else if (hit.type === 'event') {
          const a = DATA.alerts.find(z => z.id === hit.id); state.selected = a.id; eventCard(a, x, y);
        }
      } else { hideDetail(); state.selected = null; }
    }
    drag = null;
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const before = SU(px, py);
    const z = Math.max(0.75, Math.min(3.4, state.cam.z * (e.deltaY > 0 ? 0.88 : 1.14)));
    state.cam.z = z;
    const after = SU(px, py);
    state.cam.x += before.x - after.x; state.cam.y += before.y - after.y;
    state.camAnim = null;
  }, { passive: false });
  canvas.addEventListener('pointerleave', () => { state.hover = null; });

  $$('#bookmarkBox button').forEach(b => b.addEventListener('click', () => {
    $$('#bookmarkBox button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    if (b.dataset.book === 'all') { flyTo({ x: UW / 2, y: UH / 2, z: 1 }, 650); toast('已切换：全域总览'); }
    else { camTo(114.985, 30.095, 2.35, 650); toast('已切换：城区放大'); }
  }));

  /* ========== 9. 助手 ========== */
  const AI = {
    open: false,
    msgs: [],
    queue: []
  };
  function openAssistant(force) {
    const el = $('#assistant');
    AI.open = force == null ? !AI.open : force;
    el.style.display = AI.open ? 'flex' : 'none';
  }
  function addMsg(role, html) {
    const box = $('#aiMsgs');
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.innerHTML = html;
    box.appendChild(div); box.scrollTop = box.scrollHeight;
  }
  function renderChips() {
    const chips = ['今天飞了多少架次', '哪几架在飞', '设备状况怎么样', '放大铜绿山景区', '切到汇报模式'];
    $('#aiChips').innerHTML = chips.map(c => '<button class="chip">' + c + '</button>').join('');
    $$('.chip').forEach(c => c.addEventListener('click', () => runCommand(c.textContent, true)));
  }
  function speak(text) {
    if (!$('#ttsToggle').checked || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/[0-9]+/g, m => m));
      u.lang = 'zh-CN'; u.rate = 1.02; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { }
  }
  function runCommand(text, fromChip) {
    const t = (text || '').trim();
    if (!t) return;
    openAssistant(true);
    addMsg('user', t);
    setTimeout(() => {
      let reply = '', act = null;
      if (/架次|飞了多少|飞了几/.test(t)) {
        reply = '今天截至目前累计飞行 <strong>38</strong> 架次，比昨天同期多 4 架次（+11.8%）。其中巡检 14、物流配送 11、航拍 8、应急 5。';
        act = () => { flash('#k1'); };
      } else if (/在飞|几架|哪几架/.test(t)) {
        reply = '当前空域内 <strong>6</strong> 架在飞：DY-UAV-01/03/07/12/15/21，最高 300m，均在适飞空域内，最近一起告警为 DY-UAV-07 电量 18%。';
        act = focusAirborne;
      } else if (/设备|在线率|状况/.test(t)) {
        reply = '纳管设备 26 台，在线 <strong>24</strong> 台，在线率 92.3%，高于 90% 阈值。2 台离线（DY-UAV-19、DY-UAV-22），1 处起降场充电桩故障（灵乡镇驿站）。';
        act = () => openDrill('#k3');
      } else if (/放大|定位|铜绿山|大冶湖|医院|机场/.test(t)) {
        const map = [['铜绿山', [114.945, 30.050]], ['大冶湖', [115.010, 30.020]], ['医院', [114.968, 30.090]], ['陈贵', [114.845, 30.020]], ['机场', [115.150, 30.120]]];
        const hit = map.find(m => t.includes(m[0]));
        if (hit) { camTo(hit[1][0], hit[1][1], 2.5, 600); reply = '已定位至' + hit[0] + '区域（视角 2.5x）。'; }
        else { camTo(114.985, 30.095, 2.35, 600); reply = '已定位至大冶城区。'; }
        act = null;
      } else if (/汇报模式|汇报/.test(t)) {
        setMode('report'); reply = '已切换至汇报模式：隐藏装饰图层与次要标签，KPI 字号放大。';
      } else if (/告警|异常/.test(t)) {
        reply = '当前 5 条告警，2 条高级：DY-UAV-07 电量 18%（处置中）、DY-UAV-12 信号丢失 3s（已恢复）。已在地图定位最高级别事件。';
        act = () => { const a = DATA.alerts[0]; if (a.lon != null) camTo(a.lon, a.lat, 2.2, 600); };
      } else {
        reply = '我可以回答设备域与飞行域的指标，也能控制地图视角。试试「今天飞了多少架次」「放大铜绿山景区」。';
      }
      addMsg('bot', reply);
      speak(reply.replace(/<[^>]+>/g, ''));
      if (act) act();
    }, 420);
  }

  /* ========== 10. 模式 / 剧本 ========== */
  function setMode(m) {
    state.mode = m;
    $$('#modeBox button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
    document.body.classList.toggle('report', m === 'report');
    $('#demoBar').classList.toggle('show', m === 'demo');
    document.body.classList.toggle('demo', m === 'demo');
    if (m === 'report') { openAssistant(false); toast('汇报模式：装饰层收起，KPI 放大'); }
    if (m === 'demo') { demoStart(); }
    if (m === 'watch') { demoStop(); toast('值守模式'); }
  }
  const STEPS = [
    { name: '待机总览', run: () => { resetAll(); } },
    { name: '开场态势摘要', run: () => { openAssistant(true); addMsg('bot', '指挥中心您好。当前空域内 <strong>6</strong> 架无人机执行任务，今日累计飞行 <strong>38</strong> 架次；设备在线率 92.3%；2 台设备离线。需关注：DY-UAV-07 电量 18%，建议就近降落。'); } },
    { name: 'KPI → 地图联动', run: () => { flash('#k2'); focusAirborne(); } },
    { name: '书签视角切换', run: () => { camTo(114.985, 30.095, 2.35, 700); setTimeout(() => flyTo({ x: UW / 2, y: UH / 2, z: 1 }, 700), 1600); } },
    { name: '目标详情与轨迹', run: () => { const d = DATA.drones[0]; state.selected = d.id; const p = pointAt(ROUTE_PTS[d.route], d.t), s = S(p); droneCard(d, s.x, s.y); } },
    { name: '告警注入与盯防播报', run: () => { injectAlert(); } },
    { name: '语音问数与控屏', run: () => { runCommand('放大铜绿山景区', false); setTimeout(() => runCommand('今天飞了多少架次', false), 900); } },
    { name: '收尾 · 汇报视角', run: () => {
        setMode('report');
        setTimeout(() => {
          state.mode = 'demo';
          $$('#modeBox button').forEach(b => b.classList.toggle('on', b.dataset.mode === 'demo'));
          document.body.classList.remove('report');
          $('#demoBar').classList.add('show');
          document.body.classList.add('demo');
          flyTo({ x: UW / 2, y: UH / 2, z: 1 }, 700);
        }, 2200);
      } }
  ];
  function demoStart() {
    state.demo.playing = true; state.demo.i = 0; state.demo.t0 = Date.now();
    playStep(0);
    state.demo.tick = setInterval(() => {
      $('#demoTimer').textContent = fmtTime(Math.floor((Date.now() - state.demo.t0) / 1000));
    }, 500);
  }
  function demoStop() {
    state.demo.playing = false;
    if (state.demo.tick) { clearInterval(state.demo.tick); state.demo.tick = null; }
  }
  let stepTimer = null;
  function playStep(i) {
    state.demo.i = Math.max(0, Math.min(STEPS.length - 1, i));
    $('#demoIdx').textContent = ('0' + (state.demo.i + 1)).slice(-2);
    $('#demoName').textContent = STEPS[state.demo.i].name;
    $$('#demoSegs .seg').forEach((s, k) => { s.classList.toggle('now', k === state.demo.i); s.classList.toggle('done', k < state.demo.i); });
    STEPS[state.demo.i].run();
    if (stepTimer) clearTimeout(stepTimer);
    if (state.demo.playing) stepTimer = setTimeout(() => {
      if (state.demo.i < STEPS.length - 1) playStep(state.demo.i + 1);
      else { state.demo.playing = false; toast('演示结束，可点复位重播'); }
    }, [3000, 6000, 5000, 6000, 6000, 8000, 9000, 6000][state.demo.i]);
  }
  function resetAll() {
    flyTo({ x: UW / 2, y: UH / 2, z: 1 }, 600);
    Object.keys(state.layers).forEach(k => state.layers[k] = true);
    $$('#layerBox input').forEach(i => { i.checked = true; i.closest('.lyr').classList.remove('off'); });
    state.selected = null; hideDetail(); $('#drill').style.display = 'none';
    $$('#bookmarkBox button').forEach((b, i) => b.classList.toggle('on', i === 0));
    if (state.injected) {
      DATA.alerts = DATA.alerts.filter(a => a.id !== 'A0');
      state.injected = false; renderAlerts(); renderTicker();
    }
  }
  function injectAlert() {
    if (state.injected) { toast('该告警已在列表中'); return; }
    state.injected = true;
    const a = { id: 'A0', time: nowHM(), level: 'high', obj: 'DY-UAV-07', msg: '高度异常下降 + 电量 18%，建议立即就近降落', status: '待处置', lon: DATA.drones[2].trail && DATA.drones[2].trail.length ? null : 114.888, lat: 30.061 };
    const p = pointAt(ROUTE_PTS[DATA.drones[2].route], DATA.drones[2].t), u = p;
    a.lon = LON0 + u.x / KX; a.lat = LAT1 - u.y;
    DATA.alerts.unshift(a);
    renderAlerts(); renderTicker();
    camTo(a.lon, a.lat, 2.1, 600);
    openAssistant(true);
    addMsg('bot', '监测到高级别告警：<strong>DY-UAV-07</strong> 高度异常下降、电量 18%，位于铜绿山景区东北 1.2km。建议立即就近降落并通知机主，已在地图聚焦。');
    speak('监测到设备告警，无人机零七，电量百分之十八，建议立即就近降落。');
    toast('已注入演示告警：DY-UAV-07 低电量 / 高度异常');
  }
  function fmtTime(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function nowHM() {
    const d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2000);
  }
  function focusAirborne() {
    const pts = DATA.drones.map(d => pointAt(ROUTE_PTS[d.route], d.t));
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    flyTo({ x: cx, y: cy, z: 1.35 }, 700);
  }

  /* ========== 11. 降级绘制（无 ECharts 时） ========== */
  function fallbackDonut(box, items, total) {
    const cv = document.createElement('canvas');
    const w = box.clientWidth || 172, h = box.clientHeight || 200;
    cv.width = w * 2; cv.height = h * 2; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    box.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(2, 2);
    let a0 = -Math.PI / 2;
    const sum = items.reduce((a, b) => a + b.value, 0);
    items.forEach(it => {
      const a1 = a0 + it.value / sum * Math.PI * 2;
      c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) / 2 - 14, a0, a1);
      c.strokeStyle = it.color; c.lineWidth = 16; c.stroke(); a0 = a1;
    });
    c.fillStyle = '#7E96B4'; c.font = '10px sans-serif'; c.textAlign = 'center';
    c.fillText('在册 ' + total + ' 架', w / 2, h / 2 + 4);
  }
  function fallbackLine(box, d) {
    const cv = document.createElement('canvas');
    const w = box.clientWidth || 340, h = box.clientHeight || 240;
    cv.width = w * 2; cv.height = h * 2; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    box.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(2, 2);
    const max = Math.max.apply(null, d.today) || 1;
    const x = i => 8 + i / (d.today.length - 1) * (w - 16), y = v => h - 16 - v / max * (h - 34);
    c.strokeStyle = 'rgba(30,136,229,.8)'; c.lineWidth = 1.6; c.beginPath();
    d.today.forEach((v, i) => i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v))); c.stroke();
    c.strokeStyle = 'rgba(70,98,138,.5)'; c.setLineDash([3, 3]); c.beginPath();
    d.yday.forEach((v, i) => i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v))); c.stroke();
  }

  /* ========== 12. 启动 ========== */
  function boot() {
    if (!GEO.length) { console.warn('缺少边界数据'); }
    resizeCanvas();
    renderKPI(); renderLinks(); renderFleet(); renderHealth(); renderAlerts();
    renderTrend(); renderTasks(); renderAir(); renderTicker(); renderPlatform();
    renderLayers(); renderChips();
    STATE_SEGS();
    requestAnimationFrame(loop);
    tickClock();
    setInterval(tickClock, 1000);
    setInterval(() => {
      DATA.platform.sync += Math.floor(Math.random() * 12) + 3;
      DATA.platform.calls += Math.floor(Math.random() * 30) + 8;
      DATA.platform.last = nowHM() + ':' + ('0' + new Date().getSeconds()).slice(-2);
      renderPlatform();
    }, 30000);
  }
  function STATE_SEGS() {
    $('#demoSegs').innerHTML = STEPS.map((s, i) => '<div class="seg" data-i="' + i + '"></div>').join('');
    $$('#demoSegs .seg').forEach(s => s.addEventListener('click', () => { playStep(+s.dataset.i); }));
  }
  function tickClock() {
    const d = new Date();
    const p = n => ('0' + n).slice(-2);
    $('#clockTime').textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    $('#clockDate').textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + wk;
  }
  function scaleStage() {
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    $('#stage').style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', () => { scaleStage(); resizeCanvas(); });
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key >= '1' && e.key <= '8') { if (state.mode !== 'demo') setMode('demo'); playStep(+e.key - 1); }
    if (e.key === 'r' || e.key === 'R') resetAll();
    if (e.key === ' ') { e.preventDefault(); if (state.demo.playing) { demoStop(); } else { state.demo.playing = true; playStep(state.demo.i); } }
    if (e.key === 'f' || e.key === 'F') { flyTo({ x: UW / 2, y: UH / 2, z: 1 }, 650); toast('已回到全域总览'); }
    if (e.key === 'l' || e.key === 'L') { $('#layerAll').click(); }
    if (e.key === 'm' || e.key === 'M') { setMode(state.mode === 'watch' ? 'report' : state.mode === 'report' ? 'demo' : 'watch'); }
  });
  $('#demoPrev').onclick = () => playStep(state.demo.i - 1);
  $('#demoNext').onclick = () => playStep(state.demo.i + 1);
  $('#demoReset').onclick = () => { playStep(0); state.demo.t0 = Date.now(); };
  $('#demoPlay').onclick = () => {
    if (state.demo.playing) { demoStop(); $('#demoPlay').innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>'; }
    else { state.demo.playing = true; playStep(state.demo.i); $('#demoPlay').innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'; }
  };
  $$('#modeBox button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('#aiBtn').onclick = () => openAssistant(!AI.open);
  $('#aiClose').onclick = () => openAssistant(false);
  $('#aiSend').onclick = () => { const v = $('#aiInput').value; $('#aiInput').value = ''; runCommand(v); };
  $('#aiInput').addEventListener('keydown', e => { if (e.key === 'Enter') { const v = e.target.value; e.target.value = ''; runCommand(v); } });
  $('#aiMic').onclick = () => {
    const mic = $('#aiMic'); mic.classList.add('listening'); openAssistant(true);
    setTimeout(() => {
      mic.classList.remove('listening');
      addMsg('user', '小冶小冶 · 放大铜绿山景区');
      setTimeout(() => runCommand('放大铜绿山景区', false), 300);
    }, 700);
  };

  scaleStage(); boot();
})();
