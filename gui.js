document.getElementById("SetFen").addEventListener("click", function () {
    const fenStr = document.getElementById("fenIn").value.trim();
    if (fenStr === ""){
        alert("Please enter a FEN value.")
        return
    }
    NewGame(fenStr);
});

document.getElementById("TakeButton").addEventListener("click", function () {
    if(GameBoard.hisPly > 0) {
        TakeMove();
        GameBoard.ply = 0;
        ClearAllPieces();
        SetInitialBoardPieces();
    }
});


document.getElementById('NewGameButton').addEventListener('click', function() {
    NewGame(START_FEN);
});

function NewGame(fenStr) {
    ParseFen(fenStr);
    PrintBoard();
    // PerftTest(5);
    // SearchPosition();
    ClearAllPieces();
    SetInitialBoardPieces();
    CheckAndSet();
    ClearHighlights();
}

function ClearAllPieces () {
    document.querySelectorAll(".Piece").forEach(element => {
        element.innerText = "";             // Clear the piece symbol
        element.classList.remove("Piece");  // Remove the piece class
    });
}

function SetInitialBoardPieces() {

    let sq;
    let sq120;
    let file, rank;
    let pce;

    for(sq =0; sq <64; ++sq) {
        sq120 = SQ120(sq);
        pce = GameBoard.pieces[sq120];

        file = FilesBrd[sq120];
        rank = RanksBrd[sq120];

        if (pce >= PIECES.wP && pce <= PIECES.bK) {
            AddGUIPiece(sq120, pce)
        }
    }

}

const chessPiece = {
    wK:      "\u{2654}",
    wQ:     "\u{2655}",
    wR:      "\u{2656}",
    wB:    "\u{2657}",
    wN:    "\u{2658}",
    wP:      "\u{2659}",

    bK:      "\u{265A}",
    bQ:     "\u{265B}",
    bR:      "\u{265C}",
    bB:    "\u{265D}",
    bN:    "\u{265E}",
    bP:      "\u{265F}"
}


function SetSqSelected(sq) {


    document.querySelectorAll('.Square').forEach(function(square) {

        if (PieceIsOnSq (sq, square.offsetTop, square.offsetLeft) == true) {

        // if( RanksBrd[sq] == 7 - Math.round(square.offsetTop / 60) && FilesBrd[sq] == Math.round(square.offsetLeft / 60) ) {
            square.classList.add("SqSelected");
        }
    });
    
    ClearHighlights();

    if (PieceCol[GameBoard.pieces[sq]] === GameBoard.side) {
        HighlightLegalMoves(sq);
    }
}

function Deselect() {

    UserMove.from = SQUARES.NO_SQ;
    UserMove.to = SQUARES.NO_SQ;

    document.querySelectorAll('.Square').forEach(function(square) {
            square.classList.remove("SqSelected");
    });
}


function ClickSquare (pageX, pageY) {

    Debug('play', `Click square at ${pageX}, ${pageY}`);
    let board = document.getElementById('Board');
    let position = board.getBoundingClientRect();

    // find the distance from the left of the board by div by 60px
    let file = Math.floor((pageX - position.left) / 60);
    let rank = 7 - Math.floor((pageY - position.top) / 60);

    let sq = FR2SQ(file,rank);

    Debug('play', `Clicked square: ${PrSq(sq)}`);

    SetSqSelected(sq);

    return sq;
}

document.addEventListener("click", function (e) {
    let square = e.target.closest('.Square');
    if (!square) return;

    Debug('select', "Square click");

    let clickedSq = ClickSquare(e.pageX, e.pageY);

    if (UserMove.from === SQUARES.NO_SQ) {
        UserMove.from = clickedSq;
        MakeUserMove();
    } else {
        UserMove.to = clickedSq;
        MakeUserMove();
    }
});

function MakeUserMove () {
    if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {

        Debug('select', `User Move: ${PrSq(UserMove.from)}, ${PrSq(UserMove.to)}`);

        let parsed = ParseMove(UserMove.from, UserMove.to)

        if(parsed != NOMOVE) {
            MakeMove(parsed);
            PrintBoard();
            MoveGUIPiece(parsed);
            CheckAndSet();
            PreSearch();
        }

        Deselect();

        //Piece validation white move first then black
    } else if (UserMove.from !== SQUARES.NO_SQ && UserMove.to === SQUARES.NO_SQ) {

        let piece = GameBoard.pieces[UserMove.from];

        if (piece === PIECES.EMPTY || PieceCol[piece] !== GameBoard.side) {
            Debug('select', 'Invalid piece selected');
            Deselect();
        }
    }
}

