const SearchController = {
    nodes: 0,
    fh: 0, //fail high
    fhf: 0, // fail high first
    depth: 0,
    time: 0,
    start: 0,
    stop: 0,
    best: 0,
    thinking: 0,
};

function PickNextMove(MoveNum) {

	let index = 0;
	let bestScore = -1;
	let bestNum = MoveNum;
	
	for(index = MoveNum; index < GameBoard.moveListStart[GameBoard.ply+1]; ++index) {
		if(GameBoard.moveScores[index] > bestScore) {
			bestScore = GameBoard.moveScores[index];
			bestNum = index;
		}
	} 
	
	if(bestNum != MoveNum) {
		let temp = 0;
		temp = GameBoard.moveScores[MoveNum];
		GameBoard.moveScores[MoveNum] = GameBoard.moveScores[bestNum];
		GameBoard.moveScores[bestNum] = temp;
		
		temp = GameBoard.moveList[MoveNum];
		GameBoard.moveList[MoveNum] = GameBoard.moveList[bestNum];
		GameBoard.moveList[bestNum] = temp;
	}

}

function ClearPvTable() {
	
	for(index = 0; index < PVENTRIES; index++) {
			GameBoard.PvTable[index].move = NOMOVE;
			GameBoard.PvTable[index].posKey = 0;		
	}
}

function CheckUp() {
	if (( Date.now() - SearchController.start ) > SearchController.time) {
		SearchController.stop = true;
	}
}

function IsRepetition() {
	let index = 0;
	
	for(index = GameBoard.hisPly - GameBoard.fiftyMove; index < GameBoard.hisPly - 1; ++index) {
		if(GameBoard.posKey == GameBoard.history[index].posKey) {
			return true;
		}
	}
	
	return false;
}

function Quiescence(alpha, beta) {

	if ((SearchController.nodes & 2047) == 0) { // 8191  2047
        CheckUp();
	}
	
	SearchController.nodes++;

    //check Rep() fifty move rule;
    if( (IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0) {
		return 0;
	}
	
	if(GameBoard.ply > MAXDEPTH -1) {
		return EvalPosition();
	}	
	
	let Score = EvalPosition();
	
	if(Score >= beta) {
		return beta;
	}
	
	if(Score > alpha) {
		alpha = Score;
	}
	
	GenerateCaptures();

    let MoveNum = 0;
	let Legal = 0;
	let OldAlpha = alpha;
	let BestMove = NOMOVE;
	let Move = NOMOVE;

    // get PvMove
    // Order PvMove

    for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
	
		PickNextMove(MoveNum);
		
		Move = GameBoard.moveList[MoveNum];	

		if(MakeMove(Move) == false) {
			continue;
		}		
		Legal++;
		Score = -Quiescence( -beta, -alpha);
		
		TakeMove();
		
		if(SearchController.stop == true) {
			return 0;
		}
		
		if(Score > alpha) {
			if(Score >= beta) {
				if(Legal == 1) {
					SearchController.fhf++;
				}
				SearchController.fh++;	
				return beta;
			}
			alpha = Score;
			BestMove = Move;
		}		
	}
	
	if(alpha != OldAlpha) {
		StorePvMove(BestMove);
	}
	
	return alpha;

}

