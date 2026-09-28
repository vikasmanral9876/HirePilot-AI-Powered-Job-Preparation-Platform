const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const { htmlA, htmlB, htmlC } = require("./test_samples");
const { vikasHtml } = require("./simulate_density_test");
const { prepareAtsResumeHtml, detectResumeDensity } = require("../src/services/resumeTemplate.service");

async function runTests() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const testCases = [
    { name: "Vikas Manral (User Sample)", html: vikasHtml },
    { name: "Test B (Priya Nair Fresher)", html: htmlB },
    { name: "Test A (Arjun Sharma Junior)", html: htmlA },
    { name: "Test C (Vikramaditya Sen Senior)", html: htmlC },
  ];

  console.log("=========================================================================");
  console.log("             TESTING MASTER ATS TEMPLATE ON ALL 4 RESUMES                ");
  console.log("=========================================================================");

  for (const tc of testCases) {
    const page = await browser.newPage();
    const formattedHtml = prepareAtsResumeHtml(tc.html);
    const density = detectResumeDensity(tc.html);
    await page.setContent(formattedHtml, { waitUntil: "networkidle0" });

    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const ratio = ((scrollHeight / 1036.1) * 100).toFixed(1);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0.45in", bottom: "0.45in", left: "0.48in", right: "0.48in" },
    });

    const parser = new pdfParse.PDFParse(Uint8Array.from(pdfBuffer));
    const info = await parser.getInfo();

    console.log(`\n[${tc.name}]`);
    console.log(`  - Density Detected: density-${density}`);
    console.log(`  - Scroll Height: ${scrollHeight}px / 1036px (${ratio}% usable A4 height)`);
    console.log(`  - Total Pages: ${info.total}`);

    const safeFilename = tc.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".pdf";
    fs.writeFileSync(path.join(__dirname, safeFilename), pdfBuffer);
    console.log(`  - Output PDF saved: ${safeFilename}`);

    await page.close();
  }

  await browser.close();
}

runTests();
