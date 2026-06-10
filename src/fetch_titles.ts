const urls = [
  "Hn4GXjXL",
  "VvByn5nw",
  "qqXfygyV",
  "brHXkdbK",
  "Fzgt31c8",
  "ZnFkp03D",
  "zvSmK3Wt",
  "QCkL1V5f",
  "J0cwZtJQ",
  "wMd81DtG",
  "qqdVN2tQ",
  "VvcQJXSj",
  "PJksC1L1",
  "fyhnVY3J",
  "QCrGFcBB",
  "C18pMcKn"
];

async function run() {
  console.log("Fetching titles for viewer pages...");
  for (let i = 0; i < urls.length; i++) {
    const code = urls[i];
    const url = `https://postimg.cc/${code}`;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      const html = await response.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "No Title";
      
      const metaNameMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      const description = metaNameMatch ? metaNameMatch[1].trim() : "No Description";

      console.log(`URL #${i + 1} (https://postimg.cc/${code}):`);
      console.log(`  TITLE: ${title}`);
      console.log(`  DESC:  ${description}`);
      console.log("-".repeat(40));
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
    }
  }
}

run();
