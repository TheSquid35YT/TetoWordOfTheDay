'use strict';

//Initialize variables
window.gameOver = false;
const BACKSPACE_KEY = 'Backspace';
const ENTER_KEY = 'Enter';
const WORD_LIST = (window.words);
const GUESS_LIST = (window.allowedWords);

//Choose word of the day
const WORD_OF_THE_DAY = (WORD_LIST[getRandomIndex(WORD_LIST.length)]).toUpperCase();
console.log(WORD_OF_THE_DAY);

//Max attempts to guess the word
const MAX_NUMBER_OF_ATTEMPTS = 6;

//History of guesses
const history = [];
let currentWord = '';

//Initialize the game
const init = () => {
  //Welcome
  console.log('Welcome to Teto Word of the Day!');
  playIntroAudio();

  //Initialize keyboard keys
  const KEYBOARD_KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  //Grab the gameboard and the keyboard
  const gameBoard = document.querySelector('#board');
  const keyboard = document.querySelector('#keyboard');

  //Generate the gameboard and the keyboard
  generateBoard(gameBoard);
  generateBoard(keyboard, 3, 10, KEYBOARD_KEYS, true);

  //Create event listeners
  document.addEventListener('keydown', event => onKeyDown(event.key));
  gameBoard.addEventListener('animationend', event => event.target.setAttribute('data-animation', 'idle'));
  keyboard.addEventListener('click', onKeyboardButtonClick);
};

//Show a given message in traditional Wordle style
const showMessage = (message) => {
  const toast = document.createElement('li');

  toast.textContent = message;
  toast.className = 'toast';

  document.querySelector('.toaster ul').prepend(toast);
  
  setTimeout(() => toast.classList.add('fade'), 1000);

  toast.addEventListener('transitionend', (event) => event.target.remove());
};

//Check the guess and assign attributes to each letter
const checkGuess = (guess, word) => {
  const guessLetters = guess.split('');
  const wordLetters = word.split('');
  const remainingWordLetters = [];
  const remainingGuessLetters = [];

  //Find the current active row
  const currentRow = document.querySelector(`#board ul[data-row='${history.length}']`);

  //First, let's get all the columns in the current row set up with some base values
  currentRow.querySelectorAll('li').forEach((element, index) => {
    element.setAttribute('data-status', 'none');
    element.setAttribute('data-animation', 'flip');

    //Each letter should start its animation twice as late as the letter before it
    element.style.animationDelay = `${index * 300}ms`;
    element.style.transitionDelay = `${index * 400}ms`;
  });

  //Second iteration finds all the valid letters and creates a list of leftover letters
  wordLetters.forEach((letter, index) => {
    if (guessLetters[index] === letter) {
      currentRow.querySelector(`li:nth-child(${index + 1})`)
        .setAttribute('data-status', 'valid');

      document
        .querySelector(`[data-key='${letter}']`)
        .setAttribute('data-status', 'valid');
      
        remainingWordLetters.push(false);
        remainingGuessLetters.push(false);
    } else {
      remainingWordLetters.push(letter);
      remainingGuessLetters.push(guessLetters[index]);
    }
  });

  //Third iteration finds all the misplaced letters
  remainingWordLetters.forEach(letter => {
    //If the letter was already found in the previous phase
    if (letter === false) {
      return;
    };

    if (remainingGuessLetters.indexOf(letter) !== -1) {
      const column = currentRow
        .querySelector(`li:nth-child(${remainingGuessLetters.indexOf(letter) + 1})`);

      column.setAttribute('data-status', 'invalid');
      
      const keyboardKey = document.querySelector(`[data-key='${letter}']`);

      if (keyboardKey.getAttribute('data-status') !== 'valid') {
        keyboardKey.setAttribute('data-status', 'invalid');
      };
    };
  });

  //Fourth iteration finds all the letters on the keyboard that are absent from the word.
  guessLetters.forEach(letter => {
    const keyboardKey = document.querySelector(`[data-key='${letter}']`);
    
    if (keyboardKey.getAttribute('data-status') === 'empty') {
      keyboardKey.setAttribute('data-status', 'none');
    };
  });

  //Update the history of guesses
  history.push(currentWord);
  currentWord = '';

  //Check if won
  if ((history[history.length-1]) === (WORD_OF_THE_DAY)) {
    victory();
  } else {
    //Don't allow more then 6 attempts to guess the word
    if (history.length >= MAX_NUMBER_OF_ATTEMPTS) {
      defeat();
      return;
    };
  };
};

//Handle virtual keyboard button presses
const onKeyboardButtonClick = (event) => {
  if (event.target.nodeName === 'LI' && window.gameOver === false) {
    onKeyDown(event.target.getAttribute('data-key'));
  };
};

