document.addEventListener("DOMContentLoaded", () => {
	init();
	NewGame(START_FEN);
	PrintBoard();
	// SearchPosition();
    // GenerateMoves();
	// PrintMoveList();
	// PrintPieceLists();
	// CheckBoard();
	// MakeMove(GameBoard.moveList[0]);
	// PrintBoard();
	// CheckBoard();
	// TakeMove();
	// PrintBoard();
	// CheckBoard();
});

function InitFilesRanksBrd() {
	
	let index = 0;
	let file = FILES.FILE_A;
	let rank = RANKS.RANK_1;
	let sq = SQUARES.A1;
	
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		FilesBrd[index] = SQUARES.OFFBOARD;
		RanksBrd[index] = SQUARES.OFFBOARD;
	}
	
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			FilesBrd[sq] = file;
			RanksBrd[sq] = rank;
		}
	}
    
    Debug('board', `FileBoard[0] - ${FilesBrd[0]} & RankBoard[0] - ${RanksBrd[0]} `);
    Debug('board', `FileBoard[Squares.A1] - ${FilesBrd[SQUARES.A1]} & RankBoard[Squares.A1] - ${RanksBrd[SQUARES.A1]}`);
    Debug('board', `FileBoard[Squares.E8] - ${FilesBrd[SQUARES.E8]} & RankBoard[Squares.E8] - ${RanksBrd[SQUARES.E8]}`);
}

function InitHashKeys() {
    let index = 0;
	
	for(index = 0; index < 14 * 120; ++index) {				
		PieceKeys[index] = RAND_32();
	}
	
	SideKey = RAND_32();
	
	for(index = 0; index < 16; ++index) {
		CastleKeys[index] = RAND_32();
	}
}

function InitSq120To64() {

	let index = 0;
	let file = FILES.FILE_A;
	let rank = RANKS.RANK_1;
	let sq = SQUARES.A1;
	let sq64 = 0;

    // Clear and reset to non relevant values.
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		Sq120ToSq64[index] = 65;
	}

	for(index = 0; index < 64; ++index) {
		Sq64ToSq120[index] = 120;
	}

    // matches 120sqr board with 64sqr board and visa versa
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			Sq64ToSq120[sq64] = sq;
			Sq120ToSq64[sq] = sq64;
			sq64++;
		}
	}
}

function InitBoardVars() {

	let index = 0;
	for(index = 0; index < MAXGAMEMOVES; ++index) {
		GameBoard.history.push( {
			move : NOMOVE,
			castlePerm : 0,
			enPas : 0,
			fiftyMove : 0,
			posKey : 0
		});
	}	
	
	for(index = 0; index < PVENTRIES; ++index) {
		GameBoard.PvTable.push({
			move : NOMOVE,
			posKey : 0
		});
	}
}

function InitBoardSquares () {
	let light = 1;
	let rankName;
	let fileName;
	let rankIter;
	let fileIter;
	let lightString;

	for (rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {
		light ^= 1;
		rankName = "rank" + (rankIter + 1);
		for(fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {
			fileName = "file" + (fileIter + 1);

			if(light == 0) lightString = "Light";
			else lightString = "Dark";
			light ^= 1;

			const div = document.createElement("div")
			div.className = "Square " + rankName + " " + fileName + " " + lightString;
			document.getElementById("Board").appendChild(div);
		}
	}
}

function init() {
	InitFilesRanksBrd();
	InitHashKeys();
	InitSq120To64();
	InitBoardVars();
	InitMvvLva();
	InitBoardSquares();
}
