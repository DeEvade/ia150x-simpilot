import { Document, MongoClient, ServerApiVersion, WithId } from "mongodb"
import { numberToString2, stringToNumber } from "./string_processing"
import { parseTranscribedText, transcribeText } from "./utils"
import { Command } from "./interfaces"
const uri = "mongodb://vm.cloud.cbh.kth.se:20136/"
    const batchSize = 1
//const testSize = 100 //  change according to size of testing collection
let callsignCounter = 0
let actionCounter = 0
let parameterCounter = 0
let totalCounter = 0
const counter = { totalCounter, callsignCounter, actionCounter, parameterCounter }

interface TestCase {
    testCase: WithId<Document>
    transcribedSentence: any
}
const client = new MongoClient(uri)

const run = async () => {
    await client.connect()
    console.log("Connected to MongoDB!")
    const dbo = client.db("main")
    const collection = dbo.collection("speech_samples_testing")
    const testSize = await collection.countDocuments()
    console.log(testSize)

    let i = 0
    while (i - batchSize < testSize) {
        const testCasesArray = []
        for (let j = 0; j < batchSize; j++, i++) {
            let testCase = await collection.find().skip(i).limit(1).next()
            if (!testCase) {
                throw new Error("testcase null")
            }

            let transcribedSentence = await transcribeText(testCase.audio)
            testCasesArray.push({ testCase, transcribedSentence })
        }
        await entityAndIntentTest(testCasesArray)
        console.log("wrong: ", counter)
        console.log("-------------------------------------------------------")
        console.log("-------------------------------------------------------")
    }
}

async function entityAndIntentTest(testCasesArray: TestCase[]) {
    let callSignArray: string[] = []
    testCasesArray.forEach((testCase: TestCase) => {
        callSignArray.push(testCase.testCase.callsignObject.written)
        callSignArray.push(testCase.testCase.callsignObject.usedCallsign)
    })

    for (const testCase of testCasesArray) {
        try {
            let somethingWrong = false;
            const response = await parseTranscribedText(testCase.transcribedSentence, callSignArray)
            if (!response) {
                continue
            }
            //console.log("response4123", response)

            let responseJSON = JSON.parse(response.processedTranscript) as Command
            console.log("responseJSON", responseJSON)

            if (responseJSON) {
                if (responseJSON.callSign != testCase.testCase.callsignObject.written) {
                    counter.callsignCounter++
                        somethingWrong = true
                        console.log(
                            "expected: " +
                                testCase.testCase.callsignObject.written +
                                " got " +
                                responseJSON.callSign,
                    )
                    console.log("the full sentence was: " + testCase.testCase.sentence)
                }

                if (responseJSON.action != testCase.testCase.action) {
                    counter.actionCounter++
                        somethingWrong = true
                        console.log("expected: " + testCase.testCase.action + " got " + responseJSON.action)
                    console.log("the full sentence was: " + testCase.testCase.sentence)
                }
                let realParameter =
                    testCase.testCase.parameter == null ? null : stringToNumber(testCase.testCase.parameter)
                let generatedParameter =
                    responseJSON.parameter == null ? null : responseJSON.parameter.toString()
                if (generatedParameter != realParameter) {
                    console.log("expected: " + realParameter + " got " + generatedParameter)
                    console.log("the full sentence was: " + testCase.testCase.sentence)
                    counter.parameterCounter++
                        somethingWrong = true
                }
            }
            if(somethingWrong){
                totalCounter++;
            }
        } catch (error) {
            counter.totalCounter++;
            counter.callsignCounter++
            counter.actionCounter++
            counter.parameterCounter++
            console.error("Error parsing response:", error)
        }
    }
}

run()
