// Get pce index
function PCEINDEX(pce, pceNum) {
	return (pce * 10 + pceNum);
}

const GameBoard = {
    pieces: new Array(BRD_SQ_NUM),
    side: COLORS.WHITE,
    fiftyMove: 0,
    hisPly: 0, // History half move
    history: [],
    ply: 0, //Half move
    enPas: 0,
    castlePerm: 0,
    material: new Array(2), //White and Black material of pieces
    pceNum: new Array(13), // Index by the pce
    pList: new Array(14*10), // Able to hold max number of each pce
    posKey: 0,
    moveList: new Array(MAXDEPTH * MAXPOSITIONMOVES),
    moveScores: new Array(MAXDEPTH * MAXPOSITIONMOVES),
    moveListStart: new Array(MAXDEPTH),
    PvTable: [],
    PvArray: new Array(MAXDEPTH),
    searchHistory: new Array(14* BRD_SQ_NUM),
    searchKillers: new Array(3 * MAXDEPTH),
};

function CheckBoard() {   
    // Mirror of pceNum array
	let t_pceNum = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // Mirror of material array
	let t_material = [ 0, 0];

	let sq64, t_piece, t_pce_num, sq120, color, pcount;

    //Checks if pieces matches
    for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		for(t_pce_num = 0; t_pce_num < GameBoard.pceNum[t_piece]; ++t_pce_num) {
			sq120 = GameBoard.pList[PCEINDEX(t_piece,t_pce_num)];
			if(GameBoard.pieces[sq120] != t_piece) {
                Debug('pieceList', "Error: Piece list does not match");
                return false;
			}
		}	
	}
    // Piece number check
    for(sq64 = 0; sq64 < 64; ++sq64) {
		sq120 = SQ120(sq64);
		t_piece = GameBoard.pieces[sq120];
		t_pceNum[t_piece]++;
		t_material[PieceCol[t_piece]] += PieceVal[t_piece];
	}

    for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		if(t_pceNum[t_piece] != GameBoard.pceNum[t_piece]) {
				Debug('pieceList', "Error t_pceNum");
				return false;
			}	
	}

    // Material scores check
	if(t_material[COLORS.WHITE] != GameBoard.material[COLORS.WHITE] ||
			t_material[COLORS.BLACK] != GameBoard.material[COLORS.BLACK]) {
				Debug('pieceList', "Error t_material");
				return false;
	}	
	
    
    if(GameBoard.side!=COLORS.WHITE && GameBoard.side!=COLORS.BLACK) {
        Debug('pieceList', "Error: Gameboard.side");
        return false;
    }

    if(GeneratePosKey()!=GameBoard.posKey) {
        Debug('pieceList', "Error: posKey");
        return false;
    }
    
    return true;
}

// Print board
function PrintBoard() {
	
	let sq,file,rank,piece;

    Debug('board', "Game board");

	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		let line =(RankChar[rank] + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			piece = GameBoard.pieces[sq];
			line += (" " + PceChar[piece] + " ");
		}
		console.log(line);
	}

	let line = "   ";
	for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
		line += (' ' + FileChar[file] + ' ');	
	}

    console.log (line);
    Debug('gameData', `Side: ${SideChar[GameBoard.side]}`);
    Debug('gameData', `En Passant: ${GameBoard.enPas}`);
    line = "";

	if(GameBoard.castlePerm & CASTLEBIT.WKCA) line += 'K';
	if(GameBoard.castlePerm & CASTLEBIT.WQCA) line += 'Q';
	if(GameBoard.castlePerm & CASTLEBIT.BKCA) line += 'k';
	if(GameBoard.castlePerm & CASTLEBIT.BQCA) line += 'q';

    Debug('gameData', `Castle: ${line}`);
    Debug('gameData', `Key: ${GameBoard.posKey.toString(16)}`);
}