//Handle physical key presses
const onKeyDown = (key) => {
  //Don't allow more then 6 attempts to guess the word
  if (history.length >= MAX_NUMBER_OF_ATTEMPTS || window.gameOver === true) {
    return;
  };

  // Find the current active row
  const currentRow = document.querySelector(`#board ul[data-row='${history.length}']`);

  // Find the next empty column in the current active row
  let targetColumn = currentRow.querySelector('[data-status="empty"]');

  if (key === BACKSPACE_KEY && window.gameOver === false) {
    if (targetColumn === null) {
      // Get the last column of the current active row
      // as we are on the last column
      targetColumn = currentRow.querySelector('li:last-child');
    } else {
      // Find the previous column, otherwise get the first column
      // so we always have have a column to operate on
      targetColumn = targetColumn.previousElementSibling ?? targetColumn;
    }

    // Clear the column of its content
    targetColumn.textContent = '';
    targetColumn.setAttribute('data-status', 'empty');
    
    // Remove the last letter from the currentWord
    currentWord = currentWord.slice(0, -1);
    
    return;
  }

  if (key === ENTER_KEY && window.gameOver === false) {
    if (currentWord.length < 5) {
      playInvalidAudio();
      showMessage('Not enough letters');
      return;
    }

    if (currentWord.length === 5 && GUESS_LIST.includes(currentWord.toLowerCase())) {
      checkGuess(currentWord, WORD_OF_THE_DAY);
    } else {
      playInvalidAudio();
      currentRow.setAttribute('data-animation', 'invalid');
      showMessage('???');
    }
    return;
  }

  // We have reached the 5 letter limit for the guess word
  if (currentWord.length >= 5) return;

  const upperCaseLetter = key.toUpperCase();

  // Add the letter to the next empty column
  // if the provided letter is between A-Z
  if (/^[A-Z]$/.test(upperCaseLetter)) {
    currentWord += upperCaseLetter;

    targetColumn.textContent = upperCaseLetter;
    targetColumn.setAttribute('data-status', 'filled');
    targetColumn.setAttribute('data-animation', 'pop');
  }
}

const generateBoard = (board, rows = 6, columns = 5, keys = [], keyboard = false) => {
  for (let row = 0; row < rows; row++) {
    const elmRow = document.createElement('ul');

    elmRow.setAttribute('data-row', row);
    
    // Adjust keyboard row lengths for responsiveness
    let rowLength = columns;
    if (keyboard && row === 2) {
      // Make bottom row shorter for mobile
      rowLength = Math.min(columns, 7);
    }

    for (let column = 0; column < columns; column++) {
      const elmColumn = document.createElement('li');
      elmColumn.setAttribute('data-status', 'empty');
      elmColumn.setAttribute('data-animation', 'idle');

      if (keyboard && keys.length > 0) {
        const key = keys[row].charAt(column);
        elmColumn.textContent = key;
        elmColumn.setAttribute('data-key', key);
      }

      // Skip adding any keyboard keys to the UI that are empty
      if (keyboard && elmColumn.textContent === '') continue;

      elmRow.appendChild(elmColumn);
    }

    board.appendChild(elmRow);
  }

  if (keyboard) {
    const enterKey = document.createElement('li');
    enterKey.setAttribute('data-key', ENTER_KEY);
    enterKey.textContent = ENTER_KEY;
    board.lastChild.prepend(enterKey);

    const backspaceKey = document.createElement('li');
    backspaceKey.setAttribute('data-key', BACKSPACE_KEY);
    backspaceKey.textContent = BACKSPACE_KEY;
    board.lastChild.append(backspaceKey);
  }
}

// Call the initialization function when the DOM is loaded to get
// everything setup and the game responding to user actions.
document.addEventListener('DOMContentLoaded', init);

// Based on the max length of the Array. Return a random items index
// within the Array's length.
function getRandomIndex (maxLength) {
  return Math.floor(Math.random() * Math.floor(maxLength));
}

//Play sound for invalid word
function playInvalidAudio() {
  let invalidAudio = new Audio("./Sounds/Invalid/Teto Huh.mp3");
  invalidAudio.volume = 0.25;
  invalidAudio.play();
};

//Play sound for intro
function playIntroAudio() {
  let introAudio = new Audio("./Sounds/Teto Word Of The Day Intro.mp3");
  introAudio.volume = 0.25;
  introAudio.play();
};

//Defeat
function defeat() {
  //Disable game functions
  window.gameOver = true;

  //Lose
  setTimeout(function() {
    showMessage(WORD_OF_THE_DAY);
  }, 1700);
};

//Victory
function victory() {
  //Disable game functions
  window.gameOver = true;
  
  //Choose random victory message
  let randomWin = ((Math.floor(Math.random() * Math.floor(10)))+1)
  
  //Get sound
  let winAudio = new Audio("./Sounds/Praise/Teto Praise "+randomWin+".mp3");
  winAudio.volume = 0.75;
  
  //Get text
  const winMessages = ["Good job!", "Well done!", "Nice work!", "You\'re awesome!", "Great effort!", "You did it!", "That\'s amazing!", "I\'m proud of you!", "Keep it up!", "You\'re doing great"];
  let winMessage = winMessages[randomWin-1];
  
  //Win
  setTimeout(function() {
    winAudio.play();
    showMessage(winMessage);
  }, 1650);
};