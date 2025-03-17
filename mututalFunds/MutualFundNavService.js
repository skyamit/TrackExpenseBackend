const MutualFundNav = require("../model/MutualFundNav");

async function getMultipleFundsNAVFromCode(fundSchemeCodes) {
  try {
    let today = new Date().toISOString().split("T")[0];
    let navResults = [];

    let existingNavData = await MutualFundNav.find({
      code: { $in: fundSchemeCodes },
      date: today,
    });

    let existingNavMap = {};
    existingNavData.forEach((nav) => {
      existingNavMap[nav.code] = nav;
    });

    let schemesToFetch = fundSchemeCodes.filter(
      (code) => !existingNavMap[code]
    );

    if (schemesToFetch.length === 0) {
      console.log("Returning cached NAV data from DB.");
      return existingNavData;
    }

    for (const code of schemesToFetch) {
      console.log(`Fetching NAV for: ${code}`);
      let navResponse = await fetch(`https://api.mfapi.in/mf/${code}`);
      let navData = await navResponse.json();

      if (!navData.data || navData.data.length === 0) {
        console.log(`No NAV data found for code: ${code}`);
        continue;
      }

      let latestNAV = parseFloat(navData.data[0].nav);
      let fundName = navData.meta.scheme_name;

      // Store in DB
      const navEntry = await MutualFundNav.findOneAndUpdate(
        { code },
        {
          code,
          name: fundName,
          date: today,
          nav: latestNAV,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      navResults.push(navEntry);
    }

    // Combine cached + newly fetched data
    return [...existingNavData, ...navResults];
  } catch (error) {
    console.error("Error fetching NAV:", error);
    return [];
  }
}

module.exports = { getMultipleFundsNAVFromCode };
