import { Document, MongoClient, ServerApiVersion, WithId } from "mongodb"
import { numberToString2, stringToNumber } from "./string_processing"
import { parseTranscribedText, transcribeText } from "./utils"
import { CallsignObject, Command } from "./interfaces"
import * as fs from "fs"
import * as path from "path"
const uri = "mongodb://vm.cloud.cbh.kth.se:20136/"
const batchSize = 5
const testSize = 50 //  change according to size of testing collection
let callsignCounter = 0
let actionCounter = 0
let parameterCounter = 0
let totalCounter = 0
const counter = { totalCounter, callsignCounter, actionCounter, parameterCounter }

interface TestCase {
  sentence: string
  action: string
  callsignObject: CallsignObject
  usedCallsign: string
  parameterPhonetic: string
  parameter: number | string | null
  audio: string
  user: string
}

interface FullTestCase {
  testCase: TestCase
  transcribedSentence: string
}
const client = new MongoClient(uri)

const run = async () => {
  const logFilePath = path.join(__dirname, "fullTest.log")

  await client.connect()
  console.log("Connected to MongoDB!")
  const dbo = client.db("main")
  const collection = dbo.collection("speech_samples_testing")
  const testSize = await collection.countDocuments()
  console.log(testSize)

  let i = 0
  while (i - batchSize < testSize) {
    const testCasesArray: FullTestCase[] = []
    for (let j = 0; j < batchSize; j++, i++) {
      let testCase = (await collection.find().skip(i).limit(1).next()) as unknown as TestCase
      if (!testCase) {
        throw new Error("testcase null")
      }

      testCasesArray.push({ testCase, transcribedSentence: "" })
    }
    let callSignArray: CallsignObject[] = []
    testCasesArray.forEach((testCase) => {
      callSignArray.push(testCase.testCase.callsignObject)
    })
    for (const test of testCasesArray) {
      const testCase = test.testCase
      let transcribedSentence = await transcribeText(testCase.audio, callSignArray)
      if (!transcribedSentence) {
        console.error("Failed to transcribe audio")
        continue
      }
      test.transcribedSentence = transcribedSentence
    }
    const scrambledArray = shuffleArray([...testCasesArray])
    await entityAndIntentTest(scrambledArray, callSignArray)
    console.log("wrong: ", counter)
    console.log("-------------------------------------------------------")
    console.log("-------------------------------------------------------")
  }

  const configJSON = fs.readFileSync(path.join(__dirname, "../../config.json"), "utf-8")
  let log = i.toString() + "\n\n\n" + counter.toString() + "\n\n\n" + configJSON

  fs.appendFile(logFilePath, log, (err) => {
    if (err) {
      console.error("Failed to write log:", err)
    }
  })
}

async function entityAndIntentTest(
  testCasesArray: FullTestCase[],
  callSignArray: CallsignObject[],
) {
  for (const testCase of testCasesArray) {
    try {
      let somethingWrong = false
      const response = await parseTranscribedText(testCase.transcribedSentence, callSignArray)
      if (!response) {
        continue
      }
      //console.log("response4123", response)

      let responseJSON = JSON.parse(response.processedTranscript) as Command
      console.log("responseJSON", responseJSON)

      if (responseJSON) {
        if (
          !responseJSON?.callSign ||
          responseJSON.callSign.toUpperCase() !=
            testCase.testCase.callsignObject.written.toUpperCase()
        ) {
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
        let realParameter = testCase.testCase.parameter
        let generatedParameter = responseJSON.parameter
        if (typeof realParameter === "string" && typeof generatedParameter === "string") {
          realParameter = realParameter.toUpperCase()
          generatedParameter = generatedParameter.toUpperCase()
        }
        if (generatedParameter != realParameter) {
          console.log("expected: " + realParameter + " got " + generatedParameter)
          console.log("the full sentence was: " + testCase.testCase.sentence)
          counter.parameterCounter++
          somethingWrong = true
        }
      }
      if (somethingWrong) {
        counter.totalCounter++
      }
    } catch (error) {
      counter.totalCounter++
      counter.callsignCounter++
      counter.actionCounter++
      counter.parameterCounter++
      console.error("Error parsing response:", error)
    }
  }
}

run()

//Fisher yates not ours
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)) // random index from 0 to i
    ;[array[i], array[j]] = [array[j], array[i]] // swap elements
  }
  return array
}
