/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 */

const WIDTH = 7;
const HEIGHT = 6;

// awaitStart - Currently waiting for the user to start the game for the first time.
// inProg - A game is currently being played
// over - A game is finished and awaiting restart
const STATE = {awaitStart : 0, inProg : 1, over : 2};
let gameState = STATE.awaitStart;

let currPlayer = 1; // active player: 1 or 2
let board = []; // array of rows, each row is array of cells  (board[y][x])

let player1Color = 'red';
let player2Color = 'yellow';

/** makeBoard: create in-JS board structure:
 *    board = array of rows, each row is array of cells  (board[y][x])
 */

function makeBoard() {
  // set "board" to empty HEIGHT x WIDTH matrix array
  for (let y = 0; y < HEIGHT; y++){
    const newRow = [];
    for (let x = 0; x < WIDTH; x++){
      newRow[x] = undefined;
    }
    board[y] = newRow;
  }
}

/** makeHtmlBoard: make HTML table and row of column tops. */

function makeHtmlBoard() {
  //get "htmlBoard" variable from the item in HTML w/ID of "board"
  const htmlBoard = document.querySelector('#board');
  htmlBoard.addEventListener("click", handleClick);
  // create top row for user input
  // user will click above the column where they want to drop their piece
  // const top = document.createElement("tr");
  // top.setAttribute("id", "column-top");
  // top.addEventListener("click", handleClick);

  // for (let x = 0; x < WIDTH; x++) {
  //   let headCell = document.createElement("td");
  //   headCell.setAttribute("id", x);
  //   top.append(headCell);
  // }
  // htmlBoard.append(top);

  // populate the board HTML table with cells
  // give each cell an ID matching its position in the 'board' array matrix
  for (let y = 0; y < HEIGHT; y++) {
    const row = document.createElement("tr");
    for (let x = 0; x < WIDTH; x++) {
      const cell = document.createElement("td");
      cell.setAttribute("id", `${y}-${x}`);
      //cell.innerText = `Y:${y}, X:${x}` // DEBUG
      row.append(cell);
    }
    htmlBoard.append(row);
  }
}

/** findSpotForCol: given column x, return top empty y (null if filled) */

function findSpotForCol(x) {
  let y;
  for ( y = 0; y < HEIGHT; y++){
    // this column full, invalid move
    if (y === 0 & board[y][x] !== undefined){
      return null;
    }
    // this cell is occupied, return cell above
    else if (board[y][x] !== undefined){
      return y - 1;
    }
  }
  // no cells in this column occupied
  return y - 1;
}

/** placeInTable: update DOM to place piece into HTML table of board */

function placeInTable(y, x) {
  // make a div and insert into correct table cell
  const cell = document.getElementById(`${y}-${x}`);
  const piece = document.createElement('div');
  piece.classList.add('piece');
  piece.style.backgroundColor = currPlayer === 1 ? player1Color : player2Color;
  cell.append(piece);
}

/** endGame: announce game end */
function endGame(msg) {
  document.getElementById('matchResult').innerText = msg;
  gameState = STATE.over;
  document.querySelector('button').removeAttribute('disabled');
  document.getElementById(`p${currPlayer}Token`).classList.remove('selected');
}

function clearBoard(){
  for (let row = 0; row < HEIGHT; row++){
    for (let col = 0; col < WIDTH; col++){
      board[row][col] = undefined;
    }
  }
}

function clearHtmlBoard(){
  const htmlBoard = document.getElementById('board');
  
  for (let row=1; row < htmlBoard.children.length; row++){
    const tableRow = htmlBoard.children[row];
    
    for (let col=0; col < tableRow.children.length; col++){
      const tableCell = tableRow.children[col];
      tableCell.innerHTML = '';
    }
  }

}

/** handleClick: handle click of column top to play piece */

function handleClick(evt) {

  if (gameState !== STATE.inProg) return;

  // get x from ID of clicked cell
  // each ID is structured "{Y}-{X}", split at '-', 2nd element will be the X coordinate
  const x = +evt.target.id.split('-')[1];
  //console.log('X:',x); //DEBUG
  // get next spot in column (if none, ignore click)
  const y = findSpotForCol(x);
  if (y === null) {
    return;
  }
  //console.log('Y:',y);
  // place piece in board and add to HTML table
  placeInTable(y, x);
  board[y][x] = currPlayer;

  // check for win
  if (checkForWin()) {
    return endGame(`Player ${currPlayer} wins!`);
  }

  // check for tie
  if (checkForTie()) {
    return endGame('A tie! Game over.');
  }

  // switch players
  currPlayer = currPlayer === 1 ? 2 : 1;
  document.getElementById('p1Token').classList.toggle('selected');
  document.getElementById('p2Token').classList.toggle('selected');
}

// checkForTie: check to see if board is full with no winner

function checkForTie(){

  return board.every(
    (row) => {
      return row.every(
        (cell) => {
          return (cell !== undefined);
        }
      )
    }
  )
}

// DEBUG
function debugMakeTie(){
  board = [
    [2, 2, undefined, 2, 2, 1, 2],
    [1, 1, 2, 1, 1, 1, 2],
    [2, 2, 1, 2, 2, 1, 2],
    [1, 1, 2, 1, 1, 2, 1],
    [2, 2, 1, 2, 2, 1, 2],
    [1, 1, 2, 1, 1, 2, 1]
  ];

  for (let y = 0; y < HEIGHT; y++){
    for (let x = 0; x < WIDTH; x++){
      currPlayer = board[y][x];
      if (y === 0 && x === 2){
        continue;
      }
      placeInTable(y, x);
    }
  }

}


/** checkForWin: check board cell-by-cell for "does a win start here?" */

function checkForWin() {
  function _win(cells) {
    // Check four cells to see if they're all color of current player
    //  - cells: list of four (y, x) cells
    //  - returns true if all are legal coordinates & all match currPlayer

    return cells.every(
      ([y, x]) =>
        y >= 0 &&
        y < HEIGHT &&
        x >= 0 &&
        x < WIDTH &&
        board[y][x] === currPlayer
    );
  }

  // TODO: read and understand this code. Add comments to help you.

  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      var horiz = [[y, x], [y, x + 1], [y, x + 2], [y, x + 3]];
      var vert = [[y, x], [y + 1, x], [y + 2, x], [y + 3, x]];
      var diagDR = [[y, x], [y + 1, x + 1], [y + 2, x + 2], [y + 3, x + 3]];
      var diagDL = [[y, x], [y + 1, x - 1], [y + 2, x - 2], [y + 3, x - 3]];

      if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
        return true;
      }
    }
  }
}

// Click handler for control bar
function controlHandler(e){
  if (e.target.tagName === 'BUTTON'){
    switch (gameState){

      case STATE.awaitStart:
        e.target.setAttribute('disabled', '');
        document.getElementById('p1Token').classList.toggle('selected');
        gameState = STATE.inProg;
        break;

      case STATE.inProg:
        break;

      case STATE.over:
        clearBoard();
        clearHtmlBoard();
        e.target.setAttribute('disabled', '');
        document.getElementById('matchResult').innerText = '';
        document.getElementById('p1Token').classList.add('selected');
        document.getElementById('p2Token').classList.remove('selected');
        gameState = STATE.inProg;
        currPlayer = 1;
        break;
    }
  }
}

makeBoard();
makeHtmlBoard();
document.getElementById('controls').addEventListener('click', controlHandler);
