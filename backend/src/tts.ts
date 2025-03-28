const voiceModels = ["p225", "p226", "p227"]
const ip = "0.0.0.0"
const port = 1337
let availableModels = Array.from(voiceModels)

/*
const textToSpeech = async(command : string, plane : id) => {
    try{
       let voiceModel = id.voice; 
       doTTSthingy(command, voiceModel)
    }
    catch(error){

    }
}

const newPlaneArrivedInsideOfTheComputerizedSimulator = (plane : id) => {
    const length = availableModels.length
    if(length < 1 ){
        idk
    }
    const i = Math.floor(Math.random() * length);
    const voiceModel = availableModels[i];
    availableModels.splice(i,1); //ta bort modellen från listan
    id.voice = voiceModel;
}

const planeDisappearedFromTheInsideOfTheComputerizedSimulator = (plane : id) => {
    availableModels.push(id.voice)
    id = null;
}
            */

export const clarifyCommand = () => {
  //tts engine..$
  //skicka "please repeat command"
}
