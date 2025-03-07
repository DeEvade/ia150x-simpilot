const { MongoClient, ServerApiVersion } = require("mongodb");
const { callSignToNato } =  require("./string_processing");

const uri =
    "mongodb+srv://arontiselius:qN9aRsnlyyE42qHB@ia150x.wxac7.mongodb.net/?retryWrites=true&w=majority&appName=IA150X";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function main(){
    const numbers = '0123456789';
    let csObj = await randomCallsign(); 

    for (let i = 0; i < 3; i++) {
        csObj.tlcs += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    let spokenNumbers = callSignToNato(csObj.tlcs.substring(3,6));
    csObj.cs += " " + spokenNumbers;
    let spokenCallSign = callSignToNato(csObj.tlcs);
    console.log(csObj.tlcs + ' spoken: ' + spokenCallSign);

    let objectCallsign = 
        {written : csObj.tlcs, 
            spoken : spokenCallSign,
            phonetic : csObj.cs
        };
    console.log(objectCallsign);
    return objectCallsign;
}

async function randomCallsign(){
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const dbo = client.db("main");

        const result = await dbo.collection("callsigns").aggregate([
            { $sample: { size: 1 } },       
            { $project: { _id: 0, cs: 1, tlcs: 1 } }
        ]).toArray();

        await client.close();
        console.log("from F_P: " + result[0].cs + " : " + result[0].tlcs)
        const obj = result.length > 0 ? {
            tlcs : result[0].tlcs,
            cs : result[0].cs
        } : null;
        return obj;
    }
    catch{
        await client.close();
        return null;
    }
}

main();
