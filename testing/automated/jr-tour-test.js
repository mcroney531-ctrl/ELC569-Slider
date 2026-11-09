// The journey window opened from inside the tour: it is usable, every way of closing it works, and the tour carries on intact.
const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  for (const [vp, rm] of [[{ width: 1280, height: 873 }, 'no-preference'], [{ width: 390, height: 844 }, 'no-preference'], [{ width: 360, height: 740 }, 'reduce']]) {
    const T = `${vp.width}/${rm}: `;
    const p = await (await b.newContext({ viewport: vp, reducedMotion: rm })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../index.html')).href);
    await p.click('.lp-cta'); await p.click('.ob-screen[data-step="1"] [data-go="2"]'); await p.click('.ob-screen[data-step="2"] [data-go="3"]'); await p.waitForTimeout(500);
    const st = () => p.evaluate(() => { const t = SPOT[spot ? spot.i : 0].target().getBoundingClientRect(), s = document.getElementById('spot').getBoundingClientRect();
      return { jr: document.getElementById('jr-dialog').open, tour: document.getElementById('tourcard').open, stop: document.getElementById('tc-count').textContent,
        focus: document.activeElement.id || document.activeElement.className, ov: document.documentElement.style.overflow, scrollY,
        aligned: Math.abs((s.left + s.width / 2) - (t.left + t.width / 2)) < 3 && Math.abs((s.top + s.height / 2) - (t.top + t.height / 2)) < 3 }; });
    for (const [stop, sel, opener] of [[2, '#jr-link', 'jr-link'], [3, '#preview-card .route-link', 'jr-link route-link']]) {
      while ((await st()).stop !== `Step ${stop} of 3`) { await p.click('#tc-next'); await p.waitForTimeout(400); }
      for (const how of ['X', 'Esc', 'backdrop', 'keyboard']) {
        const y0 = (await st()).scrollY;
        if (how === 'keyboard') { await p.focus(sel); await p.keyboard.press('Enter'); } else await p.click(sel);
        await p.waitForTimeout(350);
        let s = await st();
        const live = await p.evaluate(() => !document.getElementById('jr-dialog').closest('[inert]') && document.getElementById('jr-dialog').contains(document.activeElement));
        ok(s.jr && live, T + `stop ${stop}: the journey window opens usable, with focus inside (${how})`);
        if (how === 'X') await p.click('#jr-close');
        else if (how === 'Esc') await p.keyboard.press('Escape');
        else if (how === 'backdrop') await p.mouse.click(5, 5);
        else { await p.focus('#jr-close'); await p.keyboard.press('Enter'); }
        await p.waitForTimeout(400); s = await st();
        ok(!s.jr && s.tour && s.stop === `Step ${stop} of 3`, T + `stop ${stop}: ${how} closes it; the tour stays on the same stop`);
        ok(s.focus === opener, T + `stop ${stop}: focus returns to the button that opened it (${s.focus})`);
        ok(s.ov === 'hidden' && s.scrollY === y0 && s.aligned, T + `stop ${stop}: the page stays still and the highlight stays aligned`);
        ok(await p.evaluate(() => { const d = document.getElementById('jr-dialog'); return !d.open && getComputedStyle(d).display === 'none' && !d.contains(document.activeElement); }), T + `stop ${stop}: once closed, the journey window is hidden and holds no focus (${how})`);
        let reached = false; await p.focus('#tc-next');
        for (let k = 0; k < 20; k++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => !!document.activeElement.closest('#jr-dialog'))) reached = true; }
        ok(!reached, T + `stop ${stop}: Tab can't reach the closed journey window (${how})`);
        await p.mouse.wheel(0, 400); await p.waitForTimeout(200);
        ok((await st()).scrollY === y0, T + `stop ${stop}: still no page scroll under the tour after closing`);
      }
    }
    await p.click('#tc-next'); await p.waitForTimeout(400);
    let s = await st();
    ok(!s.tour && s.ov === '' && !(await p.evaluate(() => !!document.querySelector('[inert]'))), T + 'the tour ends normally: the page scrolls again, nothing left switched off');
    // Scroll from the page margin: on phones the preview and settings are their own scroll boxes and keep the wheel.
    const y1 = (await st()).scrollY; await p.mouse.move(4, Math.round(vp.height / 2)); await p.mouse.wheel(0, 300); await p.waitForTimeout(300);
    const scrolls = (await st()).scrollY !== y1 || await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight);
    const usable = await p.click('.ob-screen[data-step="3"] .ob-actions .primary', { trial: true, timeout: 2000 }).then(() => true, () => false);
    ok(scrolls && usable, T + 'after the tour: the page scrolls and the intro buttons are usable again');
    await p.click('#jr-link'); await p.waitForTimeout(350); await p.click('#jr-close'); await p.waitForTimeout(400); s = await st();
    ok(!s.jr && s.ov === '' && s.focus === 'jr-link', T + 'outside the tour: the journey window opens and closes as before, page scroll restored');
    ok(errs.length === 0, T + 'no page errors ' + errs.join('; '));
    await p.close();
  }
  console.log(fails ? `${fails} FAIL` : 'ALL PASS'); await b.close();
})();
