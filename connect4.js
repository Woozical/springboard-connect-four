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
let board = []; // matrix array of rows, each row is array of cells  (board[y][x])

let player1Color = 'red';
let player2Color = 'yellow';

/* --------- Initialization Functions --------- */
//#region 
/** makeBoard: create in-JS board structure:
 *    board = array of rows, each row is array of cells  (board[y][x])
 */

 function makeBoard() {
  // set "board" to empty HEIGHT x WIDTH matrix array
  for (let y = 0; y < HEIGHT; y++){
    const newRow = [];
    for (let x = 0; x < WIDTH; x++){
      newRow[x] = undefined; // Setting each index to undefined, rather than leave empty, due to how array functions behave
    }
    board[y] = newRow;
  }
}

/** makeHtmlBoard: make HTML table and row of column tops. */

function makeHtmlBoard() {
  //get "htmlBoard" variable from the item in HTML w/ID of "board"
  const htmlBoard = document.querySelector('#board');
  htmlBoard.addEventListener("click", handleClick);

  // populate the board HTML table with cells
  // give each cell an ID matching its position in the 'board' array matrix
  for (let y = 0; y < HEIGHT; y++) {
    const row = document.createElement("tr");
    for (let x = 0; x < WIDTH; x++) {
      const cell = document.createElement("td");
      cell.setAttribute("id", `${y}-${x}`);
      row.append(cell);
    }
    htmlBoard.append(row);
  }
}

//#endregion

/* --------- DOM Manipulation Functions --------- */
//#region 
/** placeInTable: update DOM to place piece into HTML table of board */

function placeInTable(y, x) {
  // make a div and insert into correct table cell
  const cell = document.getElementById(`${y}-${x}`);
  const piece = document.createElement('div');
  const topPos = (y+1) * 53; // 53 - roughly the amount of pixels between each piece

  // top style property is set in-line for use in animation
  // bg-color is set in-line for future player color user customization
  piece.style = `top: -${topPos}px; background-color: ${currPlayer === 1 ? player1Color : player2Color}`
  piece.classList.add('piece');
  cell.append(piece);
}

// Function to handle DOM manipulation and animation timing of announcer div
// 'duration' param is number of milliseconds before announcer should fade out
// if 0, announcer stays on screen until something else clears it
function announceMessage(msg, duration=0){
  const announcer = document.getElementById('matchResult');
  announcer.classList.remove('fade-out');
  announcer.innerText = msg;
  announcer.classList.add('fade-in');

  if (duration !== 0){
    const timer = setTimeout(
      () => {
        announcer.classList.remove('fade-in');
        announcer.classList.add('fade-out');
        clearInterval(timer);
      },duration)
  }
}

// clears all 'piece' divs from each cell in the html table
function clearHtmlBoard(){
  const htmlBoard = document.getElementById('board');
  
  for (let row=0; row < htmlBoard.children.length; row++){
    const tableRow = htmlBoard.children[row];
    
    for (let col=0; col < tableRow.children.length; col++){
      const tableCell = tableRow.children[col];
      tableCell.innerHTML = '';
    }
  }

}


//#endregion

/* --------- Array Matrix Functions --------- */
//#region 
/** findSpotForCol: given column x, return top empty y (null if filled) */
function findSpotForCol(x) {
  let y;
  for ( y = 0; y < HEIGHT; y++){
    // this column is full, invalid move
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

// sets all indices of board to undefined
function clearBoard(){
  for (let row = 0; row < HEIGHT; row++){
    for (let col = 0; col < WIDTH; col++){
      board[row][col] = undefined;
    }
  }
}

// checkForTie: check to see if board is full with no winner
function checkForTie(){
  return board.every(
    (row) => {
      return row.every(
        (cell) => {
          return (cell !== undefined);
        })}
  )
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

  // Traverses the matrix from 'left' to 'right', row by row
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // For each of these, four coordinate pairs are put into an array (each pair being an array itself)
      // Gathers current coords, and coords of each piece 3 spots to the 'right'
      let horiz = [[y, x], [y, x + 1], [y, x + 2], [y, x + 3]];
      // Gathers current coords, and coords of each piece 3 spots 'down'
      let vert = [[y, x], [y + 1, x], [y + 2, x], [y + 3, x]];
      // Gathers current coords, and coords of each piece 3 spots 'down' and 'right', diagonally
      let diagDR = [[y, x], [y + 1, x + 1], [y + 2, x + 2], [y + 3, x + 3]];
      // Gathers current coords, and coords of each piece 3 spots 'down' and 'left', diagonally
      let diagDL = [[y, x], [y + 1, x - 1], [y + 2, x - 2], [y + 3, x - 3]];

      // For each of the above 4 arrays of coordinate pairs, see if any of them result in a match of all 4 elements
      if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
        return true;
      }
    }
  }
}
//#endregion

/* --------- Event Handlers --------- */
//#region 

/** handleClick: handle click of game board to play piece */
// piece will be played on 'lowest' available spot in column of player's click
function handleClick(evt) {

  if (gameState !== STATE.inProg) return; // do nothing if game is over, or awaiting start

  // get x from ID of clicked cell
  // each ID is structured "{Y}-{X}", split at '-', 2nd element will be the X coordinate
  const x = +evt.target.id.split('-')[1];
  
  if (!isFinite(x)) return; // return out if clicked on a gap between cells
  
  // get next spot in column (if none, ignore click)
  const y = findSpotForCol(x);
  if (y === null) {
    return;
  }
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

  // Perform AI move
  if (currPlayer === 2){
    const {coords: move, score} = pickNextMove(board);
    handleClick({ target: { id : `${move.row}-${move.col}`}});
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
        announceMessage('Good luck!', 2500);
        break;

      case STATE.inProg:
        break;

      case STATE.over:
        clearBoard();
        clearHtmlBoard();
        e.target.setAttribute('disabled', '');
        document.getElementById('matchResult').classList.remove('fade-in');
        document.getElementById('matchResult').classList.add('fade-out');
        document.getElementById('p1Token').classList.add('selected');
        document.getElementById('p2Token').classList.remove('selected');
        gameState = STATE.inProg;
        currPlayer = 1;
        break;
    }
  }
}
//#endregion


/** endGame: announce game end, set game state, and clean-up UI related to game in progress */
function endGame(msg) {

  announceMessage(msg);
  
  gameState = STATE.over;
  document.querySelector('button').removeAttribute('disabled');
  document.getElementById(`p${currPlayer}Token`).classList.remove('selected');
}

makeBoard();
makeHtmlBoard();
document.getElementById('controls').addEventListener('click', controlHandler);


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