const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs/promises");
const fetch = require("node-fetch");
const express = require("express");
const app = express();
const phantomJsCloud = require("phantomjscloud");

let apiKey = undefined;
let browser = new phantomJsCloud.BrowserApi(apiKey);

app.use(express.static("public"));

async function saveData(data) {
  //create json file
  await fs.writeFile(
    "data.json",
    JSON.stringify(
      data.properties.map((item) => {
        let newItem = {
          id: item.id,
          airbnb_property_id: item.airbnb_property_id,
          homeaway_property_id: item.homeaway_property_id,
          m_homeaway_property_id: item.m_homeaway_property_id,
          title: item.title,
          room_type: item.room_type,
          property_type: item.property_type,
          adr: item.adr,
          occ: item.occ,
          revenue: item.revenue,
          reviews: item.reviews,
          rating: item.rating,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          accommodates: item.accommodates,
          latitude: item.latitude,
          longitude: item.longitude,
          days_available: item.days_available,
          img_cover: item.img_cover,
        };
        newItem.link = `https://airbnb.com/rooms/${item.airbnb_property_id}`;
        newItem.regions = item.regions.zipcode_ids;
        return newItem;
      })
    )
  );

  //create csv file
  const csvWriter = createCsvWriter({
    path: "data.csv",
    header: [
      { id: "id", title: "ID" },
      { id: "airbnb_property_id", title: "Aribnb Property ID" },
      { id: "homeaway_property_id", title: "Homeaway Property ID" },
      { id: "m_homeaway_property_id", title: "M Homeaway Property ID" },
      { id: "title", title: "Title" },
      { id: "room_type", title: "Room Type" },
      { id: "property_type", title: "Property Type" },
      { id: "adr", title: "Avg. Daily Rate" },
      { id: "occ", title: "Occupancy" },
      { id: "revenue", title: "Revenue" },
      { id: "reviews", title: "Total Reviews" },
      { id: "rating", title: "Rating" },
      { id: "bedrooms", title: "Bedrooms" },
      { id: "bathrooms", title: "Bathrooms" },
      { id: "accommodates", title: "Accommodates" },
      { id: "latitude", title: "Latitude" },
      { id: "longitude", title: "Longitude" },
      { id: "days_available", title: "Days Available" },
      { id: "img_cover", title: "Image Cover" },
      { id: "link", title: "Link" },
      { id: "regions", title: "Regions" },
    ],
  });

  const records = require("./data.json");

  await csvWriter.writeRecords(records);
}

app.get("/get-data", async (req, res) => {
  let { url, fileType } = req.query;
  if (!url || !fileType) {
    return res.status(400).send("Wrong data");
  }
  try {
    var pageRequest = {
      url: "https://www.airdna.co/vacation-rental-data/app/us/california/santa-monica/overview",
      renderType: "automation",
      overseerScript: `await page.waitForNavigation({waitUntil:"domcontentloaded"}); \
    await page.on("response", async (response) => { \
      if ( \
        response.url().includes("https://api.airdna.co/v1/market/property_list") \
      ) { \
        page.meta.store.set("url", response.url()); \
      } \
    }); 
    `,
    };

    browser.requestSingle(pageRequest, async (err, userResponse) => {
      if (err) {
        console.log(err.message);
        return;
      }
      if (userResponse.statusCode != 200) {
        throw new Error("invalid status code" + userResponse.statusCode);
      }

      let targetURL =
        userResponse.pageResponses[0].automationResult.storage.url;

      const response = await fetch(targetURL);
      const data = await response.json();

      await saveData(data);

      if (fileType === "csv") {
        return res.download("data.csv");
      } else if (fileType === "json") {
        return res.download("data.json");
      }
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal server error  " + error.message);
  }
});

app.listen(process.env.PORT || 8888, () => {
  console.log("Server started!");
});