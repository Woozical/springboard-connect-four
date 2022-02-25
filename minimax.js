const PLAYER = 1; // Human-controlled player, minimizing agent
const AI = 2; // Computer-controlled player, maximizing agent
const MAX_DEPTH = 3; // # of turns for AI to calculate ahead

function isFull(board){
  return board.every(
    (row) => {
      return row.every(
        (cell) => {
          return (cell !== undefined);
        })}
  )
}

function isValidPlay(board, row, col){
  if (board[row][col] !== undefined) return false; // can't play filled spots
  if (row < board.length-1 && board[row+1][col] === undefined) return false; // can't play spots that are empty below
  return true;
}

function pickNextMove(board){
  // Perform minimax eval on each current possible move
  const bestMove = { score: -Infinity }
  for (let row = 0; row < board.length; row++){
    for (let col = 0; col < board[row].length; col++){
      if (isValidPlay(board, row, col)){
        board[row][col] = AI;
        const score = minimax(board, 0, false);
        board[row][col] = undefined;
        if (score > bestMove.score){
          bestMove.score = score;
          bestMove.coords = { row, col };
        }
      }
    }
  }
  return bestMove;
}

function minimax(board, depth=0, isMaximizing){
  if (depth === MAX_DEPTH || isFull(board)){
    return evalBoard(board);
  }
  // Evaluate possible future moves
  let bestScore = isMaximizing ? -Infinity : Infinity;
  for (let row = 0; row < board.length; row++){
    for (let col = 0; col < board[row].length; col++){
      if (isValidPlay(board, row, col)){
        board[row][col] = isMaximizing ? AI : PLAYER;
        const score = minimax(board, depth+1, !isMaximizing);
        board[row][col] = undefined;
        bestScore = isMaximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);
      }
    }
  }
  return bestScore;
}

function evalBoard(board){
  const scores = []
  for (let row = 0; row < board.length; row++){
    for (let col = 0; col < board[row].length; col++){
      // If slot is empty, skip
      if (board[row][col] === undefined) continue;
      // If slot above is occupied, skip
      if (row > 0 && board[row-1][col] !== undefined) continue;
      let score = evalSlot(board, row, col);
      score = board[row][col] === PLAYER ? score * -1 : score;
      scores.push(score);
    }
  }
  return scores.reduce((a, b) => a+b);
}

/** Determines the value of a given piece, based on how many other pieces it connects to in each direction,
 *  and whether that streak can potentially keep going in a given direction. This value is relative to the 
 *  player who owns that piece. Ergo, it should be modified when used for a total board evaluation for a minimax algorithm.
 */
function evalSlot(board, row, col){
  const player = board[row][col];
  const tallies = {
    down: 0, left: 0, right: 0, downRight: 0, downLeft: 0
  }
  // evaluate vertical (downward)
  for (let i = row; i < board.length; i++){
    // We only evaluate slots with an open space above them, so no need to check for blocked growth direction
    if (board[i][col] !== player){
      break;
    }
    tallies.down += 1;
  }
  
  // evaluate left
  for (let i = col; i >= 0; i--){
    // End of board or blocked by opponent piece
    const isBlocked = (col-1 < 0 || (board[row][i] !== player && board[row][i] !== undefined));
    // Zero score as there's no growth potential from this slot in this direction
    if (tallies.left < 4 && isBlocked){
      tallies.left = 0;
      break;
    } else if (board[row][i] === undefined){
      break;
    }
    tallies.left += 1;
  }
  
  // evaluate right
  for (let i = col; i < board[row].length; i++){
    // End of board or blocked by opponent piece
    const isBlocked = (col+1 === board[row].length || (board[row][i] !== player && board[row][i] !== undefined));
    // Zero score as there's no growth potential from this slot in this direction
    if (tallies.right < 4 && isBlocked){
      tallies.right = 0;
      break;
    } else if (board[row][i] === undefined){
      break;
    }
    tallies.right += 1;
  }
  
  // evaluate diagonals (down-left)
  for (let i = 0; i < 4; i++){
    const isBlocked = (row+i === board.length || col+i === board[row].length)
                      || (board[row+i][col+i] !== player && board[row+i][col+i] !== undefined);
    
    if (tallies.downLeft < 4 && isBlocked){
      tallies.downLeft = 0;
      break;
    } else if (board[row+i][col+i] !== undefined){
      break;
    }
    tallies.downLeft += 1;
  }

  // evaluate diagonals (down-right)
  for (let i = 0; i < 4; i++){
    const isBlocked = (row+i === board.length || col-i < 0)
                      || (board[row+i][col-i] !== player && board[row+i][col-i] !== undefined);
    
    if (tallies.downRight < 4 && isBlocked){
      tallies.downRight = 0;
      break;
    } else if (board[row+i][col-i] !== undefined){
      break;
    }
    tallies.downRight += 1;
  }

  // Sum tallies in each direction, 4 in a row = Infinity
  let sum = 0
  for (let direction of Object.keys(tallies)){
    sum += tallies[direction] >= 4 ? Infinity : tallies[direction];
  }
  return sum;
}