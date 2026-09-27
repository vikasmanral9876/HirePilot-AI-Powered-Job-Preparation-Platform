/**
 * Master ATS Resume Template & Styling Engine
 * Enforces clean, compact, 1-page layout for standard resumes while remaining
 * ATS-compliant, readable, and capable of clean multi-page flow when necessary.
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
    font-size: 9.5pt !important;
    line-height: 1.34 !important;
    -webkit-font-smoothing: antialiased;
  }
  a {
    color: inherit !important;
    text-decoration: none !important;
  }
  .header, header {
    text-align: center !important;
    margin-bottom: 6px !important;
    padding-bottom: 5px !important;
    border-bottom: 1.5px solid #111827 !important;
  }
  .name, h1 {
    font-size: 19pt !important;
    font-weight: 700 !important;
    line-height: 1.15 !important;
    letter-spacing: -0.2px !important;
    color: #111827 !important;
    margin: 0 0 2px 0 !important;
    text-transform: uppercase !important;
  }
  .role, .title {
    font-size: 10.5pt !important;
    font-weight: 600 !important;
    color: #2563eb !important;
    margin: 0 0 3px 0 !important;
    line-height: 1.2 !important;
  }
  .contact-bar, .contact, .contact-info {
    display: flex !important;
    justify-content: center !important;
    flex-wrap: wrap !important;
    gap: 6px 12px !important;
    margin: 2px 0 0 0 !important;
    font-size: 8.6pt !important;
    color: #4b5563 !important;
    line-height: 1.25 !important;
  }
  .contact-bar span, .contact span {
    display: inline-flex !important;
    align-items: center !important;
  }
  .section, section {
    margin-top: 5px !important;
    margin-bottom: 5px !important;
  }
  .section-title, h2 {
    font-size: 10.5pt !important;
    font-weight: 700 !important;
    color: #111827 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    border-bottom: 1px solid #d1d5db !important;
    padding-bottom: 1.5px !important;
    margin: 5px 0 3px 0 !important;
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
  h3 {
    font-size: 9.6pt !important;
    font-weight: 600 !important;
    color: #111827 !important;
    margin: 3px 0 1px 0 !important;
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
  .summary-text, p {
    font-size: 9.3pt !important;
    line-height: 1.34 !important;
    color: #374151 !important;
    margin: 0 0 3px 0 !important;
  }
  .skills-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 2px 14px !important;
    font-size: 8.8pt !important;
  }
  .skill-item {
    color: #374151 !important;
    line-height: 1.3 !important;
  }
  .skill-label, .skill-item strong {
    font-weight: 700 !important;
    color: #111827 !important;
  }
  .project-item, .experience-item, .job-item, .edu-item, .entry {
    margin-bottom: 4.5px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .project-header, .entry-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    margin-bottom: 1px !important;
  }
  .project-title, .entry-title {
    font-size: 9.5pt !important;
    font-weight: 700 !important;
    color: #111827 !important;
  }
  .project-tech, .entry-tech {
    font-size: 8.4pt !important;
    font-style: italic !important;
    color: #2563eb !important;
    font-weight: 500 !important;
  }
  ul.bullets, ul {
    list-style-type: disc !important;
    padding-left: 14px !important;
    margin: 1px 0 0 0 !important;
  }
  ul.bullets li, li {
    font-size: 8.9pt !important;
    color: #374151 !important;
    margin-bottom: 1.5px !important;
    line-height: 1.32 !important;
  }
  .columns {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 12px !important;
  }
  .edu-degree {
    font-weight: 700 !important;
    font-size: 9pt !important;
    color: #111827 !important;
  }
  .edu-inst {
    font-size: 8.5pt !important;
    color: #4b5563 !important;
    display: flex !important;
    justify-content: space-between !important;
  }
  .edu-meta {
    font-size: 8.3pt !important;
    color: #2563eb !important;
    font-weight: 600 !important;
    margin-top: 1px !important;
  }
  .compact-list {
    list-style: none !important;
    padding-left: 0 !important;
    margin: 0 !important;
  }
  .compact-list li {
    font-size: 8.6pt !important;
    color: #374151 !important;
    margin-bottom: 1.5px !important;
    position: relative !important;
    padding-left: 10px !important;
  }
  .compact-list li::before {
    content: '•' !important;
    position: absolute !important;
    left: 0 !important;
    color: #2563eb !important;
    font-weight: bold !important;
  }
`;

/**
 * Prepares and normalizes resume HTML for Puppeteer PDF generation.
 * Strips conflicting print media paddings, injects standard ATS styles,
 * and ensures page break rules are strictly enforced.
 */
function prepareAtsResumeHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  let html = rawHtml.trim();

  // Strip conflicting @media print body padding or @page margins if present in AI output
  html = html.replace(/@media\s+print\s*\{[^}]*body\s*\{[^}]*\}[^}]*\}/gi, "");
  html = html.replace(/@page\s*\{[^}]*\}/gi, "");

  const styleTag = `<style id="hirepilot-ats-styles">\n${ATS_RESUME_CSS}\n</style>`;

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${styleTag}\n</head>`);
  } else if (html.includes("<body")) {
    html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Resume</title>\n${styleTag}\n</head>\n${html}\n</html>`;
  } else {
    html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Resume</title>\n${styleTag}\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  return html;
}

module.exports = {
  ATS_RESUME_CSS,
  prepareAtsResumeHtml,
};
