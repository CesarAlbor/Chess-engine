//DDebuggin flag
function Debug(flag, ...others){
    const flags = {
        board: false,
        fen: true,
        layout: false,
        gameData: true,
        move: true,
        moveList: false,
        promotion: false,
        pieceList: true,
        perftTest: true,
        search: true,
        play: false,
        select: true,
    };

    if (flags[flag]) {
        console.log(`[${flag}]`, ...others);
    }
}

// Pieces data
const PIECES =  { EMPTY : 0, wP : 1, wN : 2, wB : 3,wR : 4, wQ : 5, wK : 6, 
            bP : 7, bN : 8, bB : 9, bR : 10, bQ : 11, bK : 12  };
// Board sizes
const BRD_SQ_NUM = 120;

// Row and col
const FILES =  { FILE_A:0, FILE_B:1, FILE_C:2, FILE_D:3, 
	FILE_E:4, FILE_F:5, FILE_G:6, FILE_H:7, FILE_NONE:8 };
	
const RANKS =  { RANK_1:0, RANK_2:1, RANK_3:2, RANK_4:3, 
	RANK_5:4, RANK_6:5, RANK_7:6, RANK_8:7, RANK_NONE:8 };

// Colors
const COLORS = { WHITE:0, BLACK:1, BOTH:2 };

// Castle types
const CASTLEBIT = { WKCA : 1, WQCA : 2, BKCA : 4, BQCA : 8 };
// Squares on boards
const SQUARES = {
    A1:21, B1:22, C1:23, D1:24, E1:25, F1:26, G1:27, H1:28,  
    A8:91, B8:92, C8:93, D8:94, E8:95, F8:96, G8:97, H8:98, 
    NO_SQ:99, OFFBOARD:100
};

//Max game moves
const MAXGAMEMOVES = 2048;
// Max position moves
const MAXPOSITIONMOVES = 256;
// Max depth for engine to search
const MAXDEPTH = 64;
// Set infinity to a value higher than the current search and a mate score;
const INFINITE = 30000;
const MATE = 29000;
const PVENTRIES = 10000;

// Array for row and col
const FilesBrd = new Array(BRD_SQ_NUM);
const RanksBrd = new Array(BRD_SQ_NUM);

// Starting fen and fen notations
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PceChar = ".PNBRQKpnbrqk";
const SideChar = "wb-";
const RankChar = "12345678";
const FileChar = "abcdefgh";

// Formula for squares numbers
function FR2SQ(f,r) {
 	return ( (21 + (f) ) + ( (r) * 10 ) );
}

// Piece big aka not pawn
const PieceBig = [ false, false, true, true, true, true, true, false, true, true, true, true, true ];
// Major piece Queen or rook
const PieceMaj = [ false, false, false, false, true, true, true, false, false, false, true, true, true ];
// Minor piece bishop or knight
const PieceMin = [ false, false, true, true, false, false, false, false, true, true, false, false, false ];
// Piece Value. Pawn = 100, Knight = 325, Bishop, = 325, Rook = 550, Queen = 1000, King = 50000
const PieceVal= [ 0, 100, 325, 325, 550, 1000, 50000, 100, 325, 325, 550, 1000, 50000  ];
// Piece color
const PieceCol = [ COLORS.BOTH, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE,
	COLORS.BLACK, COLORS.BLACK, COLORS.BLACK, COLORS.BLACK, COLORS.BLACK, COLORS.BLACK ];
// Piece identification
const PiecePawn = [ false, true, false, false, false, false, false, true, false, false, false, false, false ];	
const PieceKnight = [ false, false, true, false, false, false, false, false, true, false, false, false, false ];
const PieceKing = [ false, false, false, false, false, false, true, false, false, false, false, false, true ];
const PieceRookQueen = [ false, false, false, false, true, true, false, false, false, false, true, true, false ];
const PieceBishopQueen = [ false, false, false, true, false, true, false, false, false, true, false, true, false ];
// Piece slides
const PieceSlides = [ false, false, false, true, true, true, false, false, false, true, true, true, false ];

// Knight Directions
const KnDir = [ -8, -19,	-21, -12, 8, 19, 21, 12 ];
// Rook Directions
const RkDir = [ -1, -10,	1, 10 ];
// Bishop Directions
const BiDir = [ -9, -11, 11, 9 ];
// King Directions
const KiDir = [ -1, -10,	1, 10, -9, -11, 11, 9 ];
// Number of directions for each piece
const DirNum = [ 0, 0, 8, 4, 4, 8, 8, 0, 8, 4, 4, 8, 8 ];
// Piece direction with relations to DirNum
const PceDir = [ 0, 0, KnDir, BiDir, RkDir, KiDir, KiDir, 0, KnDir, BiDir, RkDir, KiDir, KiDir ];

