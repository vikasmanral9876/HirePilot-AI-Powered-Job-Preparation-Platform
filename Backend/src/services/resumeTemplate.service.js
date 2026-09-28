/**
 * Master ATS Resume Template & Styling Engine
 * Enforces clean, balanced, 1-page layout for standard resumes while remaining
 * ATS-compliant, highly readable, visually balanced from top to bottom,
 * and capable of clean multi-page flow for extensive senior profiles.
 */

const ATS_RESUME_CSS = `
  @page {
    size: A4;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #111827 !important;
    font-family: Arial, Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: var(--body-font-size, 9.6pt) !important;
    line-height: var(--body-line-height, 1.40) !important;
    -webkit-font-smoothing: antialiased;
  }
  a {
    color: inherit !important;
    text-decoration: none !important;
  }
  .header, header {
    text-align: center !important;
    margin-top: 0 !important;
    margin-bottom: var(--header-margin-bottom, 11px) !important;
    padding-bottom: var(--header-padding-bottom, 8px) !important;
    border-bottom: 1.5px solid #111827 !important;
  }
  .name, h1 {
    font-size: var(--name-size, 20pt) !important;
    font-weight: 700 !important;
    line-height: 1.15 !important;
    letter-spacing: -0.2px !important;
    color: #111827 !important;
    margin: 0 0 var(--name-margin-bottom, 3px) 0 !important;
    text-transform: uppercase !important;
  }
  .role, .title {
    font-size: var(--role-size, 10.5pt) !important;
    font-weight: 600 !important;
    color: #2563eb !important;
    margin: 0 0 var(--role-margin-bottom, 4px) 0 !important;
    line-height: 1.25 !important;
  }
  .contact-bar, .contact, .contact-info {
    display: flex !important;
    justify-content: center !important;
    flex-wrap: wrap !important;
    gap: var(--contact-gap, 3px 10px) !important;
    margin: 2px 0 0 0 !important;
    font-size: var(--contact-size, 8.5pt) !important;
    color: #4b5563 !important;
    line-height: 1.25 !important;
  }
  .contact-bar span, .contact span {
    display: inline-flex !important;
    align-items: center !important;
  }
  .section, section {
    margin-top: var(--section-margin-top, 12px) !important;
    margin-bottom: var(--section-margin-bottom, 8px) !important;
  }
  .section-title, h2 {
    font-size: var(--section-title-size, 11pt) !important;
    font-weight: 700 !important;
    color: #111827 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    border-bottom: 1px solid #d1d5db !important;
    padding-bottom: var(--section-title-padding-bottom, 2.5px) !important;
    margin: var(--section-title-margin, 11px 0 6px 0) !important;
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
  h3 {
    font-size: var(--h3-size, 9.7pt) !important;
    font-weight: 600 !important;
    color: #111827 !important;
    margin: 4px 0 2px 0 !important;
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
  .summary-text, p {
    font-size: var(--summary-size, 9.4pt) !important;
    line-height: var(--summary-line-height, 1.40) !important;
    color: #374151 !important;
    margin: 0 0 4px 0 !important;
  }
  .skills-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: var(--skills-gap, 5px 16px) !important;
    font-size: var(--skills-size, 9.1pt) !important;
  }
  .skill-item {
    color: #374151 !important;
    line-height: var(--skills-line-height, 1.36) !important;
  }
  .skill-label, .skill-item strong {
    font-weight: 700 !important;
    color: #111827 !important;
  }
  .project-item, .experience-item, .job-item, .edu-item, .entry {
    margin-bottom: var(--item-margin-bottom, 11px) !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .project-header, .entry-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    margin-bottom: var(--item-header-margin-bottom, 3.5px) !important;
  }
  .project-title, .entry-title {
    font-size: var(--item-title-size, 9.6pt) !important;
    font-weight: 700 !important;
    color: #111827 !important;
  }
  .project-tech, .entry-tech {
    font-size: var(--item-tech-size, 8.6pt) !important;
    font-style: italic !important;
    color: #2563eb !important;
    font-weight: 500 !important;
  }
  ul.bullets, ul {
    list-style-type: disc !important;
    padding-left: var(--bullet-padding-left, 15px) !important;
    margin: 3px 0 0 0 !important;
  }
  ul.bullets li, li {
    font-size: var(--bullet-size, 9.3pt) !important;
    color: #374151 !important;
    margin-bottom: var(--bullet-margin-bottom, 4px) !important;
    line-height: var(--bullet-line-height, 1.38) !important;
  }
  ul.bullets li:last-child {
    margin-bottom: 0 !important;
  }
  .columns {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: var(--columns-gap, 16px) !important;
    margin-top: var(--columns-margin-top, 12px) !important;
  }
  .columns .section {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  .edu-degree {
    font-weight: 700 !important;
    font-size: var(--edu-degree-size, 9.4pt) !important;
    color: #111827 !important;
  }
  .edu-inst {
    font-size: var(--edu-inst-size, 8.7pt) !important;
    color: #4b5563 !important;
    display: flex !important;
    justify-content: space-between !important;
    margin-top: 1px !important;
  }
  .edu-meta {
    font-size: var(--edu-meta-size, 8.5pt) !important;
    color: #2563eb !important;
    font-weight: 600 !important;
    margin-top: 2px !important;
  }
  .compact-list {
    list-style: none !important;
    padding-left: 0 !important;
    margin: 0 !important;
  }
  .compact-list li {
    font-size: var(--compact-size, 9.1pt) !important;
    line-height: var(--compact-line-height, 1.36) !important;
    color: #374151 !important;
    margin-bottom: var(--compact-margin-bottom, 4px) !important;
    position: relative !important;
    padding-left: 11px !important;
  }
  .compact-list li:last-child {
    margin-bottom: 0 !important;
  }
  .compact-list li::before {
    content: '•' !important;
    position: absolute !important;
    left: 0 !important;
    color: #2563eb !important;
    font-weight: bold !important;
  }

  /* DENSITY VARIATIONS */
  /* 1. COMFORTABLE DENSITY: Short/fresher profiles (<= 330 words, 2-3 projects) */
  body.density-comfortable {
    --body-font-size: 9.8pt;
    --body-line-height: 1.45;
    --name-size: 20.5pt;
    --name-margin-bottom: 4px;
    --role-size: 10.8pt;
    --role-margin-bottom: 5px;
    --contact-size: 8.5pt;
    --contact-gap: 3px 11px;
    --header-margin-bottom: 14px;
    --header-padding-bottom: 11px;
    --section-margin-top: 15px;
    --section-margin-bottom: 9px;
    --section-title-size: 11.2pt;
    --section-title-padding-bottom: 3.5px;
    --section-title-margin: 13px 0 8px 0;
    --h3-size: 10pt;
    --summary-size: 9.7pt;
    --summary-line-height: 1.48;
    --skills-gap: 7px 18px;
    --skills-size: 9.3pt;
    --skills-line-height: 1.42;
    --item-margin-bottom: 15px;
    --item-header-margin-bottom: 5px;
    --item-title-size: 9.9pt;
    --item-tech-size: 8.8pt;
    --bullet-padding-left: 16px;
    --bullet-size: 9.5pt;
    --bullet-margin-bottom: 6px;
    --bullet-line-height: 1.44;
    --columns-gap: 18px;
    --columns-margin-top: 15px;
    --edu-degree-size: 9.6pt;
    --edu-inst-size: 8.9pt;
    --edu-meta-size: 8.6pt;
    --compact-size: 9.3pt;
    --compact-line-height: 1.44;
    --compact-margin-bottom: 6.5px;
  }

  /* 2. NORMAL DENSITY: Standard junior/mid profiles (331 - 410 words) */
  body.density-normal {
    --body-font-size: 9.6pt;
    --body-line-height: 1.40;
    --name-size: 20pt;
    --name-margin-bottom: 3px;
    --role-size: 10.5pt;
    --role-margin-bottom: 4px;
    --contact-size: 8.5pt;
    --contact-gap: 3px 10px;
    --header-margin-bottom: 11px;
    --header-padding-bottom: 8px;
    --section-margin-top: 12px;
    --section-margin-bottom: 8px;
    --section-title-size: 11pt;
    --section-title-padding-bottom: 2.5px;
    --section-title-margin: 11px 0 6px 0;
    --h3-size: 9.7pt;
    --summary-size: 9.4pt;
    --summary-line-height: 1.40;
    --skills-gap: 5px 16px;
    --skills-size: 9.1pt;
    --skills-line-height: 1.36;
    --item-margin-bottom: 11px;
    --item-header-margin-bottom: 3.5px;
    --item-title-size: 9.6pt;
    --item-tech-size: 8.6pt;
    --bullet-padding-left: 15px;
    --bullet-size: 9.3pt;
    --bullet-margin-bottom: 4px;
    --bullet-line-height: 1.38;
    --columns-gap: 16px;
    --columns-margin-top: 12px;
    --edu-degree-size: 9.4pt;
    --edu-inst-size: 8.7pt;
    --edu-meta-size: 8.5pt;
    --compact-size: 9.1pt;
    --compact-line-height: 1.36;
    --compact-margin-bottom: 4px;
  }

  /* 3. COMPACT DENSITY: Extensive senior profiles (> 410 words or >= 5 entries) */
  body.density-compact {
    --body-font-size: 9.4pt;
    --body-line-height: 1.35;
    --name-size: 19pt;
    --name-margin-bottom: 2px;
    --role-size: 10pt;
    --role-margin-bottom: 3px;
    --contact-size: 8.4pt;
    --contact-gap: 2px 9px;
    --header-margin-bottom: 7px;
    --header-padding-bottom: 6px;
    --section-margin-top: 7px;
    --section-margin-bottom: 5px;
    --section-title-size: 10.5pt;
    --section-title-padding-bottom: 2px;
    --section-title-margin: 6px 0 3px 0;
    --h3-size: 9.4pt;
    --summary-size: 9.2pt;
    --summary-line-height: 1.34;
    --skills-gap: 3px 13px;
    --skills-size: 8.8pt;
    --skills-line-height: 1.30;
    --item-margin-bottom: 6.5px;
    --item-header-margin-bottom: 2px;
    --item-title-size: 9.4pt;
    --item-tech-size: 8.4pt;
    --bullet-padding-left: 14px;
    --bullet-size: 9pt;
    --bullet-margin-bottom: 2.2px;
    --bullet-line-height: 1.33;
    --columns-gap: 14px;
    --columns-margin-top: 7px;
    --edu-degree-size: 9.1pt;
    --edu-inst-size: 8.5pt;
    --edu-meta-size: 8.3pt;
    --compact-size: 8.8pt;
    --compact-line-height: 1.30;
    --compact-margin-bottom: 2.2px;
  }
`;

