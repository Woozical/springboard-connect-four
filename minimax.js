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
  const bestMove = { score: -Infinity, coords: null };
  
  // Perform minimax eval on each current possible move
  for (let row = 0; row < board.length; row++){
    for (let col = 0; col < board[row].length; col++){
      if (isValidPlay(board, row, col)){
        // Set our default play to first valid play found
        // In case minimax foresees a loss on all future plays, we still need to pick something to return
        if (bestMove.coords === null) bestMove.coords = { row, col };
        // Play this spot, evaluate future, then undo play in board state
        board[row][col] = AI;
        const score = minimax(board, 0, false, -Infinity, Infinity);
        board[row][col] = undefined;
        if (score >= bestMove.score){
          bestMove.score = score;
          bestMove.coords = { row, col };
        }
      }
    }
  }
  console.log(bestMove);
  return bestMove;
}

function minimax(board, depth=0, isMaximizing, alpha, beta){
  if (depth === MAX_DEPTH || isFull(board)){
    return evalBoard(board);
  }
  // Evaluate possible future moves
  let bestScore = isMaximizing ? -Infinity : Infinity;
  for (let row = 0; row < board.length; row++){
    for (let col = 0; col < board[row].length; col++){
      if (isValidPlay(board, row, col)){
        board[row][col] = isMaximizing ? AI : PLAYER;
        const score = minimax(board, depth+1, !isMaximizing, alpha, beta);
        board[row][col] = undefined;
        bestScore = isMaximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);

        // Alpha-Beta pruning and Game over conditions
        if (isMaximizing){
          alpha = Math.max(alpha, score);
        } else {
          beta = Math.min(beta, score);
        }
    
        // Game over condition found in this player's favor, no need to explore further branches from this position
        if ((beta <= alpha) || (bestScore === Infinity && isMaximizing) || (bestScore === -Infinity && !isMaximizing)){
          return bestScore;
        }
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
      // if (row > 0 && board[row-1][col] !== undefined) continue;
      let score = evalSlot(board, row, col);
      score = board[row][col] === PLAYER ? score * -1 : score;
      scores.push(score);
    }
  }
  return scores.reduce((a, b) => a+b);
}

// Starting at given (row, col) position, count how many pieces in a row in a left/right direction
// In order for a streak to be valid, it must be feasible for the streak to continue if not already connect-four
function countHorizontal(board, row, col, goLeft){
  let streak = 0;
  const boardEdge = goLeft ? 0 : board[row].length;
  const direction = goLeft ? -1 : 1;
  const player = board[row][col];

  for (let i = col; true; i += direction){
    // At any point we reach 4 in a row, return Infinity
    if (streak >= 4) return Infinity;
    // Reached end of board or blocked by opponent piece
    const isBlocked = ((i === boardEdge) || (board[row][i] !== player && board[row][i] !== undefined));
    if (isBlocked) return 0;
    
    // Reached empty space
    if (board[row][i] === undefined){
      // If there is ground to continue growing, no change to tallies
      // Or if this is a count of an edge piece, award a point for possible downward diagonal growth
      const canGrow = (
        ( (row+1 === board.length) || (board[row+1][i] !== undefined) )
        ||
        ( (streak === 1) && (row+2 === board.length || board[row+2][i] !== undefined) ));
      if (canGrow){
        return streak;
      }
      // Otherwise, nullify it if no growth available due to lack for floor (gravity)
      else {
        return 0;
      }
    }
    streak += 1;
  }
}

// Start at a given (row, col) count number of same player pieces in an upward direction
function countVertical(board, row, col){
  let streak = 0;
  const player = board[row][col];
  for (let i = row; i >= 0; i--){
    // At any point we reach 4 in a row, return Infinity
    if (streak >= 4) return Infinity;
    const isBlocked = ((i === 0) || (board[i][col] !== player && board[i][col] !== undefined));
    if (isBlocked) return 0;
    if (board[i][col] === undefined) return streak;
    streak += 1;
  }
}

