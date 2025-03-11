import { MongoClient, ServerApiVersion } from 'mongodb';
import { callSignToNato } from './string_processing.js';

const uri =
    "mongodb+srv://arontiselius:qN9aRsnlyyE42qHB@ia150x.wxac7.mongodb.net/?retryWrites=true&w=majority&appName=IA150X";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function main() {
    try {
        await client.connect();  // Ensure connection happens first
        const dbo = client.db("main");  // Access the database

        // Fetch callsign
        const csObj = await randomCallsign(dbo);  // Await the call to randomCallsign()

        // Modify and process callsign
        const numbers = '0123456789';
        for (let i = 0; i < 3; i++) {
            csObj.tlcs += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        let spokenNumbers = callSignToNato(csObj.tlcs.substring(3, 6));
        csObj.cs += " " + spokenNumbers;

        let spokenCallSign = callSignToNato(csObj.tlcs);

        return {
            written: csObj.tlcs,
            spoken: spokenCallSign,
            phonetic: csObj.cs
        };
    } catch (error) {
        console.error("Error in main:", error);
        throw error;  // Make sure errors bubble up for proper handling
    }
}



async function randomCallsign(dbo) {
    try {
        const result = await dbo.collection("callsigns").aggregate([
            { $sample: { size: 1 } },
            { $project: { _id: 0, cs: 1, tlcs: 1 } }
        ]).toArray();

        if (result.length > 0) {
            return {
                tlcs: result[0].tlcs,
                cs: result[0].cs
            };
        } else {
            throw new Error("No callsign data found.");
        }
    } catch (error) {
        console.error("Error in randomCallsign:", error);
        throw error;  // Propagate the error so the caller can handle it
    }
}
async function closeConnection() {
    try {
        await client.close();  // Make sure we close the connection after all operations
    } catch (error) {
        console.error("Error closing connection:", error);
    }
}

//import wtf from "wtfnode";
//setTimeout(() => {
    //console.log("Open handles:");
    //wtf.dump();
    //}, 5000);

export { main, closeConnection };  // Export functions to use in other files

