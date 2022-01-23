const puppeteer = require("puppeteer");
const express = require("express");

const app = express();

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/", async ({ body: { spaceURL } }, res) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: "chrome",
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto(spaceURL, {
      waitUntil: "networkidle2",
    });
    const PlayRecording = '[aria-label="Play recording"]';
    const Play = '[aria-label="Play"]';
    await page.waitForSelector(PlayRecording);
    await (await page.$(PlayRecording)).click();
    await page.waitForSelector(Play);
    await (await page.$(Play)).click();
    page.on("response", async (e) => {
      if (RegExp(".m3u8").test(e.url())) {
        const URL = e.url().toString();
        res.status(200).json({
          spaceURL,
          spaceMediaURL: URL,
        });
        await browser.close();
        console.log("closed");
      }
    });
  } catch (error) {
    await browser.close();
    res.status(400).json({
      spaceURL,
      error,
    });
  }
});

app.listen(PORT, () => console.log(`server is running on localhost:${PORT}`));