/**
 * Intelligently analyzes resume content density (word count, project/job entries, bullets)
 * to assign the optimal spacing density class:
 * - 'comfortable': Short/fresher profiles (<= 330 words, <= 3 entries, <= 11 bullets).
 *   Expands spacing and line-heights to naturally fill 80-92% of the single page.
 * - 'normal': Standard profiles (331-410 words, 3-4 entries).
 *   Balanced, professional spacing occupying 80-95% of a single page.
 * - 'compact': Extensive senior profiles (> 410 words or >= 5 entries).
 *   Tighter spacing to fit 1 page if possible, or flow gracefully across 2 pages.
 */
function detectResumeDensity(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "normal";
  }

  const plainText = rawHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  
  const liCount = (rawHtml.match(/<li[\s>]/gi) || []).length;
  const projectOrExpCount = (rawHtml.match(/class=["'][^"']*(?:project-item|experience-item|job-item)[^"']*["']/gi) || []).length;

  if (wordCount > 410 || projectOrExpCount >= 5) {
    return "compact";
  }
  if (wordCount <= 330 && projectOrExpCount <= 3 && liCount <= 11) {
    return "comfortable";
  }
  return "normal";
}

/**
 * Prepares and normalizes resume HTML for Puppeteer PDF generation.
 * Strips conflicting print media paddings, injects standard ATS styles,
 * adds intelligent density classes to body, and ensures page break rules are strictly enforced.
 */
function prepareAtsResumeHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  let html = rawHtml.trim();

  // Strip conflicting @media print body padding or @page margins if present in AI output
  html = html.replace(/@media\s+print\s*\{[^}]*body\s*\{[^}]*\}[^}]*\}/gi, "");
  html = html.replace(/@page\s*\{[^}]*\}/gi, "");

  const density = detectResumeDensity(html);
  const densityClass = `density-${density}`;

  // Apply density class to body
  if (/<body[^>]*class=["'][^"']*["']/i.test(html)) {
    html = html.replace(/<body([^>]*class=["'])([^"']*)(["'])/i, `<body$1$2 ${densityClass}$3`);
  } else if (/<body/i.test(html)) {
    html = html.replace(/<body([^>]*)>/i, `<body$1 class="${densityClass}">`);
  } else {
    html = `<body class="${densityClass}">\n${html}\n</body>`;
  }

  const styleTag = `<style id="hirepilot-ats-styles">\n${ATS_RESUME_CSS}\n</style>`;

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${styleTag}\n</head>`);
  } else {
    html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Resume</title>\n${styleTag}\n</head>\n${html}\n</html>`;
  }

  return html;
}

module.exports = {
  ATS_RESUME_CSS,
  detectResumeDensity,
  prepareAtsResumeHtml,
};
