"use strict";

let currentChapterIndex = 0;
let showingSecondEntry = false;
let musicStarted = false;
let introReady = false;
let introLines = [];
let currentIntroLine = 0;
let typedInstance = null;
let bgMusic,
  endMusic,
  pageFlipSound,
  dialogueSound,
  keyPressSound,
  writingSound,
  introOverlay,
  titleOverlay,
  introText,
  introPrompt;

const journalDates = {
  1: "X . 5 . 25",
  2: "X . 6 . 25",
  3: "X . 9 . 25",
  4: "X . 12 . 25",
  5: "X . 15 . 25",
  6: "X . 17 . 25",
  7: "X . 19 . 25",
  8: "X . 21 . 25",
};

const symbols = {
  X: "◍",
  P: "·",
  M: "▲",
  R: "~",
  V: "ᛟ",
  O: "≈",
  F: "ᚠ",
  Q: " ",
};

const pages = [
  {
    num: 1,
    entries: [1, 2],
    solution: { P: "Plains", M: "Mountains" },
  },
  {
    num: 2,
    entries: [3, 4],
    solution: { O: "Ocean", V: "Village" },
  },
  {
    num: 3,
    entries: [5, 6],
    solution: { R: "River", F: "Forest" },
  },
  {
    num: 4,
    entries: [7, 8],
    solution: { X: "Sunken City" },
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

// In case you were wondering, yes, every function is an "-inator."
// It's how I coped with the the pain. :') (Shoutout Dr. Doofenshmirtz)
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

async function updateChapterInator(index) {
  document.getElementById("legend-button").style.display = "block";
  document.getElementById("check-answer-button").style.display = "block";
  const chapter = pageData[index];
  if (!chapter) {
    showEndScreenInator();
    return;
  }

  currentChapterIndex = index;
  resetSecondEntryInator();

  document.getElementById("journal-date").innerText =
    journalDates[chapter.firstEntryNumber];
  await Promise.all([
    textPopulatorInator(chapter.journalEntry, "narrative-content"),
    swappedMapPopulatorInator(chapter.mapPath, "map-display", chapter.symbols),
  ]);
  symbolContainerPopulatorInator(chapter);
}

function resetSecondEntryInator() {
  const secondDate = document.getElementById("second-journal-date");
  const secondContent = document.getElementById("second-narrative-content");
  const instructions = document.getElementById("instructions");

  instructions.innerText = "Determine the meaning of each symbol";
  instructions.classList.remove("error-instructions");
  instructions.classList.add("instructions");

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

// I DESPISE how stupidly long this function is
// But I can't find any will inside my soul to refactor it :p
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
      if (word[i] === " ") {
        slot.classList.add("space-slot");
        slot.textContent = " ";
        slot.contentEditable = "false";
      } else {
        slot.classList.add("symbol-slot");
        slot.dataset.correct = word[i].toUpperCase();
        slot.textContent = "_";
        slot.contentEditable = "true";
      }

      slot.addEventListener("input", () => {
        const char = slot.textContent.toUpperCase().replace(/[^A-Z]/g, "");
        slot.textContent = char.slice(0, 1);

        if (char) {
          const currentIndex = allSlots.indexOf(slot);
          for (let i = currentIndex + 1; i < allSlots.length; i++) {
            if (allSlots[i].contentEditable === "true") {
              allSlots[i].focus();
              break;
            }
          }
        }
      });

      slot.addEventListener("keydown", (e) => {
        keyPressSound.currentTime = 0;
        keyPressSound.play();
        keyPressSound.volume = 0.2;

        const currentIndex = allSlots.indexOf(slot);

        if (
          ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)
        ) {
          e.preventDefault();
          let nextIndex = currentIndex;

          if (e.key === "ArrowRight") nextIndex++;
          if (e.key === "ArrowLeft") nextIndex--;
          if (nextIndex >= 0 && nextIndex < allSlots.length) {
            allSlots[nextIndex].focus();
          }
        }

        if (e.key === "Backspace") {
          e.preventDefault();

          if (slot.textContent && slot.textContent !== "_") {
            slot.textContent = "_";
          } else {
            for (let i = currentIndex - 1; i >= 0; i--) {
              if (allSlots[i].contentEditable === "true") {
                allSlots[i].textContent = "_";
                allSlots[i].focus();
                break;
              }
            }
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
  if (allSlots.length > 0) {
    allSlots[0].focus();
  }
}

async function checkLegendCompletionInator(chapter, checkType) {
  const legendContainers = document.querySelectorAll(".symbol-container");
  let allWordsAreCorrect = true;

  legendContainers.forEach((container) => {
    const slots = Array.from(
      container.querySelectorAll(".symbol-slot, .space-slot")
    );

    const userGuess = slots
      .map((s) => s.textContent.toUpperCase() || "_")
      .join("");
    const correctAnswer = slots.map((s) => s.dataset.correct || " ").join("");

    let isThisWordCorrect = userGuess === correctAnswer;
    if (!isThisWordCorrect) {
      allWordsAreCorrect = false;
    }

    if (checkType === "check") {
      const correctLetters = correctAnswer.split("");
      const guessLetters = userGuess.split("");

      slots.forEach((slot, i) => {
        if (
          guessLetters[i] === correctLetters[i] &&
          slot.classList.contains("symbol-slot")
        ) {
          slot.classList.add("correct-position");
          correctLetters[i] = null;
          guessLetters[i] = null;
        }
      });

      slots.forEach((slot, i) => {
        if (
          guessLetters[i] !== null &&
          slot.classList.contains("symbol-slot")
        ) {
          const letterIndex = correctLetters.indexOf(guessLetters[i]);
          if (letterIndex > -1) {
            slot.classList.add("correct-letter");
            correctLetters[letterIndex] = null;
          } else {
            slot.classList.add("incorrect-letter");
          }
        }
      });

      setTimeout(() => {
        slots.forEach((slot) => {
          slot.classList.remove(
            "correct-position",
            "correct-letter",
            "incorrect-letter"
          );
        });
      }, 1500);
    }

    if (checkType === "submit" && !isThisWordCorrect) {
      slots.forEach((slot) => {
        if (slot.classList.contains("symbol-slot")) {
          slot.classList.add("incorrect");
          setTimeout(() => slot.classList.remove("incorrect"), 500);
        }
      });
    }
  });

  if (checkType === "submit") {
    if (!allWordsAreCorrect) {
      const instructions = document.getElementById("instructions");
      instructions.innerText = "Not quite right yet. Keep trying!";
      instructions.classList.add("error-instructions");
      setTimeout(() => {
        instructions.innerText = "Determine the meaning of each symbol";
        instructions.classList.remove("error-instructions");
        instructions.classList.add("instructions");
      }, 2000);
      return;
    }

    const instructions = document.getElementById("instructions");
    instructions.innerText = "‎"; // Don't Judge Me!
    instructions.classList.remove("error-instructions");

    const secondDate = document.getElementById("second-journal-date");
    const secondContent = document.getElementById("second-narrative-content");

    if (!showingSecondEntry && chapter.continuationEntry) {
      writingSound.currentTime = 0;
      writingSound.play();
      secondDate.innerText = journalDates[chapter.secondEntryNumber] || "";

      await textPopulatorInator(
        chapter.continuationEntry,
        "second-narrative-content"
      );

      secondDate.style.display = "block";
      secondContent.style.display = "block";
      setTimeout(() => {
        secondDate.style.opacity = 1;
        secondContent.style.opacity = 1;
      }, 50);

      showingSecondEntry = true;
      document.getElementById("turn-button").style.display = "block";
    }
  }
}

function startMusicInator() {
  if (!musicStarted) {
    bgMusic.play();
    musicStarted = true;
  }
}

async function loadIntroInator() {
  try {
    const response = await fetch("narrative/intro.txt");
    if (!response.ok) throw new Error(`Failed to load intro.txt`);
    const text = await response.text();
    introLines = text.split("\n").filter((line) => line.trim() !== "");
    const dialogueBox = document.getElementById("intro-dialogue-box");
    dialogueBox.style.display = "flex";
    introReady = true;
    showNextIntroLineInator();
  } catch (err) {
    console.error(err);
  }
}

async function showNextIntroLineInator() {
  if (currentIntroLine >= introLines.length) {
    const gameContainer = document.querySelector(".container");
    await updateChapterInator(0);

    introOverlay.style.transition = "opacity 1s ease";
    introOverlay.style.opacity = 0;
    gameContainer.style.opacity = 1;

    setTimeout(() => {
      introOverlay.style.display = "none";
      startMusicInator();
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

async function showEndScreenInator() {
  const gameContainer = document.querySelector(".container");
  gameContainer.style.transition = "opacity 1s ease";
  gameContainer.style.opacity = 0;

  if (musicStarted) {
    bgMusic.pause();
    endMusic.play();
  }

  const fullSolution = pageData.reduce((accumulator, page) => {
    return { ...accumulator, ...page.solution };
  }, {});

  const endOverlay = document.getElementById("end-screen-overlay");
  const finalLegendContent = document.getElementById("final-legend-content");
  finalLegendContent.innerHTML = "";

  for (const key in symbols) {
    if (fullSolution[key]) {
      const word = fullSolution[key];
      const symbolChar = symbols[key];

      const itemDiv = document.createElement("div");
      itemDiv.className = "final-legend-item";

      const symbolSpan = document.createElement("span");
      symbolSpan.className = "symbol";
      symbolSpan.textContent = symbolChar;

      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      wordSpan.textContent = word;

      itemDiv.appendChild(symbolSpan);
      itemDiv.appendChild(wordSpan);
      finalLegendContent.appendChild(itemDiv);
    }
  }

  await swappedMapPopulatorInator("maps/map.txt", "final-map-display", symbols);

  setTimeout(() => {
    gameContainer.style.display = "none";
    endOverlay.classList.add("visible");
  }, 1000);
}

function titleSymbolPopulatorInator() {
  const container = document.getElementById("title-symbols");
  if (!container) return;

  for (const key in symbols) {
    if (key !== "Q") {
      const symbolSpan = document.createElement("span");
      symbolSpan.textContent = symbols[key];
      container.appendChild(symbolSpan);
    }
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && introReady) {
    e.preventDefault();
    if (introOverlay.style.display !== "none") {
      dialogueSound.currentTime = 0;
      dialogueSound.play();
      dialogueSound.volume = 0.2;
      if (typedInstance && typedInstance.typing) {
        typedInstance.complete();
      } else {
        showNextIntroLineInator();
      }
    }
  }
});

document.getElementById("turn-button").addEventListener("click", () => {
  pageFlipSound.currentTime = 0;
  pageFlipSound.play();

  const nextIndex = currentChapterIndex + 1;
  updateChapterInator(nextIndex);
});

document.addEventListener("DOMContentLoaded", () => {
  bgMusic = document.getElementById("bg-music");
  endMusic = document.getElementById("end-music");
  pageFlipSound = document.getElementById("page-flip-sound");
  dialogueSound = document.getElementById("dialogue-sound");
  keyPressSound = document.getElementById("key-press-sound");
  writingSound = document.getElementById("writing-sound");
  introOverlay = document.getElementById("intro-overlay");
  titleOverlay = document.getElementById("title-overlay");
  introText = document.getElementById("intro-text");
  introPrompt = document.getElementById("intro-prompt");

  titleSymbolPopulatorInator();
  titleOverlay.addEventListener(
    "click",
    () => {
      titleOverlay.style.opacity = 0;
      setTimeout(() => {
        titleOverlay.style.display = "none";
        loadIntroInator();
      }, 1500);
    },
    { once: true }
  );

  document
    .getElementById("check-answer-button")
    .addEventListener("click", () => {
      const currentChapter = pageData[currentChapterIndex];
      if (currentChapter) {
        checkLegendCompletionInator(currentChapter, "check");
      }
    });

  document.getElementById("legend-button").addEventListener("click", () => {
    const currentChapter = pageData[currentChapterIndex];
    if (currentChapter) {
      checkLegendCompletionInator(currentChapter, "submit");
    }
  });
});
