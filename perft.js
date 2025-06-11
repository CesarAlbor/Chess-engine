let perft_leafNodes;

function Perft(depth) { 	

	if(depth == 0) {
        perft_leafNodes++;
        return;
    }	
    
    GenerateMoves();
    
	let index;
	let move;
	
	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
	
		move = GameBoard.moveList[index];	
		if(MakeMove(move) == false) {
			continue;
		}		
		Perft(depth-1);
		TakeMove();
	}
    
    return;
}

function PerftTest(depth) {    

	PrintBoard();
    Debug('perftTest', `Starting Test to Depth: ${depth}`);
    perft_leafNodes = 0;

	let index;
	let move;
	let moveNum = 0;

    // GenerateMoves();

    for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
	
		move = GameBoard.moveList[index];	
		if(MakeMove(move) == false) {
			continue;
		}	
		moveNum++;	
        let cumnodes = perft_leafNodes;
		Perft(depth-1);
		TakeMove();
		let oldnodes = perft_leafNodes - cumnodes;

        Debug('perftTest', `Move: ${moveNum}, ${PrMove(move)}, ${oldnodes}`);

    }

    Debug('perftTest', `Test complete: ${perft_leafNodes} leaf nodes visited`);

    return;
}