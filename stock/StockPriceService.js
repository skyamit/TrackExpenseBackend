const StockPrice = require("../model/StockPrice");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

async function fetchStockPrice2(symbol) {
  try {
    let searchData = symbol.slice(0, -3); // Remove .BO
    console.log(`Fetching stock price for: ${searchData}`);

    const url = `https://www.bseindia.com/stock-share-price/stockreach_financials.aspx?scripcode=${searchData}`;

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();

    // Set a user-agent to avoid getting blocked
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36");

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Wait for the price element to be available
    await page.waitForSelector("#idcrval", { timeout: 5000 });

    const content = await page.content();
    const $ = cheerio.load(content);
    const priceText = $("#idcrval").text().trim();

    await browser.close();

    if (!priceText) {
      throw new Error("Price not found on the page");
    }

    const price = parseFloat(priceText.replace(/,/g, ""));
    console.log(`✅ Fetched price: ${price}`);
    return price;
  } catch (error) {
    console.error(`❌ Error fetching price for ${symbol}:`, error);
    return null;
  }
}
async function fetchStockPrices(symbols) {
  const today = new Date().toISOString().split("T")[0];
  console.log("Inside fetchStockPrices");

  const priceMap = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      let stockData = await StockPrice.findOne({ symbol, date: today });

      if (stockData) {
        console.log(`Returning cached price for ${symbol}`);
        priceMap[symbol] = stockData.currentPrice;
        return;
      }

      let price = await fetchStockPrice2(symbol);
      if (!price) {
        console.log(`❌ Failed to fetch price for ${symbol}`);
        return;
      }

      stockData = {
        symbol,
        date: today,
        time: new Date().toLocaleTimeString(),
        currentPrice: price,
      };

      await StockPrice.findOneAndUpdate({ symbol, date: today }, stockData, {
        upsert: true,
        new: true,
      });

      priceMap[symbol] = price;
    })
  );

  return priceMap;
}

module.exports = { fetchStockPrices };
