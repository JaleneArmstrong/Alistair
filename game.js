"use strict";

const pageData = [
  {
    journalEntry: "journal/entry1.txt",
    mapPath: "maps/map1.txt",
    symbols: {
      P: "·",
      M: "▲",
      F: "ᚠ",
      R: "~",
      W: "≈",
      S: "ᛟ",
      X: "◍",
    },
    continuationEntry: "narrative/entry2.txt",
    solution: { P: "Plains", M: "Mountain" },
  },
];

async function textPopulatorInator(filePath, targetElementId) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Whomp Whomp: ${response.status}`);
    }

    const textContent = await response.text();
    const targetElement = document.getElementById(targetElementId);

    if (targetElement) {
      targetElement.textContent = textContent;
    } else {
      console.error(
        `ERROR: Target Element With ID "${targetElementId}" Not Found!`
      );
    }
  } catch (error) {
    console.error(
      `ERROR: Something Went Wrong While Fetching The File!`,
      error
    );
  }
}

function mapSymbolSwapperInator(mapString, symbolMap, ignoreChars = []) {
  let swappedMap = "";
  const lines = mapString.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let newLine = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (symbolMap[char] && !ignoreChars.includes(char)) {
        newLine += symbolMap[char];
      } else {
        newLine += char;
      }
    }
    swappedMap += newLine + (i < lines.length - 1 ? "\n" : "");
  }
  return swappedMap;
}

async function swappedMapPopulatorInator(filePath, targetElementId, symbolMap) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Whomp Whomp: ${response.status}`);
    }

    const originalMap = await response.text();
    const swappedMap = mapSymbolSwapperInator(originalMap, symbolMap);
    const targetElement = document.getElementById(targetElementId);

    if (targetElement) {
      targetElement.textContent = swappedMap;
    } else {
      console.error(
        `ERROR: Target Element With ID "${targetElementId}" Not Found!`
      );
    }
  } catch (error) {
    console.error(
      `ERROR: Something Went Wrong While Fetching The File!`,
      error
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const currentChapter = pageData[0];
  textPopulatorInator(currentChapter.journalEntry, "narrative-content");
  swappedMapPopulatorInator(
    "maps/map1.txt",
    "map-display",
    currentChapter.symbols
  );
});