function PieceIsOnSq(sq, top, left) {

    if (RanksBrd[sq] == 7 - Math.round(top / 60) && FilesBrd[sq] == Math.round(left / 60) ) {
        return true;
    }

    return false;
}

function RemoveGUIPiece(sq) {
    document.querySelectorAll('.Piece').forEach(function(square) {

        if (PieceIsOnSq (sq, square.offsetTop, square.offsetLeft) == true) {
            square.innerText = " ";
            square.classList.remove("Piece");
        }
    });
}

function AddGUIPiece(sq, pce) {
    let file = FilesBrd[sq];
    let rank = RanksBrd[sq];
    let rankName = "rank" + (rank + 1);
    let fileName = "file" + (file + 1);

    let pceKey = PceChar[pce].toUpperCase();
    let colorKey = (PieceCol[pce] === COLORS.WHITE) ? "w" : "b";
    let symbol = chessPiece[colorKey + pceKey];

    let square = document.querySelector(`.${rankName}.${fileName}`);
    if(square) {
        square.innerText = symbol;
        square.classList.add("Piece")
    }
}

function MoveGUIPiece(move) {

    let from = FROMSQ(move);
    let to = TOSQ(move);
    let moved = false;

    if(move & MFLAGEP) {
        let epRemove;
        if(GameBoard.side == COLORS.BLACK) {
            epRemove = to - 10;
        } else {
            epRemove = to + 10;
        }
        RemoveGUIPiece(epRemove);
    } else if (CAPTURED(move)) {
        RemoveGUIPiece(to);
    }

    let fileTo = FilesBrd[to];
    let rankTo = RanksBrd[to];
    let rankNameTo = "rank" + (rankTo + 1);
    let fileNameTo = "file" + (fileTo + 1);

    document.querySelectorAll('.Piece').forEach(function(square) {
        if (PieceIsOnSq (from, square.offsetTop, square.offsetLeft) == true) {
            // 1. Get the square to move to
            // 2. Add text content + class names to that square
            // 3. Remove text content + class names from original square
            const toSquare = document.querySelector(`.${rankNameTo}.${fileNameTo}`);
            toSquare.textContent = square.textContent
            toSquare.classList.add('Piece')
            // Don't know why the destination square gets this class name. Have to remove it here.
            toSquare.classList.remove('SqSelected')
            square.textContent = null
            square.classList.remove('SqSelected', 'Piece')
            moved = true

            // We don't need to keep checking anymore, so we can exit the loop (and the entire callback itself)
            return
        }
    });

    if (!moved) {
        console.warn("Piece at 'from' not found visually, fallback AddGUIPiece");
        RemoveGUIPiece(from);  // Just in case
        AddGUIPiece(to, GameBoard.pieces[to]); // Use actual piece at 'to'
    }

    if(move & MFLAGCA) {
        switch(to) {
            case SQUARES.G1: RemoveGUIPiece(SQUARES.H1); AddGUIPiece(SQUARES.F1, PIECES.wR); break;
            case SQUARES.C1: RemoveGUIPiece(SQUARES.A1); AddGUIPiece(SQUARES.D1, PIECES.wR); break;
            case SQUARES.G8: RemoveGUIPiece(SQUARES.H8); AddGUIPiece(SQUARES.F8, PIECES.bR); break;
            case SQUARES.C8: RemoveGUIPiece(SQUARES.A8); AddGUIPiece(SQUARES.D8, PIECES.bR); break;
        }
    } else if (PROMOTED(move)) {
        RemoveGUIPiece(to);
        AddGUIPiece(to, PROMOTED(move));
    }

    Deselect();
    HighlightInCheck();
}

// Draw statements
function DrawMaterial() {

    if (GameBoard.pceNum[PIECES.wP] != 0 || GameBoard.pceNum[PIECES.bP] != 0) return false;
    if (GameBoard.pceNum[PIECES.wQ] != 0 || GameBoard.pceNum[PIECES.bQ] != 0 ||
        GameBoard.pceNum[PIECES.wR] != 0 || GameBoard.pceNum[PIECES.bR] != 0) return false;

    if (GameBoard.pceNum[PIECES.wB] > 1 || GameBoard.pceNum[PIECES.bB] > 1) return false;
    if (GameBoard.pceNum[PIECES.wN] > 1 || GameBoard.pceNum[PIECES.bN] > 1) return false;

    if (GameBoard.pceNum[PIECES.wN] != 0 && GameBoard.pceNum[PIECES.wB] != 0) return false;
    if (GameBoard.pceNum[PIECES.bN] != 0 && GameBoard.pceNum[PIECES.bB] != 0) return false;

    return true;
}

