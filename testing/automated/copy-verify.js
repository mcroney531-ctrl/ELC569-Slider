const { chromium } = require('playwright');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const D = require('os').tmpdir() + '/'; // screenshots go to the system temp folder, not the repo
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[320, 568], [390, 844], [1280, 800]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const T = w + ': ';
    await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../../index.html')).href); await p.click('.lp-cta'); await p.waitForTimeout(300);
    const t = sel => p.evaluate(s => document.querySelector(s).textContent.trim().replace(/\s+/g, ' '), sel);
    ok(await t('.ob-screen[data-step="1"] .ob-key-lead') === "You won't anticipate everything a real user might do." && await t('.ob-screen[data-step="1"] .ob-key-rest') === "Persona testing helps you explore the possibilities you might otherwise miss.", T + 'step 1 callout: bold lead, regular rest');
    ok((await t('.ob-screen[data-step="1"]')).includes('trouble recovering from mistakes, and situations'), T + 'step 1 paragraph');
    await p.locator('.ob-screen[data-step="1"] .ob-key').screenshot({ path: D + `s1-callout-${w}.png` });
    await p.click('.ob-screen[data-step="1"] [data-go="2"]'); await p.waitForTimeout(300);
    const s2 = await t('.ob-screen[data-step="2"]');
    ok(s2.includes('AI can help you explore more testing perspectives without creating every persona from scratch. Describe your project, and this tool generates six personas with different starting points, habits, and potential challenges. The panel includes differences in:') && await p.evaluate(() => document.querySelectorAll('.ob-screen[data-step="2"] .ob-list li').length === 7), T + 'step 2 intro, 7 bullets kept');
    if (w !== 1280) await p.screenshot({ path: D + `s2-${w}.png`, fullPage: true }); else await p.screenshot({ path: D + `s2-${w}.png` });
    await p.click('.ob-screen[data-step="2"] [data-go="3"]'); await p.waitForTimeout(600);
    ok(await t('.try-lead') === 'Explore a sample project: a short learning module for new managers. Choose an archetype, adjust Challenge and Journey, and see how the preview changes. Nothing you do here affects your own project or panel.', T + 'step 3 lead');
    const card = () => p.evaluate(() => ({ text: document.getElementById('tc-text').textContent, desc: document.getElementById('tc-body').getAttribute('aria-describedby'), focus: document.activeElement.id }));
    let c = await card(); ok(c.text === 'Each archetype represents a different testing perspective. Choose one to see how that person might approach this project.' && c.desc === 'tc-where tc-text' && c.focus === 'tc-body', T + 'tour 1 text, description and focus');
    await p.screenshot({ path: D + `tour1-${w}.png` });
    await p.click('#tc-next'); await p.waitForTimeout(450);
    c = await card(); ok(c.text.startsWith('Challenge changes how demanding the test conditions are.'), T + 'tour 2 unchanged');
    await p.screenshot({ path: D + `tour2-${w}.png` });
    await p.click('#tc-next'); await p.waitForTimeout(450);
    c = await card(); ok(c.text === 'The preview brings your choices together, showing how this person might behave and move through the experience. Open “See what this becomes” below to read the test it turns into.', T + 'tour 3 text');
    await p.click('#tc-next'); await p.waitForTimeout(300);
    ok(await t('.s-challenge .slider-help') === 'Change how the persona behaves under different test conditions.' && await t('.s-journey .slider-help') === 'Change the route the persona takes through your key moments.' && await t('#challenge-state') === 'No added challenge.', T + 'settings help and Typical line');
    ok(await p.evaluate(() => document.getElementById('challenge').getAttribute('aria-valuetext').startsWith('Level 1 of 4, typical')), T + 'accessible slider values unchanged');
    await p.evaluate(() => document.querySelectorAll('#onboard details').forEach(d => d.open = true)); await p.waitForTimeout(200);
    const terms = await p.evaluate(() => [...document.querySelectorAll('.ob-terms dt')].map(x => x.textContent));
    ok(terms.join() === 'Persona,Test panel,Archetype,Typical,Rushed,Inconsistent,Edge case,Key moment,Journey', T + 'Key terms: Archetype replaces Coverage lens, order kept');
    ok((await t('.ob-terms div:nth-child(7) dd')) === "A realistic circumstance the experience may not have been designed to handle. For example, a volunteer form assumes everyone has a fixed weekly schedule, but this persona's availability changes every week. It's a legitimate situation to test, not strange behavior invented to break the design.", T + 'Edge case definition');
    const brief = await p.evaluate(() => document.getElementById('demo-brief-text').textContent);
    ok(brief.includes('3. Practice: Write the note') && !brief.includes('Practice: Practice') && brief.includes('Why -> Model -> Practice -> Check'), T + 'sample brief: no doubled Practice, route unchanged');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), T + 'no horizontal overflow');
    await p.locator('.ob-terms').screenshot({ path: D + `terms-${w}.png` });
    await p.close();
  }
  console.log(fails ? `${fails} FAIL` : 'ALL PASS'); await b.close();
})();