function GeneratePosKey() {

	let sq = 0;
	let finalKey = 0;
	let piece = PIECES.EMPTY;

	for(sq = 0; sq < BRD_SQ_NUM; ++sq) {
        // Get pce on specific sqr
		piece = GameBoard.pieces[sq];
        // If condition is meet XOR hash in to finaKey
		if(piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {			
			finalKey ^= PieceKeys[(piece * 120) + sq];
		}		
	}

	if(GameBoard.side == COLORS.WHITE) {
		finalKey ^= SideKey;
	}
	
	if(GameBoard.enPas != SQUARES.NO_SQ) {		
		finalKey ^= PieceKeys[GameBoard.enPas];
	}
	
	finalKey ^= CastleKeys[GameBoard.castlePerm];
	
	return finalKey;

}

function PrintPieceLists() {

	let piece, pceNum;
	
	for(piece = PIECES.wP; piece <= PIECES.bK; ++piece) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[piece]; ++pceNum) {
			console.log('Piece ' + PceChar[piece] + ' on ' + PrSq( GameBoard.pList[PCEINDEX(piece,pceNum)] ));
		}
	}

}

function UpdateListsMaterial() {	
	
	let piece,sq,index,color;

    // Reset pce list
	for(index = 0; index < 14 * 120; ++index) {
		GameBoard.pList[index] = PIECES.EMPTY;
	}

    // Reset material for game board
	for(index = 0; index < 2; ++index) {		
		GameBoard.material[index] = 0;		
	}	

    // Reset number of pieces
	for(index = 0; index < 13; ++index) {
		GameBoard.pceNum[index] = 0;
	}

    //Checks array
    for(index = 0; index < 64; ++index) {
		sq = SQ120(index);
		piece = GameBoard.pieces[sq];
		if(piece != PIECES.EMPTY) {
            Debug('layout', `Piece ${piece} on ${sq}`);
			color = PieceCol[piece];		
            
            // Increment material value according to pce value
            GameBoard.material[color] += PieceVal[piece];
			
			GameBoard.pList[PCEINDEX(piece,GameBoard.pceNum[piece])] = sq;
			GameBoard.pceNum[piece]++;	
        }
    }
    // PrintPieceLists ();
}

function ResetBoard() {
	
	let index = 0;

    // Set all pieces to off board
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		GameBoard.pieces[index] = SQUARES.OFFBOARD;
	}

    // Set intenal board 
	for(index = 0; index < 64; ++index) {
		GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
	}

    // Reset parameters for gameboard
	GameBoard.side = COLORS.BOTH;
	GameBoard.enPas = SQUARES.NO_SQ;
	GameBoard.fiftyMove = 0;	
	GameBoard.ply = 0;
	GameBoard.hisPly = 0;	
	GameBoard.castlePerm = 0;	
	GameBoard.posKey = 0;
	GameBoard.moveListStart[GameBoard.ply] = 0;

}

// Fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
function ParseFen(fen) {

	ResetBoard();
	
	let rank = RANKS.RANK_8;
    let file = FILES.FILE_A;
    let piece = 0;
    let count = 0;
    let i = 0;  
	let sq120 = 0;
	let fenCnt = 0; // fen[fenCnt]

    // Setting up first part of fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
	while ((rank >= RANKS.RANK_1) && fenCnt < fen.length) {
        count = 1;

		switch (fen[fenCnt]) {
            // Identify pieces
			case 'p': piece = PIECES.bP; break;
            case 'r': piece = PIECES.bR; break;
            case 'n': piece = PIECES.bN; break;
            case 'b': piece = PIECES.bB; break;
            case 'k': piece = PIECES.bK; break;
            case 'q': piece = PIECES.bQ; break;
            case 'P': piece = PIECES.wP; break;
            case 'R': piece = PIECES.wR; break;
            case 'N': piece = PIECES.wN; break;
            case 'B': piece = PIECES.wB; break;
            case 'K': piece = PIECES.wK; break;
            case 'Q': piece = PIECES.wQ; break;

            //Convert character to interger
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
                piece = PIECES.EMPTY;
                count = fen[fenCnt].charCodeAt() - '0'.charCodeAt();
                break;

            // End of rank case
            case '/':
            case ' ':
                rank--;
                file = FILES.FILE_A;
                fenCnt++;
                continue;  
            default:
                Debug('fen', "FEN error");
                return;
		}

        // Implement count to set pieces
		for (i = 0; i < count; i++) {	
			sq120 = FR2SQ(file,rank);            
            GameBoard.pieces[sq120] = piece;
			file++;
        }
		fenCnt++;
    }

    // Setting up second part of fen: w KQkq - 0 1
	GameBoard.side = (fen[fenCnt] == 'w') ? COLORS.WHITE : COLORS.BLACK;
	fenCnt += 2;
	
	for (i = 0; i < 4; i++) {
        if (fen[fenCnt] == ' ') {
            break;
        }
        // Logic gates OR
		switch(fen[fenCnt]) {
			case 'K': GameBoard.castlePerm |= CASTLEBIT.WKCA; break;
			case 'Q': GameBoard.castlePerm |= CASTLEBIT.WQCA; break;
			case 'k': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
			case 'q': GameBoard.castlePerm |= CASTLEBIT.BQCA; break;
			default:	     break;
        }
		fenCnt++;
	}
	fenCnt++;	
	
	if (fen[fenCnt] != '-') {        
		file = fen[fenCnt].charCodeAt() - 'a'.charCodeAt();
		rank = fen[fenCnt + 1].charCodeAt() - '1'.charCodeAt();	
		console.log("fen[fenCnt]:" + fen[fenCnt] + " File:" + file + " Rank:" + rank);	
		GameBoard.enPas = FR2SQ(file,rank);		
    }
	
	GameBoard.posKey = GeneratePosKey();	
	UpdateListsMaterial();
    // SqAttacked();
    // PrintSqAttacked();
}

function PrintSqAttacked() {
	
	let sq,file,rank,piece;

    Debug ('move', "Attacked");

    for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		let line =((rank+1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			if(SqAttacked(sq, GameBoard.side^1) == true) piece = "X";
			else piece = "-";
			line += (" " + piece + " ");
		}
    Debug ('move', line);
    }

}

function SqAttacked(sq, side) {
	let pce;
	let t_sq;
	let index;
    let dir;

    // Attack logic for Pawns
    if(side == COLORS.WHITE) {
		if(GameBoard.pieces[sq - 11] == PIECES.wP || GameBoard.pieces[sq - 9] == PIECES.wP) {
			return true;
		}
	} else {
		if(GameBoard.pieces[sq + 11] == PIECES.bP || GameBoard.pieces[sq + 9] == PIECES.bP) {
			return true;
		}	
	}

    // Attack logic for Knight
    for(index = 0; index < 8; index++) {
		pce = GameBoard.pieces[sq + KnDir[index]];
		if(pce != SQUARES.OFFBOARD && PieceCol[pce] == side && PieceKnight[pce] == true) {
			return true;
		}
	}

    // Attack logic for Rook
    for(index = 0; index < 4; ++index) {		
		dir = RkDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {
			if(pce != PIECES.EMPTY) {
				if(PieceRookQueen[pce] == true && PieceCol[pce] == side) {
					return true;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}

    // Attack logic for Bishop
    for(index = 0; index < 4; ++index) {		
		dir = BiDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {
			if(pce != PIECES.EMPTY) {
				if(PieceBishopQueen[pce] == true && PieceCol[pce] == side) {
					return true;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}

    // Attack logic for King
    for(index = 0; index < 8; index++) {
		pce = GameBoard.pieces[sq + KiDir[index]];
		if(pce != SQUARES.OFFBOARD && PieceCol[pce] == side && PieceKing[pce] == true) {
			return true;
		}
	}
	
	return false;
	

}

//try

// why not