const Asset = require("../model/Asset");
const Earning = require("../model/Earning");
const Expense = require("../model/Expense");

async function saveAsset({ userId, value, name, description, date, type, code }) {
  try {
    let asset = new Asset({
      userId,
      type,
      value,
      name,
      description,
      date,
      code
    });
    await asset.save();
    return asset._id;
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function updateAsset({assetId, value}) {
    let asset = await Asset.findById(assetId);
    if (asset) {
      if (asset.value === value) {
        await asset.deleteOne({_id: assetId});
      }
      else {
        asset.value -= value;
        await asset.save();
      }
    }
}

async function deleteAsset(req, res) {
  try {
    let { assetId } = req.body;
    let asset = await Asset.findById(assetId);
    if (asset) {
      await Asset.deleteOne({ _id: assetId });
      await Earning.deleteMany({ assetId: assetId });
      await Expense.deleteMany({ assetId: assetId });
      res.json({ message: "Deleted asset successfully" });
    } else {
      res.status(500).json({ message: "Invalid asset" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function sellAsset(req, res) {
  try {
    let { assetId, soldFor } = req.body;
    let asset = await Asset.findById(assetId);
    if (asset) {
      await Asset.deleteOne({ _id: assetId });
      let earning = new Earning({
        userId: asset.userId,
        amount: soldFor,
        source: asset.name,
        description: "Sold " + asset.name,
        date: new Date().toISOString().split("T")[0],
        medium: "online",
        type: "asset",
        assetType: "asset",
        assetId: assetId,
      })
      await earning.save();
      res.json({ message: "Sold asset successfully" });
    } else {
      res.status(500).json({ message: "Invalid asset" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllAsset(req, res) {
  try {
    const { userId, limit = 10, offset = 0, filter = {} } = req.body;
    const pageLimit = parseInt(limit, 10);
    const pageOffset = parseInt(offset, 10);
    const { year = 2025, month, query } = filter;

    let searchQuery = {
      userId: userId,
      date: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`),
      },
    };

    if (month) {
      searchQuery.date = {
        $gte: new Date(`${year}-${month}-01`),
        $lt: new Date(`${year}-${parseInt(month) + 1}-01`),
      };
    }
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    let assetList = await Asset.find(searchQuery)
      .skip(pageOffset)
      .limit(pageLimit)
      .sort({ date: -1 });

    let count = await Asset.countDocuments(searchQuery);

    res.json({
      assetList,
      count,
      limit: pageLimit,
      offset: pageOffset,
      totalPages: Math.ceil(count / pageLimit),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getYahooAuthToken() {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET_KEY;

  if (!clientId || !clientSecret) {
    console.error("Missing Yahoo API credentials");
    return null;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64"); // Encode credentials
  const clientAssertion = jsonwe.sign(payload, clientSecret, { algorithm: 'RS256' });
  try {
    const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`, // Use Basic Authentication
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
      }).toString(),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Yahoo API Error:", data);
      return null;
    }

    console.log("Yahoo OAuth Token:", data.access_token);
    return data.access_token;
  } catch (error) {
    console.error("Error fetching Yahoo OAuth token:", error);
    return null;
  }
}


async function fetchStockPrices(symbols) {
  const accessToken = await getYahooAuthToken();
  if (!accessToken) {
    console.error("Failed to get Yahoo OAuth token");
    return;
  }

  const symbolsString = symbols.join(",");
  const url = `https://yfapi.net/v6/finance/quote?region=IN&lang=en&symbols=${symbolsString}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Stock Prices:", data.quoteResponse.result);
    return data.quoteResponse.result;
  } catch (error) {
    console.error("Error fetching stock prices:", error);
  }
}

async function fetchAllAssetWithValue(req, res) {
  try {
    const { userId } = req.body;

    let searchQuery = {
      userId: userId,
    };

    let assetList = await Asset.find(searchQuery).sort({ date: -1 });

    const uniqueFundCode = [
      ...new Set(
        assetList
          .filter((asset) => asset.type === "Mutual Fund" && asset.code)
          .map((asset) => asset.code)
      ),
    ];
    const uniqueStockCode = [
      ...new Set(
        assetList
          .filter((asset) => asset.type === "Stock" && asset.code)
          .map((asset) => asset.code)
      ),
    ];

    const navMap = {};
    if (uniqueFundCode.length > 0) {
      let navData = await getMultipleFundsNAVFromCode(uniqueFundCode);
      navData.forEach((fund) => {
        navMap[fund.code] = fund.nav;
      });
    }
    if (uniqueStockCode.length > 0) {
      let stockData = await fetchStockPrices(uniqueStockCode);
      stockData.forEach((stock) => {
        navMap[stock.code] = stock.nav;
      });
    }
    console.log(navMap);

    assetList = assetList.map((asset) => {
      if (asset.code && navMap[asset.code]) {
        return {
          ...asset._doc,
          value: asset.value * navMap[asset.code],
        };
      }
      return asset;
    });
    res.json({ assetList });
  } catch (error) {
    console.error("Error fetching mutual fund NAVs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getMultipleFundsNAVFromName(fundNames) {
  try {
    let navResults = [];

    for (const fundName of fundNames) {
      let searchResponse = await fetch(
        `https://api.mfapi.in/mf/search?q=${encodeURIComponent(fundName)}`
      );
      let searchData = await searchResponse.json();

      if (!searchData.length) {
        console.log(`No matching fund found for: ${fundName}`);
        continue;
      }

      for (const searchD of searchData) {
        let schemeCode = searchD.schemeCode;

        let navResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
        let navData = await navResponse.json();
        let latestNAV = navData.data[0].nav;
        navResults.push({ name: navData.meta.scheme_name, nav: latestNAV });
      }
    }
    return navResults;
  } catch (error) {
    console.error("Error fetching NAV:", error);
  }
}

async function getMultipleFundsNAVFromCode(fundSchemeCodes) {
  try {
    let navResults = [];

    for (const schemeCode of fundSchemeCodes) {
      console.log(schemeCode);
      let navResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      let navData = await navResponse.json();
      let latestNAV = navData.data[0].nav;
      navResults.push({ code: navData.meta.scheme_code, nav: latestNAV });
    }
    return navResults;
  } catch (error) {
    console.error("Error fetching NAV:", error);
  }
}

module.exports = {
  getAllAsset,
  deleteAsset,
  sellAsset,
  fetchAllAssetWithValue,
  saveAsset,
  updateAsset
};