// AlphaBeta Algorith
function AlphaBeta(alpha, beta, depth) {

	
	if(depth <= 0) {
		return Quiescence(alpha, beta);
	}

    //Checks 8192 nodes before calling check up again
    if ((SearchController.nodes & 2047) == 0) { // 8191  2047
        CheckUp();
	}
	
	SearchController.nodes++;

    //check Rep() fifty move rule;
    if( (IsRepetition() || GameBoard.fiftyMove >= 100) && GameBoard.ply != 0) {
		return 0;
	}
	
	if(GameBoard.ply > MAXDEPTH -1) {
		return EvalPosition();
	}	
	
	let InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side],0)], GameBoard.side^1);
	if(InCheck == true)  {
		depth++;
	}	
	
	let Score = -INFINITE;
	
	GenerateMoves();
	
	let MoveNum = 0;
	let Legal = 0;
	let OldAlpha = alpha;
	let BestMove = NOMOVE;
	let Move = NOMOVE;

    let PvMove = ProbePvTable();
    if(PvMove != NOMOVE) {
        for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
            if(GameBoard.moveList[MoveNum] == PvMove) {
                GameBoard.moveScores[MoveNum] = 2000000;
                break;
            }
        }
    }

    for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
	
		PickNextMove(MoveNum);
		
		Move = GameBoard.moveList[MoveNum];	

		if(MakeMove(Move) == false) {
			continue;
		}		
		Legal++;
		Score = -AlphaBeta( -beta, -alpha, depth-1);
		
		TakeMove();
		
		if(SearchController.stop == true) {
			return 0;
		}
		
		if(Score > alpha) {
			if(Score >= beta) {
				if(Legal == 1) {
					SearchController.fhf++;
				}
				SearchController.fh++;				
				if((Move & MFLAGCAP) == 0) {
                    GameBoard.searchKillers[MAXDEPTH + GameBoard.ply] = GameBoard.searchKillers[MAXDEPTH + GameBoard.ply];
                    GameBoard.searchKillers[GameBoard.ply] = Move;
                }
				
				return beta;
			}

            if ((Move & MFLAGCAP) == 0) {
                GameBoard.searchHistory[GameBoard.pieces[FROMSQ(Move)] * BRD_SQ_NUM + TOSQ(Move)] += depth*depth;
            }
			alpha = Score;
			BestMove = Move;
			
		}		
	}	
	
	if(Legal == 0) {
		if(InCheck == true) {
			return -MATE + GameBoard.ply;
		} else {
			return 0;
		}
	}	
	
	if(alpha != OldAlpha) {
		StorePvMove(BestMove);
	}
	
	return alpha;
}

function ClearForSearch() {

	let index = 0;
	
	for(index = 0; index < 14 * BRD_SQ_NUM; ++index) {	
		GameBoard.searchHistory[index] = 0;	
	}
	
	for(index = 0; index < 3 * MAXDEPTH; ++index) {
		GameBoard.searchKillers[index] = 0;
	}	
	
	ClearPvTable();
	GameBoard.ply = 0;
	SearchController.nodes = 0;
	SearchController.fh = 0;
	SearchController.fhf = 0;
	SearchController.start = Date.now();
	SearchController.stop = false;
}

function SearchPosition() {

	let bestMove = NOMOVE;
	let bestScore = -INFINITE;
	let score = -INFINITE;
	let currentDepth = 0;
	let PvNum;
	let c;
	ClearForSearch();
	
	for( currentDepth = 1; currentDepth <= SearchController.depth; ++currentDepth) {	
        // AlphaBeta search algorith
		score = AlphaBeta(-INFINITE, INFINITE, currentDepth);

		if(SearchController.stop == true) {
			break;
		}

		bestScore = score;

        bestMove = ProbePvTable();
        Debug('search', `Depth: ${currentDepth} \nBest: ${PrMove(bestMove)} \nScore: ${bestScore} \nNodes: ${SearchController.nodes}`);
    
        PvNum = GetPvLine(currentDepth);

        for( c = 0; c < PvNum; ++c) {
            Debug('search', `Pv: ${PrMove(GameBoard.PvArray[c])}`);
        }

        if(currentDepth!=1) {
            Debug('search', `Ordering: ${((SearchController.fhf/SearchController.fh)*100).toFixed(2)}%`)
        }
    }

	SearchController.best = bestMove;
	SearchController.thinking = false;
	UpdateDOMStats(bestScore, currentDepth);
}

// Lots of jquery to sort out
function UpdateDOMStats(dom_score, dom_depth) {

	let scoreText = "Score: " + (dom_score/100).toFixed(2);

	if(Math.abs(dom_score) > MATE - MAXDEPTH) {
		scoreText = "Score: Mate in " + (MATE - (Math.abs(dom_score))-1) + " moves";
	}

	document.getElementById('OrderingOut').textContent = ("Ordering: " + ((SearchController.fhf / SearchController.fh) * 100).toFixed(2) + "%");

	document.getElementById('DepthOut').textContent = ("Depth: " + dom_depth);

	document.getElementById('ScoreOut').textContent = scoreText;

	document.getElementById('NodeOut').textContent = ("Nodes: " + SearchController.nodes);

	document.getElementById('TimeOut').textContent = ("Time: " + ((Date.now() - SearchController.start) / 1000).toFixed(1) + "s");

	document.getElementById('BestOut').textContent = ("BestMove: " + PrMove(SearchController.best));

}


