const StockPrice = require("../model/StockPrice");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const Stock = require("../model/Stock");

async function scrapeAndStoreStockPrices() {
  const stockSymbols = await StockPrice.distinct("symbol");
  const today = new Date().toISOString().split("T")[0];

  console.log(`Found ${stockSymbols.length} stocks to update`);

  const maxRetries = 3;
  for (const symbol of stockSymbols) {
    let value = null;
    let attempts = 0;

    while (attempts < maxRetries) {
      value = await fetchStockPrice(symbol);
      if (value !== null) break; 
      attempts++;
      console.log(`Retry ${attempts} for ${symbol}`);
    }

    if (value === null) {
      console.error(
        `Failed to fetch price for ${symbol} after ${maxRetries} attempts`
      );
      continue;
    }

    try {
      await StockPrice.findOneAndUpdate(
        { symbol }, 
        {
          symbol,
          date: today,
          time: new Date().toLocaleTimeString(),
          currentPrice: value,
        },
        { upsert: true }
      );

      console.log(`Updated price for ${symbol}: ₹${value}`);
    } catch (error) {
      console.error(`Error updating DB for ${symbol}:`, error.message);
    }
  }

  console.log("Stock price scraping completed!");
}

async function fetchStockPrice(symbol) {
  try {
    let searchData = symbol.slice(0, -3);
    console.log(`Fetching stock price for: ${searchData}`);

    const url = `https://www.bseindia.com/stock-share-price/stockreach_financials.aspx?scripcode=${searchData}`;

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["image", "stylesheet", "font"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 5000 });

    await page.waitForSelector("#idcrval", { timeout: 3000 });

    const content = await page.content();
    const $ = cheerio.load(content);
    const priceText = $("#idcrval").text().trim();

    await browser.close();

    if (!priceText) {
      throw new Error("Price not found on the page");
    }

    const price = parseFloat(priceText.replace(/,/g, ""));
    console.log(`Fetched price: ${price}`);
    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

async function fetchStockPrices(symbols) {
  const today = new Date().toISOString().split("T")[0];
  console.log("Inside fetchStockPrices");

  const existingStocks = await StockPrice.find({
    symbol: { $in: symbols },
    date: today,
  });
  const stockMap = new Map(
    existingStocks.map((stock) => [stock.symbol, stock])
  );

  const priceData = [];
  const bulkOps = [];

  await Promise.all(
    symbols.map(async (symbol) => {
      let stockData = stockMap.get(symbol);

      if (stockData) {
        let stockObj = stockData.toObject();
        stockObj["code"] = stockData.symbol;
        stockObj["lastUpdated"] = stockData.updatedAt;
        stockObj["nav"] = stockData.currentPrice;
        priceData.push(stockObj);
        return;
      }

      let price = await fetchStockPrice(symbol);
      if (!price) {
        console.log(`Failed to fetch price for ${symbol}`);
        return;
      }

      let newStockData = {
        symbol,
        date: today,
        time: new Date().toLocaleTimeString(),
        currentPrice: price,
      };

      bulkOps.push({
        updateOne: {
          filter: { symbol },
          update: { $set: newStockData },
          upsert: true,
        },
      });

      newStockData["code"] = symbol;
      newStockData["lastUpdated"] = new Date();
      newStockData["nav"] = price;
      priceData.push(newStockData);
    })
  );

  if (bulkOps.length > 0) {
    await StockPrice.bulkWrite(bulkOps);
  }

  return priceData;
}

module.exports = { fetchStockPrices, scrapeAndStoreStockPrices };
