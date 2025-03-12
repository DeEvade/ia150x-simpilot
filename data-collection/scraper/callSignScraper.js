const cheerio = require("cheerio")
const { MongoClient, ServerApiVersion } = require("mongodb")

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const uri = "mongodb://vm.cloud.cbh.kth.se:20136/"

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

const run = async () => {
  try {
    await client.connect()
    console.log("Connected to MongoDB!")
    const dbo = client.db("main")

    for (let i = 0; i < letters.length; i++) {
      const url = "https://123atc.com/call-signs/" + letters[i]
      const response = await fetch(url)
      const $ = cheerio.load(await response.text())

      const insertPromises = []

      $("table tbody tr").each((index, row) => {
        let $letters = $(row).find("td").first().find("a")
        let $phonetic = $(row).find("td").eq(1)
        if ($phonetic.text() === "(None)") return

        let objectCallSign = {
          tlcs: $letters.text(),
          cs: $phonetic.text(),
        }

        insertPromises.push(dbo.collection("callsigns").insertOne(objectCallSign))
      })

      await Promise.all(insertPromises)
    }
  } catch (err) {
    console.error(err)
  } finally {
    await client.close()
    console.log("MongoDB connection closed.")
  }
}

run().catch(console.dir)
