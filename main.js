import express, { json, urlencoded } from "express";
import Puppeter from "puppeteer-core";
const app = express();

const PORT = 3000;

app.use(json());
app.use(urlencoded({ extended: true }));

app.post("/", async ({ body: { spaceURL } }, res) => {
  const browser = await Puppeter.launch({
    executablePath: "chrome",
    headless: false,
  });

  const page = await browser.newPage();

  try {
    await page.goto(spaceURL, {
      waitUntil: "networkidle2",
    });
    const PlayRecording = '[aria-label^="Play rec"]';
    await page.waitForSelector(PlayRecording, {
      timeout: 5000,
    });
    await page.click(PlayRecording);
  } catch (error) {
    await browser.close();
    res.status(400).json({
      spaceURL,
      error: "Space Scraping Failed!",
    });
    return;
  }
  page.on("request", async (e) => {
    if (!RegExp(".m3u8").test(e.url())) return;
    await browser.close();
    res.status(200).json({
      spaceURL,
      spaceMediaURL: e.url().toString(),
    });
    return page.off("request");
  });

  setTimeout(async () => {
    await browser.close();
    if (!res.headersSent)
      res.status(400).json({
        spaceURL,
        error: "Fetching Time Out!",
      });
    return;
  }, 15 * 1000);
});

app.use(function (req, res, next) {
  res.status(404);

  // respond with html page
  if (req.accepts("html")) {
    res.status(404).send(`
        <h1>404! You Dumbass</h1>
        <style>
        body{
          margin:0;
          padding:0;
          width:100%;
          height:100vh;
          display:grid; 
          align-items:center; 
          overflow:hidden;
        }
        h1{
          margin: auto auto;
        }
        div{

        }
        </style>
        `);
    return;
  }

  // respond with json
  if (req.accepts("json")) {
    res.status(404).json({ error: "404! You Dumbass" });
    return;
  }

  // default to plain-text. send()
  res.status(404).type("txt").send("Not found");
});

app.listen(PORT, () => console.log(`server is running on localhost:${PORT}`));
