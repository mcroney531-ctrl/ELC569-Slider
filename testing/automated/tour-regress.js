// Tour isolation regression: outside the card and the highlighted region nothing is reachable; Esc, Skip and the last stop end it cleanly.
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const URL = process.argv[2] || require('url').pathToFileURL(require('path').resolve(__dirname, '../../index.html')).href;
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 1280, height: 873 }, { width: 390, height: 844 }]) {
    const T = vp.width + ': ';
    const p = await (await b.newContext({ viewport: vp })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const into = async () => { await p.goto(URL); await p.click('.lp-cta'); await p.click('.ob-screen[data-step="1"] [data-go="2"]'); await p.click('.ob-screen[data-step="2"] [data-go="3"]'); await p.waitForTimeout(500); };
    const probe = () => p.evaluate(() => {
      const reach = el => !!el && !el.closest('[inert]');
      const region = SPOT[spot.i].target();
      const outside = ['.ob-screen[data-step="3"] .ob-actions .primary', '#demo-brief summary', '.ob-screen[data-step="3"] .try-lead'].map(s => document.querySelector(s));
      const regionCtl = region.querySelector('input, button, [tabindex="0"]') || region;
      return { stop: spot.i + 1, outsideBlocked: outside.every(e => !reach(e)), regionLive: reach(regionCtl), cardLive: reach(document.getElementById('tc-next')),
        jrClosed: !document.getElementById('jr-dialog').open, jrHidden: getComputedStyle(document.getElementById('jr-dialog')).display === 'none' };
    });
    await into();
    for (let i = 1; i <= 3; i++) {
      const s = await probe();
      ok(s.stop === i && s.outsideBlocked && s.regionLive && s.cardLive, T + `stop ${i}: outside blocked, region and card live`);
      ok(s.jrClosed && s.jrHidden, T + `stop ${i}: the closed journey window is hidden, so keeping it out of the switch-off exposes nothing`);
      // Tab cycling from the card never escapes to blocked content or the closed journey window
      let escaped = false;
      await p.focus('#tc-next');
      for (let k = 0; k < 25; k++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => { const a = document.activeElement; return a !== document.body && (!!a.closest('[inert]') || !!a.closest('#jr-dialog')); })) escaped = true; }
      ok(!escaped, T + `stop ${i}: Tab never reaches blocked content or the journey window`);
      if (i < 3) { await p.click('#tc-next'); await p.waitForTimeout(400); }
    }
    await p.click('#tc-back'); await p.waitForTimeout(400);
    ok((await probe()).stop === 2, T + 'Back returns to stop 2');
    await p.focus('#tc-next'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.getElementById('tourcard').open && !spot && !document.querySelector('[inert]') && document.documentElement.style.overflow === ''), T + 'Esc ends the tour and frees the page');
    await into(); await p.click('#tc-skip'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.getElementById('tourcard').open && !document.querySelector('[inert]') && document.documentElement.style.overflow === ''), T + 'Skip tour ends it and frees the page');
    await into(); for (let i = 0; i < 3; i++) { await p.click('#tc-next'); await p.waitForTimeout(400); }
    ok(await p.evaluate(() => !document.getElementById('tourcard').open && !document.querySelector('[inert]')), T + 'Start exploring ends it and frees the page');
    ok(errs.length === 0, T + 'no page errors ' + errs.join('; '));
    await p.close();
  }
  console.log(fails ? `${fails} FAIL` : 'ALL PASS'); await b.close();
})();