// 3 fold repetion
function ThreeFold() {
    let i = 0;
    let r = 0;

    for (i = 0; i < GameBoard.hisPly; ++i) {
        if (GameBoard.history[i].posKey ==  GameBoard.posKey) {
            r++;
        }
    }
    return r;
}

function CheckResult() {

    if (GameBoard.fiftyMove >= 100) {
    document.getElementById('GameStatus').textContent = "GAME DRAWN {fifty move rule}";
    return true;
    }

    if (ThreeFold() >= 2) {
    document.getElementById('GameStatus').textContent = "GAME DRAWN {3-fold repetition}";
    return true;
    }

    if (DrawMaterial() == true) {
    document.getElementById('GameStatus').textContent = "GAME DRAWN {insufficient material to mate}";
    return true;
    }

    GenerateMoves();

    let moveNum = 0;
    let found = 0;

    for (moveNum = GameBoard.moveListStart[GameBoard.ply]; moveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++moveNum) {

        if (MakeMove(GameBoard.moveList[moveNum]) == false) {
            continue;
        }
        found++;
        TakeMove();
        break;
    }

    if(found !=0) return false;

	let InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side],0)], GameBoard.side^1);

    if (InCheck == true) {
        if (GameBoard.side == COLORS.WHITE) {
            document.getElementById('GameStatus').textContent = "GAME OVER {black mates}";
            return true;
        } else {
            document.getElementById('GameStatus').textContent = "GAME OVER {white mates}";
            return true;
        }
    } else {
        document.getElementById('GameStatus').textContent = "GAME DRAWN {stalemate}";
        return true;
    }
}

function CheckAndSet() {

    if (CheckResult() == true) {
		GameController.GameOver = true;
	} else {
		GameController.GameOver = false;
        document.getElementById('GameStatus').textContent = '';
    }
}

// Get engine to search
function PreSearch() {

    if (GameController.GameOver == false) {
        SearchController.thinking = true;

        setTimeout(function() {StartSearch();}, 200);
    }
}

document.getElementById("SearchButton").addEventListener("click", function () {
    GameController.PlayerSide = GameController.side ^ 1;
    PreSearch();
});


function StartSearch() {
    SearchController.depth = MAXDEPTH;
    let t = Date.now();
    let tt = document.getElementById('ThinkingTimeChoice').value;

    SearchController.time = parseInt(tt) * 1000;
    SearchPosition();

    MakeMove(SearchController.best);
    MoveGUIPiece(SearchController.best);
    CheckAndSet();
}

let selectedSquare = null;

function HighlightLegalMoves(sq) {

    

    if (selectedSquare === sq) {
        ClearHighlights();
        selectedSquare = null;
        return;
    }

    selectedSquare = sq;

    ClearHighlights();
    GenerateMoves();

    for (
        let i = GameBoard.moveListStart[GameBoard.ply];
        i < GameBoard.moveListStart[GameBoard.ply + 1];
        i++
    ) {
        let move = GameBoard.moveList[i];

        if (FROMSQ(move) === sq) {
            if (MakeMove(move)) {
                TakeMove();

                let toSq = TOSQ(move);
                let file = FilesBrd[toSq];
                let rank = RanksBrd[toSq];

                let square = document.querySelector(`.file${file + 1}.rank${rank + 1}`);
                if (square) {
                    square.classList.add("highlight");
                }
            }
        }
    }
}

function HighlightInCheck() {
    ClearHighlights(); // clear any old check highlights first

    let kingSq = GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)];
    if (SqAttacked(kingSq, GameBoard.side ^ 1)) {
        let file = FilesBrd[kingSq];
        let rank = RanksBrd[kingSq];
        let square = document.querySelector(`.file${file + 1}.rank${rank + 1}`);
        if (square) {
            square.classList.add("check");
        }
    }
}

function ClearHighlights() {
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    document.querySelectorAll('.check').forEach(el => el.classList.remove('check'));
}