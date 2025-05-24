import { MongoClient, ServerApiVersion } from "mongodb"
import { numberToString2 } from "./string_processing"
import { transcribeText } from "./utils"
const uri = "mongodb://vm.cloud.cbh.kth.se:20136/"
const whisperURI = "http://localhost:8080"
const testSize = 100 //  change according to size of testing collection

const client = new MongoClient(uri)

const timeArray: number[] = []

const run = async () => {
  let totalWrongCounter = 0
  let totalLength = 0
  await client.connect()
  console.log("Connected to MongoDB!")
  const dbo = client.db("main")
  const collection = dbo.collection("speech_samples_testing")

  for (let i = 0; i < testSize; i++) {
    let testCase = await collection.find().skip(i).limit(1).next()
    if (!testCase) {
      throw new Error("testcase null")
    }
    let realSentence = JSON.stringify(testCase.sentence)
    realSentence = realSentence.replace(/"/g, "")
    const timeBefore = new Date().getTime()

    let transcribedSentence = (await transcribeText(testCase.audio, [])) || ""
    const timeAfter = new Date().getTime()
    const timeDiff = timeAfter - timeBefore
    timeArray.push(timeDiff)
    console.log("Time taken: ", timeDiff)
    transcribedSentence = processTranscription(transcribedSentence)
    console.log("-------------------------------------------------------")
    console.log("-------------------------------------------------------")
    console.log("Real spoken sentence: ", realSentence)
    console.log("Transcribed sentence: ", transcribedSentence)
    const { length, wer, wrongCounter } = wordErrorRate(realSentence, transcribedSentence)
    totalWrongCounter += wrongCounter
    totalLength += length

    const totalWer = (totalWrongCounter / totalLength) * 100
    console.log("-------------------------------------------------------")
    console.log("word error rate of sentence: ", wer)
    console.log("-------------------------------------------------------")
    console.log("total WER: ", totalWer + " %")
    console.log("-------------------------------------------------------")
  }
  console.log(`
  Fastest time: ${Math.min(...timeArray)}
  Slowest time: ${Math.max(...timeArray)}
  Average time: ${timeArray.reduce((a, b) => a + b, 0) / timeArray.length}
    `)

  await client.close()
}

function processTranscription(transcribedSentence: string): string {
  //replace all , . - with nothing
  transcribedSentence = transcribedSentence.replace(/[.,-]/g, "")
  let processed = numberToString2(transcribedSentence)
  //console.log("processed is: ", processed)

  return processed
}

function wordErrorRate(
  real: string,
  trans: string,
): { wer: number; wrongCounter: number; length: number } {
  let realArray = real
    .toLowerCase()
    .replace(/[.,-]/g, "")
    .split(" ")
    .filter((word) => word !== "" && word != " ")
  let transArray = trans
    .toLowerCase()
    .split(" ")
    .filter((word) => word !== "" && word != " ")

  //console.log("realArray: ", realArray)
  //console.log("transArray: ", transArray)

  let length = realArray.length > transArray.length ? realArray.length : transArray.length

  let wrongCounter = 0
  for (let i = 0; i < length; i++) {
    if (realArray[i] == undefined || transArray[i] == undefined) {
      wrongCounter++
      continue
    }
    if (realArray[i] != transArray[i]) wrongCounter++
  }
  return {
    wer: wrongCounter / length,
    wrongCounter: wrongCounter,
    length: length,
  }
}

run()
