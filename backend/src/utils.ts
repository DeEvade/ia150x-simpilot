import xml2js from "xml2js"
import { Action } from "../interfaces"
import { MongoClient } from "mongodb"
export function isValidXML(xmlString: string) {
    return new Promise((resolve) => {
        xml2js.parseString(xmlString, (err) => {
            resolve(!err)
        })
    })
}

export const ActionTypes = Object.freeze({
    CLEARED_FLIGHT_LEVEL: "cleared flight level",
    CLEARED_ALTITUDE: "cleared altitude",
    CLEARED_AIRSPEED: "cleared airspeed",
    CLEARED_MACH: "cleared mach",
    CLEARED_HEADING: "cleared heading",
    CANCEL_SPEED: "cancel speed",
    CANCEL_HEADING: "cancel heading",
    CLEARED_DIRECT: "cleared direct",
})

const actionMap = {
    [ActionTypes.CLEARED_FLIGHT_LEVEL]: { name: "clr_fl", unit: "fl" },
    [ActionTypes.CLEARED_ALTITUDE]: { name: "not a real command", unit: "ft" },
    [ActionTypes.CLEARED_AIRSPEED]: { name: "clr_ias", unit: null },
    [ActionTypes.CLEARED_MACH]: { name: "clr_mach", unit: null },
    [ActionTypes.CLEARED_HEADING]: { name: "clr_hdg", unit: "deg" },
    [ActionTypes.CANCEL_SPEED]: { name: "clr_ias", unit: null },
    [ActionTypes.CANCEL_HEADING]: { name: "clr_hdg", unit: "deg" },
    [ActionTypes.CLEARED_DIRECT]: { name: "clr_dct", unit: null },
}

export const parseAction = (action: string) => {
    if (!action) {
        console.error("no discernable action")
        return null;
    }
    return actionMap[action.toLowerCase() as keyof typeof actionMap] || null
}

type TestCase = {
    tlcs: string;
    cs: string;
};

export const findICAO = async (callsignsTL: string[]): Promise<Record<string, string>> => {
    const uri = "mongodb://vm.cloud.cbh.kth.se:20136/";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const dbo = client.db("main");
        const collection = dbo.collection("callsigns");

        const result: Record<string, string> = {};

        for (const tl of callsignsTL) {
            const shortTl = tl.slice(0, 3); // safer than substring
            const match = await collection.findOne({ tlcs: shortTl }) as TestCase | null;

            if (match) {
                result[tl] = match.cs;
            }
        }

        return result;
    } finally {
        await client.close();
    }
};

export const findSingleICAO = async (callsignTL: string): Promise<string> => {
    const uri = "mongodb://vm.cloud.cbh.kth.se:20136/";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const dbo = client.db("main");
        const collection = dbo.collection("callsigns");


        const shortTl = callsignTL.slice(0, 3);
        const match = await collection.findOne({ tlcs: shortTl }) as TestCase | null;

        if (match) {
            return match.cs + " " + callsignTL.slice(3);
        }
        return "";

    } finally {
        await client.close();
    }
};

