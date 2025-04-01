export function callSignToNato(callsign: string) {
  const natoDict = {
    A: "Alpha",
    B: "Bravo",
    C: "Charlie",
    D: "Delta",
    E: "Echo",
    F: "Foxtrot",
    G: "Golf",
    H: "Hotel",
    I: "India",
    J: "Juliett",
    K: "Kilo",
    L: "Lima",
    M: "Mike",
    N: "November",
    O: "Oscar",
    P: "Papa",
    Q: "Quebec",
    R: "Romeo",
    S: "Sierra",
    T: "Tango",
    U: "Uniform",
    V: "Victor",
    W: "Whiskey",
    X: "X-ray",
    Y: "Yankee",
    Z: "Zulu",
    0: "Zero",
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Niner",
  }
  return callsign
    .toUpperCase()
    .split("")
    .map((char) => natoDict[char as keyof typeof natoDict] || "")
    .filter((word: any) => word !== "")
    .join(" ")
}

export function numberToString(string: string) {
  const numberDict = {
    0: "Zero",
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine",
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
    13: "Thirteen",
    14: "Fourteen",
    15: "Fifteen",
    16: "Sixteen",
    17: "Seventeen",
    18: "Eighteen",
    19: "Nineteen",
    20: "Twenty",
    21: "Twenty-One",
    22: "Twenty-Two",
    23: "Twenty-Three",
    24: "Twenty-Four",
    25: "Twenty-Five",
    26: "Twenty-Six",
    27: "Twenty-Seven",
    28: "Twenty-Eight",
    29: "Twenty-Nine",
    30: "Thirty",
    31: "Thirty-One",
    32: "Thirty-Two",
    33: "Thirty-Three",
    34: "Thirty-Four",
    35: "Thirty-Five",
    36: "Thirty-Six",
    37: "Thirty-Seven",
    38: "Thirty-Eight",
    39: "Thirty-Nine",
    40: "Forty",
    41: "Forty-One",
    42: "Forty-Two",
    43: "Forty-Three",
    44: "Forty-Four",
    45: "Forty-Five",
    46: "Forty-Six",
    47: "Forty-Seven",
    48: "Forty-Eight",
    49: "Forty-Nine",
    50: "Fifty",
    51: "Fifty-One",
    52: "Fifty-Two",
    53: "Fifty-Three",
    54: "Fifty-Four",
    55: "Fifty-Five",
    56: "Fifty-Six",
    57: "Fifty-Seven",
    58: "Fifty-Eight",
    59: "Fifty-Nine",
    60: "Sixty",
    61: "Sixty-One",
    62: "Sixty-Two",
    63: "Sixty-Three",
    64: "Sixty-Four",
    65: "Sixty-Five",
    66: "Sixty-Six",
    67: "Sixty-Seven",
    68: "Sixty-Eight",
    69: "Sixty-Nine",
    70: "Seventy",
    71: "Seventy-One",
    72: "Seventy-Two",
    73: "Seventy-Three",
    74: "Seventy-Four",
    75: "Seventy-Five",
    76: "Seventy-Six",
    77: "Seventy-Seven",
    78: "Seventy-Eight",
    79: "Seventy-Nine",
    80: "Eighty",
    81: "Eighty-One",
    82: "Eighty-Two",
    83: "Eighty-Three",
    84: "Eighty-Four",
    85: "Eighty-Five",
    86: "Eighty-Six",
    87: "Eighty-Seven",
    88: "Eighty-Eight",
    89: "Eighty-Nine",
    90: "Ninety",
    91: "Ninety-One",
    92: "Ninety-Two",
    93: "Ninety-Three",
    94: "Ninety-Four",
    95: "Ninety-Five",
    96: "Ninety-Six",
    97: "Ninety-Seven",
    98: "Ninety-Eight",
    99: "Ninety-Nine",
  }
  return numberDict[string as unknown as keyof typeof numberDict] || ""
}

export function numberToString2(string: string) {
  const natoDict = {
    0: "Zero",
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Niner",
  }
  string = string.replace(/\b\d{4}\b/g, (match) => replace4DigitWords(match))
  console.log("string is: ", string)

  let newString = ""
  for (let i = 0; i < string.length; i++) {
    const char = string[i]
    if (char in natoDict) {
      newString += natoDict[char as unknown as keyof typeof natoDict] + " "
    } else {
      newString += char
    }
  }
  return newString.trim()
}
/*
function findWordsWithOnlyDigits(text) {
  // Regular expression: Match whole words that consist of only 4 or more digits
  const regex = /\b\d{4,}\b/g

  // Find matches in the string
  const matches = text.match(regex)

  return matches || [] // Return matches or an empty array if none found
}*/
const replace4DigitWords = (text: string) => {
  const number = Number.parseInt(text)
  console.log("number is: ", number)

  if (number % 1000 !== 500) {
    return numberToString((number / 1000).toString()) + " thousand"
  } else return numberToString((number / 1000 - 0.5).toString()) + " thousand five hundred"
}

export function stringToNumber(word: string): string | null {
  const natoDict: Record<string, number> = {
    Zero: 0,
    One: 1,
    Two: 2,
    Three: 3,
    Four: 4,
    Five: 5,
    Six: 6,
    Seven: 7,
    Eight: 8,
    Niner: 9,
  }

  return word
    .split(" ")
    .map((word: string) => natoDict[word] || "")
    .filter((word: any) => word !== "")
    .join("")
  return natoDict[word] ? natoDict[word].toString() : null // Return the number or null if not found
}
