"use strict";

let currentChapterIndex = 0;
let showingSecondEntry = false;
let musicStarted = false;
let introLines = [];
let currentIntroLine = 0;
let typedInstance = null;

const bgMusic = document.getElementById("bg-music");
const pageFlipAudio = document.getElementById("page-flip-sound");
const introOverlay = document.getElementById("intro-overlay");
const introText = document.getElementById("intro-text");
const introPrompt = document.getElementById("intro-prompt");

const journalDates = {
  1: "October 5th, 1925",
  2: "October 6th, 1925",
  3: "October 9th, 1925",
  4: "October 12th, 1925",
  5: "October 15th, 1925",
  6: "October 17th, 1925",
  7: "October 19th, 1925",
  8: "October 21st, 1925",
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
    entries: [7, 8],
    solution: { P: "Plains", M: "Mountain", V: "Village" },
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
    if (!response.ok) throw new Error(`Whomp Whomp: ${response.status}`);
    const textContent = await response.text();
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) targetElement.textContent = textContent;
  } catch (error) {
    console.error("ERROR loading text:", error);
  }
}

function mapSymbolSwapperInator(mapString, symbolMap) {
  return mapString
    .split("\n")
    .map((line) =>
      [...line]
        .map((char) => (symbolMap[char] ? symbolMap[char] : char))
        .join("")
    )
    .join("\n");
}

async function swappedMapPopulatorInator(filePath, targetElementId, symbolMap) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Whomp Whomp: ${response.status}`);
    const originalMap = await response.text();
    const swappedMap = mapSymbolSwapperInator(originalMap, symbolMap);
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) targetElement.textContent = swappedMap;
  } catch (error) {
    console.error("ERROR loading map:", error);
  }
}

function updateChapterInator(index) {
  const chapter = pageData[index];
  if (!chapter) {
    console.log("THE END");
    return;
  }

  currentChapterIndex = index;
  resetSecondEntryInator();

  document.getElementById("journal-date").innerText =
    journalDates[chapter.firstEntryNumber];
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

  secondDate.classList.remove("fade-in");
  secondContent.classList.remove("fade-in");

  showingSecondEntry = false;

  const optionBtn = document.getElementById("turn-button");
  if (optionBtn) optionBtn.style.display = "none";
}

function symbolContainerPopulatorInator(chapter) {
  const container = document.getElementById("legend-container");
  container.innerHTML = "";

  const allSlots = [];

  for (const [key, word] of Object.entries(chapter.solution)) {
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
      slot.dataset.correct = word[i].toUpperCase();
      slot.textContent = "_";
      slot.contentEditable = "true";
      slot.spellcheck = false;

      slot.addEventListener("input", () => {
        const char = slot.textContent.toUpperCase().replace(/[^A-Z]/g, "");
        slot.textContent = char.slice(0, 1);

        const currentIndex = allSlots.indexOf(slot);
        if (char && currentIndex < allSlots.length - 1) {
          allSlots[currentIndex + 1].focus();
        }
      });

      slot.addEventListener("keydown", (e) => {
        const flatIndex = allSlots.indexOf(slot);

        if (
          ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)
        ) {
          e.preventDefault();
          let nextIndex = flatIndex;

          if (e.key === "ArrowRight") nextIndex++;
          if (e.key === "ArrowLeft") nextIndex--;
          if (nextIndex >= 0 && nextIndex < allSlots.length) {
            allSlots[nextIndex].focus();
          }
        }

        if (e.key === "Enter") {
          e.preventDefault();
          const finalizeBtn = document.getElementById("legend-button");
          if (finalizeBtn) finalizeBtn.click();
        }
      });

      legendDiv.appendChild(slot);
      allSlots.push(slot);
    }

    container.appendChild(legendDiv);
  }

  document
    .getElementById("legend-button")
    .addEventListener("click", () => checkLegendCompletionInator(chapter));
}

async function checkLegendCompletionInator(chapter) {
  const allSlots = document.querySelectorAll(".symbol-slot");
  let allCorrect = true;

  allSlots.forEach((slot) => {
    const correct = slot.dataset.correct.toUpperCase();
    const user = slot.textContent.toUpperCase();
    if (correct !== user) {
      allCorrect = false;
      slot.classList.add("incorrect");
      setTimeout(() => slot.classList.remove("incorrect"), 500);
    }
  });

  if (!allCorrect) {
    alert("Not quite right yet. Keep trying!");
    return;
  }

  console.log("Legend completed!");

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
    document.getElementById("turn-button").style.display = "block";
  }
}

function startMusicInator() {
  if (!musicStarted) {
    bgMusic.play().catch(() => {
      console.log("Browser requires interaction to play audio.");
    });
    musicStarted = true;
  }
}

async function loadIntroInator() {
  try {
    const response = await fetch("narrative/intro.txt");
    if (!response.ok) throw new Error(`Failed to load intro.txt`);
    const text = await response.text();
    introLines = text.split("\n").filter((line) => line.trim() !== "");
    showNextIntroLineInator();
  } catch (err) {
    console.error(err);
  }
}

function showNextIntroLineInator() {
  if (currentIntroLine >= introLines.length) {
    introOverlay.style.transition = "opacity 1s ease";
    introOverlay.style.opacity = 0;
    setTimeout(() => {
      introOverlay.style.display = "none";
      startMusicInator();
      updateChapterInator(0);
    }, 1000);
    return;
  }

  const line = introLines[currentIntroLine];
  currentIntroLine++;
  if (typedInstance) {
    typedInstance.destroy();
  }

  typedInstance = new Typed(introText, {
    strings: [line],
    typeSpeed: 20,
    showCursor: false,
    onComplete: () => {
      introPrompt.style.opacity = 1;
    },
  });

  introPrompt.style.opacity = 0;
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (introOverlay.style.display !== "none") {
      if (typedInstance && typedInstance.typing) {
        typedInstance.complete();
      } else {
        showNextIntroLineInator();
      }
    }
  }
});
document.getElementById("turn-button").addEventListener("click", () => {
  pageFlipAudio.currentTime = 0;
  pageFlipAudio.play();

  const nextIndex = currentChapterIndex + 1;
  updateChapterInator(nextIndex);
});

document.addEventListener("DOMContentLoaded", () => {
  loadIntroInator();
  updateChapterInator(currentChapterIndex);
});
