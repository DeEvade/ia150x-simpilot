import { MongoClient, ServerApiVersion } from "mongodb"
import { callSignToNato } from "../src/string_processing.js"

const uri = "mongodb://vm.cloud.cbh.kth.se:20136/" // Connection string to MongoDB

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function main() {
  try {
    await client.connect() // Ensure connection happens first
    const dbo = client.db("main") // Access the database

    // Fetch callsign
    const csObj = await randomCallsign(dbo) // Await the call to randomCallsign()

    // Modify and process callsign
    const numbers = "0123456789"
    for (let i = 0; i < 3; i++) {
      csObj.tlcs += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }

    let spokenNumbers = callSignToNato(csObj.tlcs.substring(3, 6))
    csObj.cs += " " + spokenNumbers

    let spokenCallSign = callSignToNato(csObj.tlcs)

    return {
      written: csObj.tlcs,
      spoken: spokenCallSign,
      phonetic: csObj.cs,
    }
  } catch (error) {
    console.error("Error in main:", error)
    throw error // Make sure errors bubble up for proper handling
  }
}

async function randomCallsign(dbo) {
  try {
      let result;
      //använder oftast "vanliga" callsigns
      const chance = Math.random();
      if(chance < 1/4){
        result = await dbo
      .collection("callsigns")
      .aggregate([{ $sample: { size: 1 } }, { $project: { _id: 0, cs: 1, tlcs: 1 } }])
      .toArray()
      }
      else{
        result = await dbo
      .collection("callsigns_special")
      .aggregate([{ $sample: { size: 1 } }, { $project: { _id: 0, cs: 1, tlcs: 1 } }])
      .toArray()
      }
    if (result.length > 0) {
      return {
        tlcs: result[0].tlcs,
        cs: result[0].cs,
      }
    } else {
      throw new Error("No callsign data found.")
    }
  } catch (error) {
    console.error("Error in randomCallsign:", error)
    throw error // Propagate the error so the caller can handle it
  }
}
async function closeConnection() {
  try {
    await client.close() // Make sure we close the connection after all operations
  } catch (error) {
    console.error("Error closing connection:", error)
  }
}

//import wtf from "wtfnode";
//setTimeout(() => {
//console.log("Open handles:");
//wtf.dump();
//}, 5000);

export { main, closeConnection } // Export functions to use in other files
