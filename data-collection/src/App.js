import './App.css';
import { callSignToNato } from './string_processing';
import  findPhonetic  from './findPhonetic'

function App() {
    generateCallsign();
    return <div className="App"></div>;
}

export default App;

async function generateCallsign() {
    let callSign = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    for (let i = 0; i < 3; i++) {
        callSign += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 3; i++) {
        callSign += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    let spokenCallSign = callSignToNato(callSign);
    console.log(callSign + ' spoken: ' + spokenCallSign);
    let threeLetters = callSign.substring(0,3);
    console.log(findPhonetic);
    let phonetic = await findPhonetic(threeLetters); 
    if(phonetic !== null)
        phonetic += callSign.substring(3,6);
    let objectCallsign = 
        {written : callSign, 
            spoken : spokenCallSign,
            phonetic : phonetic
        };
    console.log(objectCallsign);
    return objectCallsign;
}

function generatePhrase(objectCallsign){

}

