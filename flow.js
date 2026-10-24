// Background: samples drift from Gaussian noise onto a plasma ring,
// a nod to flow matching / diffusion models and tokamak plasmas.
(function () {
  var canvas = document.getElementById('flow');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var w, h, dpr, R, cx, cy, parts = [], colors;

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function spawn(p) {
    p.x = gauss() * R * 0.9;
    p.y = gauss() * R * 0.9;
    p.age = 0;
    p.life = 400 + Math.random() * 400;
    p.hue = Math.random() < 0.25 ? 1 : 0;
    return p;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.5; cy = h * 0.5;
    R = Math.min(w, h) * 0.32;
    colors = [css('--accent'), css('--accent2')];
    var n = Math.round(Math.min(260, (w * h) / 6000));
    parts = [];
    for (var i = 0; i < n; i++) parts.push(spawn({}));
    ctx.fillStyle = css('--bg');
    ctx.fillRect(0, 0, w, h);
  }

  function step() {
    // fade previous frame to leave trails
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = css('--bg');
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.2;

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var r = Math.sqrt(p.x * p.x + p.y * p.y) + 1e-6;
      // velocity field: pull radius toward R, plus a toroidal swirl
      var pull = (R - r) * 0.012;
      var swirl = 0.35 + 0.6 * Math.exp(-Math.abs(R - r) / (R * 0.25));
      var vx = (p.x / r) * pull * r * 0.1 + (-p.y / r) * swirl;
      var vy = (p.y / r) * pull * r * 0.1 + (p.x / r) * swirl;
      var nx = p.x + vx + gauss() * 0.15;
      var ny = p.y + vy + gauss() * 0.15;
      ctx.strokeStyle = colors[p.hue];
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(cx + p.x, cy + p.y);
      ctx.lineTo(cx + nx, cy + ny);
      ctx.stroke();
      p.x = nx; p.y = ny;
      if (++p.age > p.life) spawn(p);
    }
    ctx.globalAlpha = 1;
  }

  function loop() { step(); requestAnimationFrame(loop); }

  resize();
  window.addEventListener('resize', resize);
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', resize);
  }
  if (reduce) { for (var k = 0; k < 500; k++) step(); } else { loop(); }
})();
