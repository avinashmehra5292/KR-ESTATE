import { chromium } from '@playwright/test';

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const report = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime;
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      hasAlt: Boolean(img.alt)
    }));
    const headings = {
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      h3: document.querySelectorAll('h3').length,
    };
    const meta = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    };
    const interactiveElements = Array.from(document.querySelectorAll('button, a, input, select'));
    const missingAriaOrText = interactiveElements.filter(el => {
      const text = el.innerText || el.textContent || '';
      const ariaLabel = el.getAttribute('aria-label');
      const title = el.getAttribute('title');
      const placeholder = el.getAttribute('placeholder');
      return !text.trim() && !ariaLabel && !title && !placeholder;
    });

    return {
      ttfb: Math.round(nav ? (nav.responseStart - nav.requestStart) : 0),
      domLoaded: Math.round(nav ? (nav.domContentLoadedEventEnd - nav.startTime) : 0),
      loadTime: Math.round(nav ? (nav.loadEventEnd - nav.startTime) : 0),
      fcp: Math.round(fcp || 0),
      headings,
      imagesTotal: images.length,
      imagesMissingAlt: images.filter(i => !i.hasAlt).length,
      interactiveTotal: interactiveElements.length,
      interactiveMissingLabel: missingAriaOrText.length,
      meta
    };
  });

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

audit();