// Non slide Piece type according to side
const LoopNonSlidePce = [ PIECES.wN, PIECES.wK, 0, PIECES.bN, PIECES.bK, 0 ];
// White starts at 0, Black at 3. According to array above
const LoopNonSlideIndex = [ 0, 3 ];
// Slide Piece type according to side
const LoopSlidePce = [ PIECES.wB, PIECES.wR, PIECES.wQ, 0, PIECES.bB, PIECES.bR, PIECES.bQ, 0 ];
// White starts at 0, Black at 4. According to array above
const LoopSlideIndex = [ 0, 4];

// Piece keys aka piece on particular square
const PieceKeys = new Array(14 * 120);
var SideKey;
const CastleKeys = new Array(16);

// Array convertion from 120sqr to 64 sqr
const Sq120ToSq64 = new Array(BRD_SQ_NUM);
const Sq64ToSq120 = new Array(64);

// Setting XOR Hash key for Zobrist key
function RAND_32() {

	return (Math.floor((Math.random()*255)+1) << 23) | (Math.floor((Math.random()*255)+1) << 16)
		| (Math.floor((Math.random()*255)+1) << 8) | Math.floor((Math.random()*255)+1);

}

// Mirrors pieces table 
const Mirror64 = [
56	,	57	,	58	,	59	,	60	,	61	,	62	,	63	,
48	,	49	,	50	,	51	,	52	,	53	,	54	,	55	,
40	,	41	,	42	,	43	,	44	,	45	,	46	,	47	,
32	,	33	,	34	,	35	,	36	,	37	,	38	,	39	,
24	,	25	,	26	,	27	,	28	,	29	,	30	,	31	,
16	,	17	,	18	,	19	,	20	,	21	,	22	,	23	,
8	,	9	,	10	,	11	,	12	,	13	,	14	,	15	,
0	,	1	,	2	,	3	,	4	,	5	,	6	,	7
];

// Get 64sqr board value from 120sqr board
function SQ64(sq120) { 
	return Sq120ToSq64[(sq120)];
}

// Get 120sqr board value from 64sqr board
function SQ120(sq64) {
	return Sq64ToSq120[(sq64)];
}

function PCEINDEX(pce, pceNum) {
	return (pce * 10 + pceNum);
}

function MIRROR64(sq) {
	return Mirror64[sq];
}

const Kings = [PIECES.wK, PIECES.bK];
const CastlePerm = [
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 13, 15, 15, 15, 12, 15, 15, 14, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15,  7, 15, 15, 15,  3, 15, 15, 11, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15
];

/* Setting up from, to, capture, En Passant and promoted on hexcadecimal
0000 0000 0000 0000 0000 0111 1111 -> From 0x7F
0000 0000 0000 0011 1111 1000 0000 -> To >> 7, 0x7F
0000 0000 0011 1100 0000 0000 0000-> Capture >> 14, 0xF
0000 0000 0100 0000 0000 0000 0000-> En Passant 0x40000
0000 0000 1000 0000 0000 0000 0000-> Pawn start 0x80000
0000 1111 0000 0000 0000 0000 0000 -> Promoted >> 20, 0xF
0001 0000 0000 0000 0000 0000 0000 -> Castle 0x1000000
*/
function FROMSQ(m) { return (m & 0x7F); }
function TOSQ(m) { return ( (m >> 7) & 0x7F); }
function CAPTURED(m) { return ( (m >> 14) & 0xF); }
function PROMOTED(m) { return ( (m >> 20) & 0xF); }
// Move flag for En Passant, Pawn start, Castling and promotion
const MFLAGEP = 0x40000;
const MFLAGPS = 0x80000;
const MFLAGCA = 0x1000000;
const MFLAGPROM = 0xF00000;
// Move flag for capture, including En passant and capture
// 0000 0000 0111 1100 0000 0000 0000
const MFLAGCAP = 0x7C000;

const NOMOVE = 0;

function SQOFFBOARD(sq) {
	if(FilesBrd[sq]==SQUARES.OFFBOARD) return true;
	return false;	
}

// Hash keys functions
function HASH_PCE(pce, sq) {GameBoard.posKey ^= PieceKeys[(pce * 120) + sq]; }
function HASH_CA() { GameBoard.posKey ^= CastleKeys[GameBoard.castlePerm]; }
function HASH_SIDE() { GameBoard.posKey ^= SideKey; }
function HASH_EP() { GameBoard.posKey ^= PieceKeys[GameBoard.enPas]; }

const GameController = {
    EngineSide: COLORS.BOTH,
    PlayerSide: COLORS.BOTH,
    GameOVer: false,
}

const UserMove = {
    from: SQUARES.NO_SQ,
    to: SQUARES.NO_SQ,
}