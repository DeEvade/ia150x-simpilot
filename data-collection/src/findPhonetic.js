const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
    "mongodb+srv://arontiselius:qN9aRsnlyyE42qHB@ia150x.wxac7.mongodb.net/?retryWrites=true&w=majority&appName=IA150X";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

export async function findPhonetic(callsign){
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const dbo = client.db("main");
        const result = await dbo.collection("callsigns").findOne({ tlcs: callsign }, { projection: { _id: 0, cs: 1 } });

        await client.close();
        return result;
    }
    catch{
        await client.close();
        return null;
    }
}

export default findPhonetic;

