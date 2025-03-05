import './App.css';
import { callSignToNato } from './string_processing';

function App() {
  setInterval(() => {
    generateCallsign();
  }, 1000);
  return <div className="App"></div>;
}

export default App;

function generateCallsign() {
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
}
