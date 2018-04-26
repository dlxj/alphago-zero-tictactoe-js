export default class Arena {
  // """
  // An Arena class where any 2 agents can be pit against each other.
  // """
  //
  constructor(player1, player2, game, display) {
    console.log('Arena constructer');
    this.player1 = player1;
    this.player2 = player2;
    this.game = game;
    this.display = display;

    // Grimmer. used for pretrained-ai vs human
    this.players = null;
    this.curPlayer = 0; // 0:dummy. real values: 1 or -1
    this.boardNdArray = null;
  }

  gamveMoveByAction(action) {
    let valids = this.game.getValidMoves(this.game.getCanonicalForm(this.boardNdArray, this.curPlayer), 1);
    valids = valids.tolist();
    if (valids[action] == 0) {
      console.log(action);
      // assert valids[action] >0
      throw 'can not find out valid action, something wrong';
    }
    const nextState = this.game.getNextState(this.boardNdArray, this.curPlayer, action);
    this.boardNdArray = nextState.boardNdArray;
    this.curPlayer = nextState.curPlayer;
  }

  // a: board index from 0 to 8
  humanStep(action) {
    console.log('humanStep');
    console.log(`current Player: ${this.curPlayer}`);

    if (!this.players[this.curPlayer + 1].isHuman) {
      console.log('current player is ai, ignore');
      return;
    }

    // 上一個ai造成的ended?
    if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) !== 0) {
      // game is ended
      console.log('should not happen, game is ended already');
    }

    // if (verbose) {
    this.display(this.boardNdArray);
    // }

    // 就算最後一子還是要call吧.state要變化好

    // 1. human's step.
    this.gamveMoveByAction(action);

    // 2. auto ai
    this.tryToPlayAIStep();

    if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) !== 0) {
      // game is ended
      // if (verbose) {
      // console.log(`Game is ended: Turn ${it}. Result ${this.game.getGameEnded(this.boardNdArray, 1)}`);
      // assert(self.display)
      this.display(this.boardNdArray);
      // }

      // means it is ended
      return this.game.getGameEnded(this.boardNdArray, this.curPlayer);
    }

    return 0;

    // return this.game.getGameEnded(boardNdArray, 1);
  }

  // it will affect who is the first player of a new game
  swapTwoPlayers() {
    console.log('swap');
    const tmpPlayer1 = this.player1;
    this.player1 = this.player2,
    this.player2 = tmpPlayer1;
  }

  tryToPlayAIStep() {
    console.log('tryToPlayAIStep');
    if (!this.players[this.curPlayer + 1].isHuman) {
      // it is an AI

      // let it = 0;
      if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) === 0) {
        // curPlayer: 1 (this.player1) or -1 (this.player2)
        // it += 1;
        // if (verbose) {
        this.display(this.boardNdArray);
        console.log(`Player ${this.curPlayer}`);
        // }

        const action = this.players[this.curPlayer + 1].play(this.game.getCanonicalForm(this.boardNdArray, this.curPlayer));
        this.gamveMoveByAction(action);

        // let valids = this.game.getValidMoves(this.game.getCanonicalForm(this.boardNdArray, this.curPlayer), 1);
        // valids = valids.tolist();
        //
        // if (valids[action] == 0) {
        //   console.log(action);
        //   // assert valids[action] >0
        //   throw 'can not find out valid action, something wrong';
        // }
        // const nextState = this.game.getNextState(this.boardNdArray, this.curPlayer, action);
        // this.boardNdArray = nextState.boardNdArray;
        // this.curPlayer = nextState.curPlayer;
      } else {
        console.log('game is already ended');
      }
    } else {
      console.log('current player is human, ignore');
    }
  }

  // TODO: 1.可以由ui寫要不要自動restart的logic, 2. call swap function 也是
  // 3. handle the case to give up+restart game. this.game needs reset
  playNewGameWithHuman() {
    this.players = [this.player2, null, this.player1];
    this.curPlayer = 1;
    this.boardNdArray = this.game.getInitBoardNdArray(); // !!!

    // first player (player1) may be human or AI
    this.tryToPlayAIStep();
  }

  playGame(verbose = false) {
    const players = [this.player2, null, this.player1];
    let curPlayer = 1;
    let boardNdArray = this.game.getInitBoardNdArray();
    let it = 0;
    while (this.game.getGameEnded(boardNdArray, curPlayer) === 0) {
      // curPlayer: 1 or -1
      it += 1;
      if (verbose) {
        this.display(boardNdArray);
        console.log(`Turn ${it}. Player ${curPlayer}`);
      }
      const action = players[curPlayer + 1].play(this.game.getCanonicalForm(boardNdArray, curPlayer));
      let valids = this.game.getValidMoves(this.game.getCanonicalForm(boardNdArray, curPlayer), 1);
      valids = valids.tolist();

      if (valids[action] == 0) {
        console.log(action);
        // assert valids[action] >0
        throw 'can not find out valid action, something wrong';
      }
      const nextState = this.game.getNextState(boardNdArray, curPlayer, action);
      boardNdArray = nextState.boardNdArray;
      curPlayer = nextState.curPlayer;
    }

    if (verbose) {
      console.log(`Game over: Turn ${it}. Result ${this.game.getGameEnded(boardNdArray, 1)}`);
      // assert(self.display)
      this.display(boardNdArray);
    }

    return this.game.getGameEnded(boardNdArray, 1);
  }


  playGames(num, verbose = false) {
    // eps_time = AverageMeter()
    // bar = Bar('Arena.playGames', max=num)
    // end = time.time()
    const esp = 0;
    const maxeps = Math.floor(num); // int(num)

    num = Math.floor(num / 2);
    let oneWon = 0;
    let twoWon = 0;
    let draws = 0;
    for (let i = 0; i < num; i++) {
      const gameResult = this.playGame(verbose);
      if (gameResult == 1) {
        oneWon += 1;
      } else if (gameResult == -1) {
        twoWon += 1;
      } else {
        draws += 1;
      }

      // # bookkeeping + plot progress
      // eps += 1
      // eps_time.update(time.time() - end)
      // end = time.time()
      // bar.suffix  = '({eps}/{maxeps}) Eps Time: {et:.3f}s | Total: {total:} | ETA: {eta:}'.format(eps=eps+1, maxeps=maxeps, et=eps_time.avg,
      //                                                                                            total=bar.elapsed_td, eta=bar.eta_td)
      // bar.next()
    }

    this.swapTwoPlayers();
    // console.log('swap');
    // const tmpPlayer1 = this.player1;
    // this.player1 = this.player2,
    // this.player2 = tmpPlayer1;

    for (let i = 0; i < num; i++) {
      const gameResult = this.playGame(verbose);
      if (gameResult == -1) {
        oneWon += 1;
      } else if (gameResult == 1) {
        twoWon += 1;
      } else {
        draws += 1;
      }

      // # bookkeeping + plot progress
      // eps += 1
      // eps_time.update(time.time() - end)
      // end = time.time()
      // bar.suffix  = '({eps}/{maxeps}) Eps Time: {et:.3f}s | Total: {total:} | ETA: {eta:}'.format(eps=eps+1, maxeps=num, et=eps_time.avg,
      //                                                                                            total=bar.elapsed_td, eta=bar.eta_td)
      // bar.next()
    }
    // bar.finish()

    return { oneWon, twoWon, draws };
  }
}
