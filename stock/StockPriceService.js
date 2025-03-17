const StockPrice = require("../model/StockPrice");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

async function fetchStockPrice2(symbol) {
  try {
    let searchData = symbol.slice(0, -3);
    console.log("Inside fetchstockpric2");
    const url = `https://www.bseindia.com/stock-share-price/stockreach_financials.aspx?scripcode=`+searchData;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const content = await page.content();
    const $ = cheerio.load(content);
    const priceText = $("#idcrval").text().trim();
    console.log(priceText);
    await browser.close();

    return priceText ? parseFloat(priceText.replace(/,/g, "")) : null;
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
