"use strict";

let currentChapterIndex = 0;
let showingSecondEntry = false;

const journalDates = {
  1: "October 5th, 1925",
  2: "October 6th, 1925",
  3: "October 9th, 1925",
  4: "October 12th, 1925",
  5: "October 15th, 1925",
  6: "October 17th, 1925",
  7: "October 19th, 1925",
  // 8: "October 21st, 1925",
};

const symbols = {
  P: "·",
  M: "▲",
  F: "ᚠ",
  R: "~",
  W: "≈",
  S: "ᛟ",
  X: "◍",
};

const pages = [
  {
    num: 1,
    entries: [1, 2],
    solution: { P: "Plains", M: "Mountain" },
  },
  {
    num: 2,
    entries: [3, 4],
    solution: { P: "Plains", M: "Mountain", F: "Forest" },
  },
  {
    num: 3,
    entries: [5, 6],
    solution: { P: "Plains", M: "Mountain", W: "Water" },
  },
  {
    num: 4,
    entries: [7], // 8
    solution: { P: "Plains", M: "Mountain", S: "Settlement" },
  },
];

const pageData = pages.map((page) => ({
  firstEntryNumber: page.entries[0],
  secondEntryNumber: page.entries[1],
  journalEntry: `journal/chapter${page.num}/entry${page.entries[0]}.txt`,
  continuationEntry: `journal/chapter${page.num}/entry${page.entries[1]}.txt`,
  mapPath: `maps/map${page.num}.txt`,
  symbols: symbols,
  solution: page.solution,
}));

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

function updateChapterInator(index) {
  const chapter = pageData[index];
  const dateNum = chapter.firstEntryNumber;

  if (!chapter) {
    console.log("THE END");
    return;
  }

  currentChapterIndex = index;
  resetSecondEntryInator();

  document.getElementById("journal-date").innerText = journalDates[dateNum];
  textPopulatorInator(chapter.journalEntry, "narrative-content");
  swappedMapPopulatorInator(chapter.mapPath, "map-display", chapter.symbols);
  symbolContainerPopulatorInator(chapter);
}

function resetSecondEntryInator() {
  const secondDate = document.getElementById("second-journal-date");
  const secondContent = document.getElementById("second-narrative-content");

  secondDate.style.display = "none";
  secondContent.style.display = "none";
  secondDate.style.opacity = 0;
  secondContent.style.opacity = 0;
  secondDate.innerText = "";
  secondContent.textContent = "";

  showingSecondEntry = false;
}

function symbolContainerPopulatorInator(chapter) {
  const container = document.getElementById("legend-container");
  container.innerHTML = "";

  const solution = chapter.solution;

  for (const [key, word] of Object.entries(solution)) {
    const legendDiv = document.createElement("div");
    legendDiv.classList.add("symbol-container");

    const symbolChar = chapter.symbols[key] || key;

    const symbolSpan = document.createElement("span");
    symbolSpan.textContent = symbolChar;
    symbolSpan.classList.add("symbol");
    legendDiv.appendChild(symbolSpan);

    for (let i = 0; i < word.length; i++) {
      const slot = document.createElement("span");
      slot.classList.add("symbol-slot");
      slot.dataset.letter = word[i].toUpperCase();
      slot.textContent = "_";
      slot.contentEditable = "true";
      slot.spellcheck = false;

      slot.addEventListener("input", () => {
        let char = slot.textContent.toUpperCase();
        if (char.length > 1) char = char.slice(0, 1);
        slot.textContent = char;
      });
      legendDiv.appendChild(slot);
    }
    container.appendChild(legendDiv);
  }
}

document.getElementById("option-button").addEventListener("click", async () => {
  const chapter = pageData[currentChapterIndex];
  if (!chapter) return;

  const secondDate = document.getElementById("second-journal-date");
  const secondContent = document.getElementById("second-narrative-content");

  if (!showingSecondEntry && chapter.continuationEntry) {
    secondDate.innerText = journalDates[chapter.secondEntryNumber] || "";

    await textPopulatorInator(
      chapter.continuationEntry,
      "second-narrative-content"
    );

    secondDate.style.display = "block";
    secondContent.style.display = "block";
    secondDate.style.opacity = 0;
    secondContent.style.opacity = 0;

    setTimeout(() => {
      secondDate.style.opacity = 1;
      secondContent.style.opacity = 1;
    }, 50);

    showingSecondEntry = true;
  } else {
    const nextIndex = currentChapterIndex + 1;
    updateChapterInator(nextIndex);
  }
});

document.addEventListener("keydown", (e) => {
  const letter = e.key.toUpperCase();
  const slots = document.querySelectorAll(".symbol-slot");

  slots.forEach((slot) => {
    if (slot.textContent === "_" && slot.dataset.letter === letter) {
      slot.textContent = letter;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  updateChapterInator(currentChapterIndex);
});
