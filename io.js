function PrSq(sq) {
	return (FileChar[FilesBrd[sq]] + RankChar[RanksBrd[sq]]);
}

function PrMove(move) {	
    // Move string
	let MvStr;

    // file from... rank to
    let ff = FilesBrd[FROMSQ(move)];
	let rf = RanksBrd[FROMSQ(move)];
	let ft = FilesBrd[TOSQ(move)];
	let rt = RanksBrd[TOSQ(move)];
	
	MvStr = FileChar[ff] + RankChar[rf] + FileChar[ft] + RankChar[rt];
	
	let promoted = PROMOTED(move);
    Debug('promotion', `Promoted = ${promoted}`);

    if(promoted != PIECES.EMPTY) {
		let pchar = 'q';
		if(PieceKnight[promoted] == true) {
			pchar = 'n';
		} else if(PieceRookQueen[promoted] == true && PieceBishopQueen[promoted] == false)  {
			pchar = 'r';
		} else if(PieceRookQueen[promoted] == false && PieceBishopQueen[promoted] == true)   {
			pchar = 'b';
		}
		MvStr += pchar;
	}
	return MvStr;
}

function PrintMoveList() {

	let index;
	let move;
	let num = 1;
    Debug('moveList', "MoveList:")

    for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply+1]; ++index) {
		move = GameBoard.moveList[index];
        Debug('moveList', `Move: ${num}: ${PrMove(move)}`);
		num++;
    }
    Debug('moveList', "End moveList");
}

function ParseMove(from, to) {
	GenerateMoves();

	let move = NOMOVE;
	let promPce = PIECES.EMPTY;
	let found = false;

	for (index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
		
		move = GameBoard.moveList[index];

		if(FROMSQ(move) == from && TOSQ(move) == to) {
			promPce = PROMOTED(move);
			if(promPce != PIECES.EMPTY) {
				if(promPce == PIECES.wQ && GameBoard.side == COLORS.WHITE || promPce == PIECES.bQ && GameBoard.side == COLORS.BLACK) {
					found = true;
					break;
				}
				continue;
			}
			found = true;
			break;
		}
	}

	if (found != false) {
		if(MakeMove(move) == false) {
			return NOMOVE;
		}
		TakeMove();
		return move;
	}
	return NOMOVE;
}