function countUpDiag(board, row, col, goLeft){
  let streak = 0;
  const player = board[row][col];
  const direction = goLeft ? -1 : 1;
  const horizEdge = goLeft ? 0 : board[row].length;
  
  for (let i = 0; true; i++){
    if (streak >= 4) return Infinity;
    const hitBorder = ((row-i === 0) || (col+(direction*i) === horizEdge))
    const current = board[row-i][col+(direction*i)];
    if (hitBorder || current !== player && current !== undefined) break;

    // Reached empty space
    if (current === undefined){
      // Only count streak if it can continue (i.e. there's ground below this spot)
      if (board[row+1-i][col+(direction*i)] !== undefined){
        return streak;
      }
      break;
    }
    streak += 1;
  }
  return 0;
}

// evaluates    \ | /
//              - O -
function evalSlot(board, row, col){
  // i0: Left, i1: Right, i2: Up, i3: UpLeft, i4: UpRight
  const tallies = [
    countHorizontal(board, row, col, true),
    countHorizontal(board, row, col, false),
    countVertical(board, row, col),
    countUpDiag(board, row, col, true),
    countUpDiag(board, row, col, false)
  ];
  return tallies.reduce((a,b) => a + b);
}

/** Determines the value of a given piece, based on how many other pieces it connects to in each direction,
 *  and whether that streak can potentially keep going in a given direction. This value is relative to the 
 *  player who owns that piece. Ergo, it should be modified when used for a total board evaluation for a minimax algorithm.
 */
// function evalSlot(board, row, col){
//   const player = board[row][col];
//   const tallies = {
//     down: 0, left: 0, right: 0, downRight: 0, downLeft: 0
//   }
//   // evaluate vertical (downward)
//   for (let i = row; i < board.length; i++){
//     // We only evaluate slots with an open space above them, so no need to check for blocked growth direction
//     if (board[i][col] !== player){
//       break;
//     }
//     tallies.down += 1;
//   }
  
//   // evaluate left
//   for (let i = col; i >= 0; i--){
//     // End of board or blocked by opponent piece
//     const isBlocked = (col-1 < 0 || (board[row][i] !== player && board[row][i] !== undefined));
//     // Zero score as there's no growth potential from this slot in this direction
//     if (tallies.left < 4 && isBlocked){
//       tallies.left = 0;
//       break;
//     } else if (board[row][i] === undefined){
//       break;
//     }
//     tallies.left += 1;
//   }
  
//   // evaluate right
//   for (let i = col; i < board[row].length; i++){
//     // End of board or blocked by opponent piece
//     const isBlocked = (col+1 === board[row].length || (board[row][i] !== player && board[row][i] !== undefined));
//     // Zero score as there's no growth potential from this slot in this direction
//     if (tallies.right < 4 && isBlocked){
//       tallies.right = 0;
//       break;
//     } else if (board[row][i] === undefined){
//       break;
//     }
//     tallies.right += 1;
//   }
  
//   // evaluate diagonals (down-left)
//   for (let i = 0; i < 4; i++){
//     const isBlocked = (row+i === board.length || col+i === board[row].length)
//                       || (board[row+i][col+i] !== player && board[row+i][col+i] !== undefined);
    
//     if (tallies.downLeft < 4 && isBlocked){
//       tallies.downLeft = 0;
//       break;
//     } else if (board[row+i][col+i] !== undefined){
//       break;
//     }
//     tallies.downLeft += 1;
//   }

//   // evaluate diagonals (down-right)
//   for (let i = 0; i < 4; i++){
//     const isBlocked = (row+i === board.length || col-i < 0)
//                       || (board[row+i][col-i] !== player && board[row+i][col-i] !== undefined);
    
//     if (tallies.downRight < 4 && isBlocked){
//       tallies.downRight = 0;
//       break;
//     } else if (board[row+i][col-i] !== undefined){
//       break;
//     }
//     tallies.downRight += 1;
//   }

//   // Sum tallies in each direction, 4+ in a row = Infinity
//   let sum = 0
//   for (let direction of Object.keys(tallies)){
//     if (tallies[direction] >= 4) return Infinity;
//     sum += tallies[direction];
//   }
//   console.log(tallies, {row, col});
//   return sum;
// }