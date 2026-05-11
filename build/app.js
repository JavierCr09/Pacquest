class Ghost {
  constructor(
    scaledTileSize, mazeArray, pacman, name, level, characterUtil, blinky,
  ) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = mazeArray;
    this.pacman = pacman;
    this.name = name;
    this.level = level;
    this.characterUtil = characterUtil;
    this.blinky = blinky;
    this.animationTarget = document.getElementById(name);

    this.reset();
  }

  /**
   * Rests the character to its default state
   * @param {Boolean} fullGameReset
   */
  reset(fullGameReset) {
    if (fullGameReset) {
      delete this.defaultSpeed;
      delete this.cruiseElroy;
    }

    this.setDefaultMode();
    this.setMovementStats(this.pacman, this.name, this.level);
    this.setSpriteAnimationStats();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.setDefaultPosition(this.scaledTileSize, this.name);
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the default mode and idleMode behavior
   */
  setDefaultMode() {
    this.allowCollision = true;
    this.defaultMode = 'scatter';
    this.mode = 'scatter';
    if (this.name !== 'blinky') {
      this.idleMode = 'idle';
    }
  }

  /**
   * Sets various properties related to the ghost's movement
   * @param {Object} pacman - Pacman's speed is used as the base for the ghosts' speeds
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   */
  setMovementStats(pacman, name, level) {
    const pacmanSpeed = pacman.velocityPerMs;
    const levelAdjustment = level / 100;

    this.slowSpeed = pacmanSpeed * (0.75 + levelAdjustment);
    this.mediumSpeed = pacmanSpeed * (0.875 + levelAdjustment);
    this.fastSpeed = pacmanSpeed * (1 + levelAdjustment);

    if (!this.defaultSpeed) {
      this.defaultSpeed = this.slowSpeed;
    }

    this.scaredSpeed = pacmanSpeed * 0.5;
    this.transitionSpeed = pacmanSpeed * 0.4;
    this.eyeSpeed = pacmanSpeed * 2;

    this.velocityPerMs = this.defaultSpeed;
    this.moving = false;

    switch (name) {
      case 'blinky':
        this.defaultDirection = this.characterUtil.directions.left;
        break;
      case 'pinky':
        this.defaultDirection = this.characterUtil.directions.down;
        break;
      case 'inky':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      case 'clyde':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      default:
        this.defaultDirection = this.characterUtil.directions.left;
        break;
    }
    this.direction = this.defaultDirection;
  }

  /**
   * Sets values pertaining to the ghost's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.display = true;
    this.loopAnimation = true;
    this.animate = true;
    this.msBetweenSprites = 250;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 2;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Sets css property values for the ghost
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in the ghost's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    // The ghosts are the size of 2x2 game tiles.
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    const bgSize = this.measurement * spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
  }

  /**
   * Sets the default position and direction for the ghosts at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   */
  setDefaultPosition(scaledTileSize, name) {
    switch (name) {
      case 'blinky':
        this.defaultPosition = {
          top: scaledTileSize * 10.5,
          left: scaledTileSize * 13,
        };
        break;
      case 'pinky':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 13,
        };
        break;
      case 'inky':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 11,
        };
        break;
      case 'clyde':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 15,
        };
        break;
      default:
        this.defaultPosition = {
          top: 0,
          left: 0,
        };
        break;
    }
    this.position = Object.assign({}, this.defaultPosition);
    this.oldPosition = Object.assign({}, this.position);
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   */
  setSpriteSheet(name, direction, mode) {
    let emotion = '';
    if (this.defaultSpeed !== this.slowSpeed) {
      emotion = (this.defaultSpeed === this.mediumSpeed)
        ? '_annoyed' : '_angry';
    }

    if (mode === 'scared') {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/scared_${this.scaredColor}.svg)`;
    } else if (mode === 'eyes') {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/eyes_${direction}.svg)`;
    } else {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/${name}/${name}_${direction}`
        + `${emotion}.svg)`;
    }
  }

  /**
   * Checks to see if the ghost is currently in the 'tunnels' on the outer edges of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInTunnel(gridPosition) {
    return (
      gridPosition.y === 14
      && (gridPosition.x < 6 || gridPosition.x > 21)
    );
  }

  /**
   * Checks to see if the ghost is currently in the 'Ghost House' in the center of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInGhostHouse(gridPosition) {
    return (
      (gridPosition.x > 9 && gridPosition.x < 18)
      && (gridPosition.y > 11 && gridPosition.y < 17)
    );
  }

  /**
   * Checks to see if the tile at the given coordinates of the Maze is an open position
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {number} y - The target row
   * @param {number} x - The target column
   * @returns {(false | { x: number, y: number})} - x-y pair if the tile is free, false otherwise
   */
  getTile(mazeArray, y, x) {
    let tile = false;

    if (mazeArray[y] && mazeArray[y][x] && mazeArray[y][x] !== 'X') {
      tile = {
        x,
        y,
      };
    }

    return tile;
  }

  /**
   * Returns a list of all of the possible moves for the ghost to make on the next turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @returns {object}
   */
  determinePossibleMoves(gridPosition, direction, mazeArray) {
    const { x, y } = gridPosition;

    const possibleMoves = {
      up: this.getTile(mazeArray, y - 1, x),
      down: this.getTile(mazeArray, y + 1, x),
      left: this.getTile(mazeArray, y, x - 1),
      right: this.getTile(mazeArray, y, x + 1),
    };

    // Ghosts are not allowed to turn around at crossroads
    possibleMoves[this.characterUtil.getOppositeDirection(direction)] = false;

    Object.keys(possibleMoves).forEach((tile) => {
      if (possibleMoves[tile] === false) {
        delete possibleMoves[tile];
      }
    });

    return possibleMoves;
  }

  /**
   * Uses the Pythagorean Theorem to measure the distance between a given postion and Pacman
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacman - Pacman's current x-y position on the 2D Maze Array
   * @returns {number}
   */
  calculateDistance(position, pacman) {
    return Math.sqrt(
      ((position.x - pacman.x) ** 2) + ((position.y - pacman.y) ** 2),
    );
  }

  /**
   * Gets a position a number of spaces in front of Pacman's direction
   * @param {({x: number, y: number})} pacmanGridPosition
   * @param {number} spaces
   */
  getPositionInFrontOfPacman(pacmanGridPosition, spaces) {
    const target = Object.assign({}, pacmanGridPosition);
    const pacDirection = this.pacman.direction;
    const propToChange = (pacDirection === 'up' || pacDirection === 'down')
      ? 'y' : 'x';
    const tileOffset = (pacDirection === 'up' || pacDirection === 'left')
      ? (spaces * -1) : spaces;
    target[propToChange] += tileOffset;

    return target;
  }

  /**
   * Determines Pinky's target, which is four tiles in front of Pacman's direction
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determinePinkyTarget(pacmanGridPosition) {
    return this.getPositionInFrontOfPacman(
      pacmanGridPosition, 4,
    );
  }

  /**
   * Determines Inky's target, which is a mirror image of Blinky's position
   * reflected across a point two tiles in front of Pacman's direction.
   * Example @ app\style\graphics\spriteSheets\references\inky_target.png
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineInkyTarget(pacmanGridPosition) {
    const blinkyGridPosition = this.characterUtil.determineGridPosition(
      this.blinky.position, this.scaledTileSize,
    );
    const pivotPoint = this.getPositionInFrontOfPacman(
      pacmanGridPosition, 2,
    );
    return {
      x: pivotPoint.x + (pivotPoint.x - blinkyGridPosition.x),
      y: pivotPoint.y + (pivotPoint.y - blinkyGridPosition.y),
    };
  }

  /**
   * Clyde targets Pacman when the two are far apart, but retreats to the
   * lower-left corner when the two are within eight tiles of each other
   * @param {({x: number, y: number})} gridPosition
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineClydeTarget(gridPosition, pacmanGridPosition) {
    const distance = this.calculateDistance(gridPosition, pacmanGridPosition);
    return (distance > 8) ? pacmanGridPosition : { x: 0, y: 30 };
  }

  /**
   * Determines the appropriate target for the ghost's AI
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {({x: number, y: number})}
   */
  getTarget(name, gridPosition, pacmanGridPosition, mode) {
    // Ghosts return to the ghost-house after eaten
    if (mode === 'eyes') {
      return { x: 13.5, y: 10 };
    }

    // Ghosts run from Pacman if scared
    if (mode === 'scared') {
      return pacmanGridPosition;
    }

    // Ghosts seek out corners in Scatter mode
    if (mode === 'scatter') {
      switch (name) {
        case 'blinky':
          // Blinky will chase Pacman, even in Scatter mode, if he's in Cruise Elroy form
          return (this.cruiseElroy ? pacmanGridPosition : { x: 27, y: 0 });
        case 'pinky':
          return { x: 0, y: 0 };
        case 'inky':
          return { x: 27, y: 30 };
        case 'clyde':
          return { x: 0, y: 30 };
        default:
          return { x: 0, y: 0 };
      }
    }

    switch (name) {
      // Blinky goes after Pacman's position
      case 'blinky':
        return pacmanGridPosition;
      case 'pinky':
        return this.determinePinkyTarget(pacmanGridPosition);
      case 'inky':
        return this.determineInkyTarget(pacmanGridPosition);
      case 'clyde':
        return this.determineClydeTarget(gridPosition, pacmanGridPosition);
      default:
        // TODO: Other ghosts
        return pacmanGridPosition;
    }
  }

  /**
   * Calls the appropriate function to determine the best move depending on the ghost's name
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {Object} possibleMoves - All of the moves the ghost could choose to make this turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineBestMove(
    name, possibleMoves, gridPosition, pacmanGridPosition, mode,
  ) {
    let bestDistance = (mode === 'scared') ? 0 : Infinity;
    let bestMove;
    const target = this.getTarget(name, gridPosition, pacmanGridPosition, mode);

    Object.keys(possibleMoves).forEach((move) => {
      const distance = this.calculateDistance(
        possibleMoves[move], target,
      );
      const betterMove = (mode === 'scared')
        ? (distance > bestDistance)
        : (distance < bestDistance);

      if (betterMove) {
        bestDistance = distance;
        bestMove = move;
      }
    });

    return bestMove;
  }

  /**
   * Determines the best direction for the ghost to travel in during the current frame
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineDirection(
    name, gridPosition, pacmanGridPosition, direction, mazeArray, mode,
  ) {
    let newDirection = direction;
    const possibleMoves = this.determinePossibleMoves(
      gridPosition, direction, mazeArray,
    );

    if (Object.keys(possibleMoves).length === 1) {
      [newDirection] = Object.keys(possibleMoves);
    } else if (Object.keys(possibleMoves).length > 1) {
      newDirection = this.determineBestMove(
        name, possibleMoves, gridPosition, pacmanGridPosition, mode,
      );
    }

    return newDirection;
  }

  /**
   * Handles movement for idle Ghosts in the Ghost House
   * @param {*} elapsedMs
   * @param {*} position
   * @param {*} velocity
   * @returns {({ top: number, left: number})}
   */
  handleIdleMovement(elapsedMs, position, velocity) {
    const newPosition = Object.assign({}, this.position);

    if (position.y <= 13.5) {
      this.direction = this.characterUtil.directions.down;
    } else if (position.y >= 14.5) {
      this.direction = this.characterUtil.directions.up;
    }

    if (this.idleMode === 'leaving') {
      if (position.x === 13.5 && (position.y > 10.8 && position.y < 11)) {
        this.idleMode = undefined;
        newPosition.top = this.scaledTileSize * 10.5;
        this.direction = this.characterUtil.directions.left;
        window.dispatchEvent(new Event('releaseGhost'));
      } else if (position.x > 13.4 && position.x < 13.6) {
        newPosition.left = this.scaledTileSize * 13;
        this.direction = this.characterUtil.directions.up;
      } else if (position.y > 13.9 && position.y < 14.1) {
        newPosition.top = this.scaledTileSize * 13.5;
        this.direction = (position.x < 13.5)
          ? this.characterUtil.directions.right
          : this.characterUtil.directions.left;
      }
    }

    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;

    return newPosition;
  }

  /**
   * Sets idleMode to 'leaving', allowing the ghost to leave the Ghost House
   */
  endIdleMode() {
    this.idleMode = 'leaving';
  }

  /**
   * Handle the ghost's movement when it is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs, gridPosition, velocity, pacmanGridPosition) {
    const newPosition = Object.assign({}, this.position);

    this.direction = this.determineDirection(
      this.name, gridPosition, pacmanGridPosition, this.direction,
      this.mazeArray, this.mode,
    );
    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;

    return newPosition;
  }

  /**
   * Determines if an eaten ghost is at the entrance of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteringGhostHouse(mode, position) {
    return (
      mode === 'eyes'
      && position.y === 11
      && (position.x > 13.4 && position.x < 13.6)
    );
  }

  /**
   * Determines if an eaten ghost has reached the center of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteredGhostHouse(mode, position) {
    return (
      mode === 'eyes'
      && position.x === 13.5
      && (position.y > 13.8 && position.y < 14.2)
    );
  }

  /**
   * Determines if a restored ghost is at the exit of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  leavingGhostHouse(mode, position) {
    return (
      mode !== 'eyes'
      && position.x === 13.5
      && (position.y > 10.8 && position.y < 11)
    );
  }

  /**
   * Handles entering and leaving the Ghost House after a ghost is eaten
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @returns {({x: number, y: number})}
   */
  handleGhostHouse(gridPosition) {
    const gridPositionCopy = Object.assign({}, gridPosition);

    if (this.enteringGhostHouse(this.mode, gridPosition)) {
      this.direction = this.characterUtil.directions.down;
      gridPositionCopy.x = 13.5;
      this.position = this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
    }

    if (this.enteredGhostHouse(this.mode, gridPosition)) {
      this.direction = this.characterUtil.directions.up;
      gridPositionCopy.y = 14;
      this.position = this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
      this.mode = this.defaultMode;
      window.dispatchEvent(new Event('restoreGhost'));
    }

    if (this.leavingGhostHouse(this.mode, gridPosition)) {
      gridPositionCopy.y = 11;
      this.position = this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
      this.direction = this.characterUtil.directions.left;
    }

    return gridPositionCopy;
  }

  /**
   * Handle the ghost's movement when it is inbetween tiles on the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(elapsedMs, gridPosition, velocity) {
    const gridPositionCopy = this.handleGhostHouse(gridPosition);

    const desired = this.characterUtil.determineNewPositions(
      this.position, this.direction, velocity, elapsedMs, this.scaledTileSize,
    );

    if (this.characterUtil.changingGridPosition(
      gridPositionCopy, desired.newGridPosition,
    )) {
      return this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
    }

    return desired.newPosition;
  }

  /**
   * Determines the new Ghost position
   * @param {number} elapsedMs
   * @returns {({ top: number, left: number})}
   */
  handleMovement(elapsedMs) {
    let newPosition;

    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );
    const pacmanGridPosition = this.characterUtil.determineGridPosition(
      this.pacman.position, this.scaledTileSize,
    );
    const velocity = this.determineVelocity(
      gridPosition, this.mode,
    );

    if (this.idleMode) {
      newPosition = this.handleIdleMovement(
        elapsedMs, gridPosition, velocity,
      );
    } else if (JSON.stringify(this.position) === JSON.stringify(
      this.characterUtil.snapToGrid(
        gridPosition, this.direction, this.scaledTileSize,
      ),
    )) {
      newPosition = this.handleSnappedMovement(
        elapsedMs, gridPosition, velocity, pacmanGridPosition,
      );
    } else {
      newPosition = this.handleUnsnappedMovement(
        elapsedMs, gridPosition, velocity,
      );
    }

    newPosition = this.characterUtil.handleWarp(
      newPosition, this.scaledTileSize, this.mazeArray,
    );

    this.checkCollision(gridPosition, pacmanGridPosition);

    return newPosition;
  }

  /**
   * Changes the defaultMode to chase or scatter, and turns the ghost around
   * if needed
   * @param {('chase'|'scatter')} newMode
   */
  changeMode(newMode) {
    this.defaultMode = newMode;

    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );

    if ((this.mode === 'chase' || this.mode === 'scatter')
      && !this.cruiseElroy) {
      this.mode = newMode;

      if (!this.isInGhostHouse(gridPosition)) {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
    }
  }

  /**
   * Toggles a scared ghost between blue and white, then updates its spritsheet
   */
  toggleScaredColor() {
    this.scaredColor = (this.scaredColor === 'blue')
      ? 'white' : 'blue';
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the ghost's mode to SCARED, turns the ghost around,
   * and changes spritesheets accordingly
   */
  becomeScared() {
    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );

    if (this.mode !== 'eyes') {
      if (!this.isInGhostHouse(gridPosition) && this.mode !== 'scared') {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
      this.mode = 'scared';
      this.scaredColor = 'blue';
      this.setSpriteSheet(this.name, this.direction, this.mode);
    }
  }

  /**
   * Returns the scared ghost to chase/scatter mode and sets its spritesheet
   */
  endScared() {
    this.mode = this.defaultMode;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Speeds up the ghost (used for Blinky as Pacdots are eaten)
   */
  speedUp() {
    this.cruiseElroy = true;

    if (this.defaultSpeed === this.slowSpeed) {
      this.defaultSpeed = this.mediumSpeed;
    } else if (this.defaultSpeed === this.mediumSpeed) {
      this.defaultSpeed = this.fastSpeed;
    }
  }

  /**
   * Resets defaultSpeed to slow and updates the spritesheet
   */
  resetDefaultSpeed() {
    this.defaultSpeed = this.slowSpeed;
    this.cruiseElroy = false;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets a flag to indicate when the ghost should pause its movement
   * @param {Boolean} newValue
   */
  pause(newValue) {
    this.paused = newValue;
  }

  /**
   * Checks if the ghost contacts Pacman - starts the death sequence if so
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacman - Pacman's current x-y position on the 2D Maze Array
   */
  checkCollision(position, pacman) {
    if (this.calculateDistance(position, pacman) < 1
      && this.mode !== 'eyes'
      && this.allowCollision) {
      if (this.mode === 'scared') {
        window.dispatchEvent(new CustomEvent('eatGhost', {
          detail: {
            ghost: this,
          },
        }));
        this.mode = 'eyes';
      } else {
        window.dispatchEvent(new Event('deathSequence'));
      }
    }
  }

  /**
   * Determines the appropriate speed for the ghost
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {number}
   */
  determineVelocity(position, mode) {
    if (mode === 'eyes') {
      return this.eyeSpeed;
    }

    if (this.paused) {
      return 0;
    }

    if (this.isInTunnel(position) || this.isInGhostHouse(position)) {
      return this.transitionSpeed;
    }

    if (mode === 'scared') {
      return this.scaredSpeed;
    }

    return this.defaultSpeed;
  }

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    const newTop = this.characterUtil.calculateNewDrawValue(
      interp, 'top', this.oldPosition, this.position,
    );
    const newLeft = this.characterUtil.calculateNewDrawValue(
      interp, 'left', this.oldPosition, this.position,
    );
    this.animationTarget.style.top = `${newTop}px`;
    this.animationTarget.style.left = `${newLeft}px`;

    this.animationTarget.style.visibility = this.display
      ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
      : 'hidden';

    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
  }

  /**
   * Handles movement logic for the ghost
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = Object.assign({}, this.position);

    if (this.moving) {
      this.position = this.handleMovement(elapsedMs);
      this.setSpriteSheet(this.name, this.direction, this.mode);
      this.msSinceLastSprite += elapsedMs;
    }
  }
}


class Pacman {
  constructor(scaledTileSize, mazeArray, characterUtil) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = mazeArray;
    this.characterUtil = characterUtil;
    this.animationTarget = document.getElementById('pacman');
    this.pacmanArrow = document.getElementById('pacman-arrow');

    this.reset();
  }

  /**
   * Rests the character to its default state
   */
  reset() {
    this.setMovementStats(this.scaledTileSize);
    this.setSpriteAnimationStats();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.setDefaultPosition(this.scaledTileSize);
    this.setSpriteSheet(this.direction);
    this.pacmanArrow.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/arrow_${this.direction}.svg)`;
  }

  /**
   * Sets various properties related to Pacman's movement
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setMovementStats(scaledTileSize) {
    this.velocityPerMs = this.calculateVelocityPerMs(scaledTileSize);
    this.desiredDirection = this.characterUtil.directions.left;
    this.direction = this.characterUtil.directions.left;
    this.moving = false;
  }

  /**
   * Sets values pertaining to Pacman's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.specialAnimation = false;
    this.display = true;
    this.animate = true;
    this.loopAnimation = true;
    this.msBetweenSprites = 50;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 4;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Sets css property values for Pacman and Pacman's Arrow
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in Pacman's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    this.animationTarget.style.backgroundSize = `${
      this.measurement * spriteFrames
    }px`;

    this.pacmanArrow.style.height = `${this.measurement * 2}px`;
    this.pacmanArrow.style.width = `${this.measurement * 2}px`;
    this.pacmanArrow.style.backgroundSize = `${this.measurement * 2}px`;
  }

  /**
   * Sets the default position and direction for Pacman at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setDefaultPosition(scaledTileSize) {
    this.defaultPosition = {
      top: scaledTileSize * 22.5,
      left: scaledTileSize * 13,
    };
    this.position = Object.assign({}, this.defaultPosition);
    this.oldPosition = Object.assign({}, this.position);
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  /**
   * Calculates how fast Pacman should move in a millisecond
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  calculateVelocityPerMs(scaledTileSize) {
    // In the original game, Pacman moved at 11 tiles per second.
    const velocityPerSecond = scaledTileSize * 11;
    return velocityPerSecond / 1000;
  }

  /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   */
  setSpriteSheet(direction) {
    this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/pacman_${direction}.svg)`;
  }

  prepDeathAnimation() {
    this.loopAnimation = false;
    this.msBetweenSprites = 125;
    this.spriteFrames = 12;
    this.specialAnimation = true;
    this.backgroundOffsetPixels = 0;
    const bgSize = this.measurement * this.spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
    this.animationTarget.style.backgroundImage = 'url(app/style/'
      + 'graphics/spriteSheets/characters/pacman/pacman_death.svg)';
    this.animationTarget.style.backgroundPosition = '0px 0px';
    this.pacmanArrow.style.backgroundImage = '';
  }

  /**
   * Changes Pacman's desiredDirection, updates the PacmanArrow sprite, and sets moving to true
   * @param {Event} e - The keydown event to evaluate
   * @param {Boolean} startMoving - If true, Pacman will move upon key press
   */
  changeDirection(newDirection, startMoving) {
    this.desiredDirection = newDirection;
    this.pacmanArrow.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/arrow_${this.desiredDirection}.svg)`;

    if (startMoving) {
      this.moving = true;
    }
  }

  /**
   * Updates the position of the leading arrow in front of Pacman
   * @param {({top: number, left: number})} position - Pacman's position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  updatePacmanArrowPosition(position, scaledTileSize) {
    this.pacmanArrow.style.top = `${position.top - scaledTileSize}px`;
    this.pacmanArrow.style.left = `${position.left - scaledTileSize}px`;
  }

  /**
   * Handle Pacman's movement when he is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position, this.desiredDirection, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position, this.direction, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );

    if (this.characterUtil.checkForWallCollision(
      desired.newGridPosition, this.mazeArray, this.desiredDirection,
    )) {
      if (this.characterUtil.checkForWallCollision(
        alternate.newGridPosition, this.mazeArray, this.direction,
      )) {
        this.moving = false;
        return this.position;
      }
      return alternate.newPosition;
    }
    this.direction = this.desiredDirection;
    this.setSpriteSheet(this.direction);
    return desired.newPosition;
  }

  /**
   * Handle Pacman's movement when he is inbetween tiles on the x-y grid of the Maze Array
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(gridPosition, elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position, this.desiredDirection, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position, this.direction, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );

    if (this.characterUtil.turningAround(
      this.direction, this.desiredDirection,
    )) {
      this.direction = this.desiredDirection;
      this.setSpriteSheet(this.direction);
      return desired.newPosition;
    } if (this.characterUtil.changingGridPosition(
      gridPosition, alternate.newGridPosition,
    )) {
      return this.characterUtil.snapToGrid(
        gridPosition, this.direction, this.scaledTileSize,
      );
    }
    return alternate.newPosition;
  }

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    const newTop = this.characterUtil.calculateNewDrawValue(
      interp, 'top', this.oldPosition, this.position,
    );
    const newLeft = this.characterUtil.calculateNewDrawValue(
      interp, 'left', this.oldPosition, this.position,
    );
    this.animationTarget.style.top = `${newTop}px`;
    this.animationTarget.style.left = `${newLeft}px`;

    this.animationTarget.style.visibility = this.display
      ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
      : 'hidden';
    this.pacmanArrow.style.visibility = this.animationTarget.style.visibility;

    this.updatePacmanArrowPosition(this.position, this.scaledTileSize);

    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
  }

  /**
   * Handles movement logic for Pacman
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = Object.assign({}, this.position);

    if (this.moving) {
      const gridPosition = this.characterUtil.determineGridPosition(
        this.position, this.scaledTileSize,
      );

      if (JSON.stringify(this.position) === JSON.stringify(
        this.characterUtil.snapToGrid(
          gridPosition, this.direction, this.scaledTileSize,
        ),
      )) {
        this.position = this.handleSnappedMovement(elapsedMs);
      } else {
        this.position = this.handleUnsnappedMovement(gridPosition, elapsedMs);
      }

      this.position = this.characterUtil.handleWarp(
        this.position, this.scaledTileSize, this.mazeArray,
      );
    }

    if (this.moving || this.specialAnimation) {
      this.msSinceLastSprite += elapsedMs;
    }
  }
}


class GameCoordinator {
  constructor() {
    this.gameUi = document.getElementById('game-ui');
    this.rowTop = document.getElementById('row-top');
    this.mazeDiv = document.getElementById('maze');
    this.mazeImg = document.getElementById('maze-img');
    this.mazeCover = document.getElementById('maze-cover');
    this.pointsDisplay = document.getElementById('points-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.extraLivesDisplay = document.getElementById('extra-lives');
    this.fruitDisplay = document.getElementById('fruit-display');
    this.mainMenu = document.getElementById('main-menu-container');
    this.gameStartButton = document.getElementById('game-start');
    this.pauseButton = document.getElementById('pause-btn-wrapper');
    this.soundButton = document.getElementById('sound-btn-wrapper');
    this.leftCover = document.getElementById('left-cover');
    this.rightCover = document.getElementById('right-cover');
    this.pausedText = document.getElementById('paused-text');

    this.maxFps = 120;
    this.tileSize = 8;
    this.scale = this.determineScale(1);
    this.scaledTileSize = this.tileSize * this.scale;

    // On portrait mobile, override scaledTileSize to fill the viewport properly.
    // determineScale only uses integers (8, 16, 24…) which leaves too much empty space.
    // We compute the ideal pixel tile size directly from the viewport.
    const _vw = Math.min(document.documentElement.clientWidth, window.innerWidth || 0);
    const _vh = Math.min(document.documentElement.clientHeight, window.innerHeight || 0);
    if (_vh > _vw && _vw < 700) {
      const byWidth = Math.floor(_vw * 0.93 / 28);   // 93% of viewport width / 28 tiles
      const byHeight = Math.floor(_vh * 0.61 / 36);  // 61% of viewport height / 36 tiles
      const idealTile = Math.max(1, Math.min(byWidth, byHeight));
      if (idealTile > this.scaledTileSize) {
        this.scaledTileSize = idealTile;
        this.scale = idealTile / this.tileSize;
      }
    }

    this.firstGame = true;

    this.movementKeys = {
      // WASD
      87: 'up',
      83: 'down',
      65: 'left',
      68: 'right',

      // Arrow Keys
      38: 'up',
      40: 'down',
      37: 'left',
      39: 'right',
    };

    this.fruitPoints = {
      1: 100,
      2: 300,
      3: 500,
      4: 700,
      5: 1000,
      6: 2000,
      7: 3000,
      8: 5000,
    };

    this.mazeArray = [
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOXXXXoXXXXXoXXoXXXXXoXXXXOX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['      o   X      X   o      '],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOooXXooooooo  oooooooXXooOX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
    ];

    this.mazeArray.forEach((row, rowIndex) => {
      this.mazeArray[rowIndex] = row[0].split('');
    });

    this.gameStartButton.addEventListener(
      'click', this.startButtonClick.bind(this),
    );
    this.pauseButton.addEventListener(
      'click', this.handlePauseKey.bind(this),
    );
    this.soundButton.addEventListener(
      'click', this.soundButtonClick.bind(this),
    );

    // Fullscreen button (only shown on narrow portrait screens)
    const fullscreenBtn = document.getElementById('fullscreen-btn-wrapper');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const el = document.documentElement;
        if (!document.fullscreenElement) {
          el.requestFullscreen && el.requestFullscreen();
          el.webkitRequestFullscreen && el.webkitRequestFullscreen();
        } else {
          document.exitFullscreen && document.exitFullscreen();
          document.webkitExitFullscreen && document.webkitExitFullscreen();
        }
      });
      document.addEventListener('fullscreenchange', () => {
        const icon = document.getElementById('fullscreen-icon');
        if (icon) {
          if (document.fullscreenElement) {
            // Show exit-fullscreen icon (compress arrows)
            icon.innerHTML = '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>';
          } else {
            // Show enter-fullscreen icon (expand arrows)
            icon.innerHTML = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
          }
        }
        // Recalculate layout after the browser finishes adjusting the viewport
        // Two passes: fast (100ms) for most browsers, slow (350ms) for those that animate
        setTimeout(() => this.handleResize(), 100);
        setTimeout(() => this.handleResize(), 350);
      });
    }

    const head = document.getElementsByTagName('head')[0];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'build/app.css';

    link.onload = this.preloadAssets.bind(this);

    head.appendChild(link);
  }

  /**
   * Recursive method which determines the largest possible scale the game's graphics can use
   * @param {Number} scale
   */
  determineScale(scale) {
    const height = Math.min(
      document.documentElement.clientHeight, window.innerHeight || 0,
    );
    const width = Math.min(
      document.documentElement.clientWidth, window.innerWidth || 0,
    );
    const scaledTileSize = this.tileSize * scale;

    if ((scaledTileSize * 36) < height && (scaledTileSize * 28) < width) {
      return this.determineScale(scale + 1);
    }

    return scale - 1;
  }

  /**
   * Reveals the game underneath the loading covers and starts gameplay
   */
  startButtonClick() {
    this.leftCover.style.left = '-50%';
    this.rightCover.style.right = '-50%';
    this.mainMenu.style.opacity = 0;
    this.gameStartButton.disabled = true;

    setTimeout(() => {
      this.mainMenu.style.visibility = 'hidden';
    }, 1000);

    this.reset();
    if (this.firstGame) {
      this.firstGame = false;
      this.init();
    }
    this.startGameplay(true);
  }

  /**
   * Toggles the master volume for the soundManager, and saves the preference to storage
   */
  soundButtonClick() {
    const newVolume = this.soundManager.masterVolume === 1 ? 0 : 1;
    this.soundManager.setMasterVolume(newVolume);
    localStorage.setItem('volumePreference', newVolume);
    this.setSoundButtonIcon(newVolume);
  }

  /**
   * Sets the icon for the sound button using inline SVG paths (no font dependency)
   */
  setSoundButtonIcon(newVolume) {
    const path1 = document.getElementById('sound-icon-path1');
    const path2 = document.getElementById('sound-icon-path2');
    const path3 = document.getElementById('sound-icon-path3');
    if (!path1) return; // SVG not ready yet

    if (newVolume === 0) {
      // volume_off icon paths
      path1.setAttribute('d', 'M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l2 2L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z');
      path2.setAttribute('d', '');
      path3.setAttribute('d', '');
    } else {
      // volume_up icon paths
      path1.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3z');
      path2.setAttribute('d', 'M16.5 12A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z');
      path3.setAttribute('d', 'M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z');
    }
  }

  /**
   * Displays an error message in the event assets are unable to download
   */
  displayErrorMessage() {
    const loadingContainer = document.getElementById('loading-container');
    const errorMessage = document.getElementById('error-message');
    loadingContainer.style.opacity = 0;
    setTimeout(() => {
      loadingContainer.remove();
      errorMessage.style.opacity = 1;
      errorMessage.style.visibility = 'visible';
    }, 1500);
  }

  /**
   * Load all assets into a hidden Div to pre-load them into memory.
   * There is probably a better way to read all of these file names.
   */
  preloadAssets() {
    return new Promise((resolve) => {
      const loadingContainer = document.getElementById('loading-container');
      const loadingPacman = document.getElementById('loading-pacman');
      const loadingDotMask = document.getElementById('loading-dot-mask');

      const imgBase = 'app/style/graphics/spriteSheets/';
      const imgSources = [
        // Pacman
        `${imgBase}characters/pacman/arrow_down.svg`,
        `${imgBase}characters/pacman/arrow_left.svg`,
        `${imgBase}characters/pacman/arrow_right.svg`,
        `${imgBase}characters/pacman/arrow_up.svg`,
        `${imgBase}characters/pacman/pacman_death.svg`,
        `${imgBase}characters/pacman/pacman_error.svg`,
        `${imgBase}characters/pacman/pacman_down.svg`,
        `${imgBase}characters/pacman/pacman_left.svg`,
        `${imgBase}characters/pacman/pacman_right.svg`,
        `${imgBase}characters/pacman/pacman_up.svg`,

        // Blinky
        `${imgBase}characters/ghosts/blinky/blinky_down_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up.svg`,

        // Clyde
        `${imgBase}characters/ghosts/clyde/clyde_down.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_left.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_right.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_up.svg`,

        // Inky
        `${imgBase}characters/ghosts/inky/inky_down.svg`,
        `${imgBase}characters/ghosts/inky/inky_left.svg`,
        `${imgBase}characters/ghosts/inky/inky_right.svg`,
        `${imgBase}characters/ghosts/inky/inky_up.svg`,

        // Pinky
        `${imgBase}characters/ghosts/pinky/pinky_down.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_left.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_right.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_up.svg`,

        // Ghosts Common
        `${imgBase}characters/ghosts/eyes_down.svg`,
        `${imgBase}characters/ghosts/eyes_left.svg`,
        `${imgBase}characters/ghosts/eyes_right.svg`,
        `${imgBase}characters/ghosts/eyes_up.svg`,
        `${imgBase}characters/ghosts/scared_blue.svg`,
        `${imgBase}characters/ghosts/scared_white.svg`,

        // Dots
        `${imgBase}pickups/pacdot.svg`,
        `${imgBase}pickups/powerPellet.svg`,

        // Fruit
        `${imgBase}pickups/apple.svg`,
        `${imgBase}pickups/bell.svg`,
        `${imgBase}pickups/cherry.svg`,
        `${imgBase}pickups/galaxian.svg`,
        `${imgBase}pickups/key.svg`,
        `${imgBase}pickups/melon.svg`,
        `${imgBase}pickups/orange.svg`,
        `${imgBase}pickups/strawberry.svg`,

        // Text
        `${imgBase}text/ready.svg`,

        // Points
        `${imgBase}text/100.svg`,
        `${imgBase}text/200.svg`,
        `${imgBase}text/300.svg`,
        `${imgBase}text/400.svg`,
        `${imgBase}text/500.svg`,
        `${imgBase}text/700.svg`,
        `${imgBase}text/800.svg`,
        `${imgBase}text/1000.svg`,
        `${imgBase}text/1600.svg`,
        `${imgBase}text/2000.svg`,
        `${imgBase}text/3000.svg`,
        `${imgBase}text/5000.svg`,

        // Maze
        `${imgBase}maze/maze_blue.svg`,

        // Misc
        'app/style/graphics/extra_life.png',
      ];

      const audioBase = 'app/style/audio/';
      const audioSources = [
        `${audioBase}game_start.mp3`,
        `${audioBase}pause.mp3`,
        `${audioBase}pause_beat.mp3`,
        `${audioBase}siren_1.mp3`,
        `${audioBase}siren_2.mp3`,
        `${audioBase}siren_3.mp3`,
        `${audioBase}power_up.mp3`,
        `${audioBase}extra_life.mp3`,
        `${audioBase}eyes.mp3`,
        `${audioBase}eat_ghost.mp3`,
        `${audioBase}death.mp3`,
        `${audioBase}fruit.mp3`,
        `${audioBase}dot_1.mp3`,
        `${audioBase}dot_2.mp3`,
      ];

      const totalSources = imgSources.length + audioSources.length;
      this.remainingSources = totalSources;

      loadingPacman.style.left = '0';
      loadingDotMask.style.width = '0';

      Promise.all([
        this.createElements(
          imgSources, 'img', totalSources, this,
        ),
        this.createElements(
          audioSources, 'audio', totalSources, this,
        ),
      ]).then(() => {
        loadingContainer.style.opacity = 0;
        resolve();

        setTimeout(() => {
          loadingContainer.remove();
          this.mainMenu.style.opacity = 1;
          this.mainMenu.style.visibility = 'visible';
        }, 1500);
      }).catch(this.displayErrorMessage);
    });
  }

  /**
   * Iterates through a list of sources and updates the loading bar as the assets load in
   * @param {String[]} sources
   * @param {('img'|'audio')} type
   * @param {Number} totalSources
   * @param {Object} gameCoord
   * @returns {Promise}
   */
  createElements(sources, type, totalSources, gameCoord) {
    const loadingContainer = document.getElementById('loading-container');
    const preloadDiv = document.getElementById('preload-div');
    const loadingPacman = document.getElementById('loading-pacman');
    const containerWidth = loadingContainer.scrollWidth
      - loadingPacman.scrollWidth;
    const loadingDotMask = document.getElementById('loading-dot-mask');

    const gameCoordRef = gameCoord;

    return new Promise((resolve, reject) => {
      let loadedSources = 0;

      sources.forEach((source) => {
        const element = (type === 'img')
          ? new Image() : new Audio();
        preloadDiv.appendChild(element);

        const elementReady = () => {
          gameCoordRef.remainingSources -= 1;
          loadedSources += 1;
          const percent = 1 - (gameCoordRef.remainingSources / totalSources);
          loadingPacman.style.left = `${percent * containerWidth}px`;
          loadingDotMask.style.width = loadingPacman.style.left;

          if (loadedSources === sources.length) {
            resolve();
          }
        };

        if (type === 'img') {
          element.onload = elementReady;
          element.onerror = reject;
        } else {
          element.addEventListener('canplaythrough', elementReady);
          element.onerror = reject;
        }

        element.src = source;
      });
    });
  }

  /**
   * Resets gameCoordinator values to their default states
   */
  reset() {
    this.activeTimers = [];
    this.points = 0;
    this.level = 1;
    this.lives = 2;
    this.extraLifeGiven = false;
    this.remainingDots = 0;
    this.allowKeyPresses = true;
    this.allowPacmanMovement = false;
    this.allowPause = false;
    this.cutscene = true;
    this.highScore = localStorage.getItem('highScore');

    if (this.firstGame) {
      setInterval(() => {
        this.collisionDetectionLoop();
      }, 500);

      this.pacman = new Pacman(
        this.scaledTileSize, this.mazeArray, new CharacterUtil(),
      );
      this.blinky = new Ghost(
        this.scaledTileSize, this.mazeArray, this.pacman, 'blinky',
        this.level, new CharacterUtil(),
      );
      this.pinky = new Ghost(
        this.scaledTileSize, this.mazeArray, this.pacman, 'pinky',
        this.level, new CharacterUtil(),
      );
      this.inky = new Ghost(
        this.scaledTileSize, this.mazeArray, this.pacman, 'inky',
        this.level, new CharacterUtil(), this.blinky,
      );
      this.clyde = new Ghost(
        this.scaledTileSize, this.mazeArray, this.pacman, 'clyde',
        this.level, new CharacterUtil(),
      );
      this.activeFruits = [];
    }

    // On first game, create the entityList array.
    // On subsequent resets, clear it in-place to preserve
    // the reference held by GameEngine.
    if (this.firstGame) {
      this.entityList = [
        this.pacman, this.blinky, this.pinky, this.inky, this.clyde,
      ];
    } else {
      this.entityList.length = 0;
      this.entityList.push(
        this.pacman, this.blinky, this.pinky, this.inky, this.clyde,
      );
    }

    this.ghosts = [
      this.blinky,
      this.pinky,
      this.inky,
      this.clyde,
    ];

    this.validFruitTiles = [];
    this.mazeArray.forEach((row, rowIndex) => {
      row.forEach((char, colIndex) => {
        if (char !== 'X' && (rowIndex < 13 || rowIndex > 16 || colIndex < 11 || colIndex > 16)) {
          this.validFruitTiles.push({ x: colIndex, y: rowIndex });
        }
      });
    });

    this.scaredGhosts = [];
    this.eyeGhosts = 0;

    if (this.firstGame) {
      this.drawMaze(this.mazeArray, this.entityList);
      this.soundManager = new SoundManager();
      this.setUiDimensions();
    } else {
      this.pacman.reset();
      this.ghosts.forEach((ghost) => {
        ghost.reset(true);
      });
      this.pickups.forEach((pickup) => {
        if (pickup.type !== 'fruit') {
          this.remainingDots += 1;
          pickup.reset();
          this.entityList.push(pickup);
        }
      });
      // Clear fruits on reset
      this.activeFruits.forEach((fruit) => {
        fruit.animationTarget.remove();
        this.removeFromList(this.pickups, fruit);
      });
      this.activeFruits = [];
    }

    this.fruitCounts = {}; // Initialize fruit counter
    this.clearDisplay(this.fruitDisplay);

    this.pointsDisplay.innerHTML = '00';
    this.highScoreDisplay.innerHTML = this.highScore || '00';
    this.clearDisplay(this.fruitDisplay);

    const volumePreference = parseInt(
      localStorage.getItem('volumePreference') || 1, 10,
    );
    this.setSoundButtonIcon(volumePreference);
    this.soundManager.setMasterVolume(volumePreference);
  }

  /**
   * Calls necessary setup functions to start the game
   */
  init() {
    this.registerEventListeners();

    this.gameEngine = new GameEngine(this.maxFps, this.entityList);
    this.gameEngine.start();
  }

  /**
   * Adds HTML elements to draw on the webpage by iterating through the 2D maze array
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  drawMaze(mazeArray, entityList) {
    this.pickups = [];

    this.mazeDiv.style.height = `${this.scaledTileSize * 31}px`;
    this.mazeDiv.style.width = `${this.scaledTileSize * 28}px`;
    this.gameUi.style.width = `${this.scaledTileSize * 28}px`;
    this.dotContainer = document.getElementById('dot-container');

    mazeArray.forEach((row, rowIndex) => {
      row.forEach((block, columnIndex) => {
        if (block === 'o' || block === 'O') {
          const type = (block === 'o') ? 'pacdot' : 'powerPellet';
          const points = (block === 'o') ? 10 : 50;
          const dot = new Pickup(
            type, this.scaledTileSize, columnIndex,
            rowIndex, this.pacman, this.dotContainer, points,
          );

          entityList.push(dot);
          this.pickups.push(dot);
          this.remainingDots += 1;
        }
      });
    });
  }

  setUiDimensions() {
    this.gameUi.style.fontSize = `${this.scaledTileSize}px`;
    this.rowTop.style.marginBottom = `${this.scaledTileSize}px`;
    // Clear any leftover CSS transform from previous sessions
    this.gameUi.style.transform = '';
    this.gameUi.style.transformOrigin = '';
  }

  /**
   * Loop which periodically checks which pickups are nearby Pacman.
   * Pickups which are far away will not be considered for collision detection.
   */
  collisionDetectionLoop() {
    if (this.pacman.position) {
      const maxDistance = (this.pacman.velocityPerMs * 750);
      const pacmanCenter = {
        x: this.pacman.position.left + this.scaledTileSize,
        y: this.pacman.position.top + this.scaledTileSize,
      };

      // Set this flag to TRUE to see how two-phase collision detection works!
      const debugging = false;

      this.pickups.forEach((pickup) => {
        pickup.checkPacmanProximity(maxDistance, pacmanCenter, debugging);
      });
    }
  }

  /**
   * Displays "Ready!" and allows Pacman to move after a breif delay
   * @param {Boolean} initialStart - Special condition for the game's beginning
   */
  startGameplay(initialStart) {
    if (initialStart) {
      this.soundManager.play('game_start');
    }

    this.scaredGhosts = [];
    this.eyeGhosts = 0;
    this.allowPacmanMovement = false;

    const left = this.scaledTileSize * 11;
    const top = this.scaledTileSize * 16.5;
    const duration = initialStart ? 4500 : 2000;
    const width = this.scaledTileSize * 6;
    const height = this.scaledTileSize * 2;

    this.displayText({ left, top }, 'ready', duration, width, height);
    this.updateExtraLivesDisplay();

    new Timer(() => {
      this.allowPause = true;
      this.cutscene = false;
      this.soundManager.setCutscene(this.cutscene);
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));

      // Ensure the engine is running
      if (!this.gameEngine.started) {
        this.gameEngine.start();
      } else if (!this.gameEngine.running) {
        this.gameEngine.changePausedState(false);
      }

      this.allowPacmanMovement = true;
      this.pacman.moving = true;

      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.moving = true;
        ghostRef.pause(false);
      });

      this.ghostCycle('scatter');

      this.idleGhosts = [
        this.pinky,
        this.inky,
        this.clyde,
      ];
      this.releaseGhost();
      this.initFruitSpawner();
    }, duration);
  }

  /**
   * Clears out all children nodes from a given display element
   * @param {String} display
   */
  clearDisplay(display) {
    while (display.firstChild) {
      display.removeChild(display.firstChild);
    }
  }

  /**
   * Displays extra life images equal to the number of remaining lives
   */
  updateExtraLivesDisplay() {
    this.clearDisplay(this.extraLivesDisplay);

    for (let i = 0; i < this.lives; i += 1) {
      const extraLifePic = document.createElement('img');
      extraLifePic.setAttribute('src', 'app/style/graphics/extra_life.svg');
      extraLifePic.style.height = `${this.scaledTileSize * 2}px`;
      this.extraLivesDisplay.appendChild(extraLifePic);
    }
  }

  /**
   * Displays a rolling log of the seven most-recently eaten fruit
   * @param {String} rawImageSource
   */
  updateFruitDisplay(rawImageSource, points) {
    const parsedSource = rawImageSource.slice(
      rawImageSource.indexOf('(') + 1, rawImageSource.indexOf(')'),
    );

    const fruitName = parsedSource.split('/').pop().replace('.svg', '');
    if (!this.fruitCounts[fruitName]) {
      this.fruitCounts[fruitName] = 0;
    }
    this.fruitCounts[fruitName] += 1;

    let fruitItem = this.fruitDisplay.querySelector(`[data-fruit="${fruitName}"]`);

    if (fruitItem) {
      const counter = fruitItem.querySelector('.fruit-counter');
      counter.innerText = `x${this.fruitCounts[fruitName]}`;
    } else {
      if (this.fruitDisplay.children.length === 7) {
        this.fruitDisplay.removeChild(this.fruitDisplay.firstChild);
      }

      fruitItem = document.createElement('div');
      fruitItem.setAttribute('data-fruit', fruitName);
      fruitItem.classList.add('fruit-item');
      fruitItem.style.position = 'relative';
      fruitItem.style.marginLeft = `${this.scaledTileSize * 0.5}px`;

      const fruitPic = document.createElement('img');
      fruitPic.setAttribute('src', parsedSource);
      fruitPic.style.height = `${this.scaledTileSize * 2}px`;
      fruitItem.appendChild(fruitPic);

      const counter = document.createElement('div');
      counter.classList.add('fruit-counter');
      counter.innerText = `x${this.fruitCounts[fruitName]}`;
      counter.style.position = 'absolute';
      counter.style.bottom = '0';
      counter.style.right = '0';
      counter.style.fontSize = `${this.scaledTileSize * 0.8}px`;
      counter.style.color = 'white';
      counter.style.backgroundColor = 'rgba(0,0,0,0.5)';
      counter.style.padding = '1px';
      counter.style.pointerEvents = 'none';
      fruitItem.appendChild(counter);

      this.fruitDisplay.appendChild(fruitItem);
    }
  }

  /**
   * Cycles the ghosts between 'chase' and 'scatter' mode
   * @param {('chase'|'scatter')} mode
   */
  ghostCycle(mode) {
    const delay = (mode === 'scatter') ? 7000 : 20000;
    const nextMode = (mode === 'scatter') ? 'chase' : 'scatter';

    this.ghostCycleTimer = new Timer(() => {
      this.ghosts.forEach((ghost) => {
        ghost.changeMode(nextMode);
      });

      this.ghostCycle(nextMode);
    }, delay);
  }

  /**
   * Releases a ghost from the Ghost House after a delay
   */
  releaseGhost() {
    if (this.idleGhosts.length > 0) {
      const delay = Math.max((8 - ((this.level - 1) * 4)) * 1000, 0);

      this.endIdleTimer = new Timer(() => {
        this.idleGhosts[0].endIdleMode();
        this.idleGhosts.shift();
      }, delay);
    }
  }

  /**
   * Register listeners for various game sequences
   */
  registerEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('awardPoints', this.awardPoints.bind(this));
    window.addEventListener('deathSequence', this.deathSequence.bind(this));
    window.addEventListener('dotEaten', this.dotEaten.bind(this));
    window.addEventListener('powerUp', this.powerUp.bind(this));
    window.addEventListener('eatGhost', this.eatGhost.bind(this));
    window.addEventListener('restoreGhost', this.restoreGhost.bind(this));
    window.addEventListener('addTimer', this.addTimer.bind(this));
    window.addEventListener('removeTimer', this.removeTimer.bind(this));
    window.addEventListener('releaseGhost', this.releaseGhost.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));

    const directions = [
      'up', 'down', 'left', 'right',
    ];

    directions.forEach((direction) => {
      document.getElementById(`button-${direction}`).addEventListener(
        'touchstart', () => {
          this.changeDirection(direction);
        },
      );
    });

    document.getElementById('continue-to-trivia').addEventListener(
      'click', () => {
        this.displayQuestion(this.currentTriviaConcept);
      },
    );

    document.getElementById('retry-trivia').addEventListener(
      'click', () => {
        this.startTrivia(true);
      },
    );

    this.toggleControlsBtn = document.getElementById('toggle-controls-btn');
    this.dPadContainer = document.getElementById('d-pad-container');
    this.useSwipeControls = false;

    if (this.toggleControlsBtn) {
      this.toggleControlsBtn.addEventListener('click', () => {
        this.useSwipeControls = !this.useSwipeControls;
        if (this.useSwipeControls) {
          this.toggleControlsBtn.innerText = 'MODO: DESLIZAR';
          this.dPadContainer.classList.add('hidden');
        } else {
          this.toggleControlsBtn.innerText = 'MODO: CRUCETA';
          this.dPadContainer.classList.remove('hidden');
        }
      });
    }

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  handleResize() {
    // Automatically pause the game on orientation change
    if (this.gameEngine && this.gameEngine.started && this.allowPause && !this.cutscene) {
      this.handlePauseKey();
    }

    const _vw = Math.min(document.documentElement.clientWidth, window.innerWidth || 0);
    const _vh = Math.min(document.documentElement.clientHeight, window.innerHeight || 0);

    // Temporarily clear transform to get true scrollHeight/scrollWidth
    this.gameUi.style.transform = 'none';
    const uiWidth = this.gameUi.scrollWidth;
    const uiHeight = this.gameUi.scrollHeight;

    let scaleFactor = 1;
    let marginTop = 0;

    if (_vw > _vh) {
      // Landscape mobile: scale so the height of the UI is 95% of viewport height
      scaleFactor = (_vh * 0.95) / uiHeight;
      this.gameUi.style.transform = `scale(${scaleFactor})`;
      this.gameUi.style.transformOrigin = 'center top';

      const scaledHeight = uiHeight * scaleFactor;
      marginTop = Math.max(0, (_vh - scaledHeight) / 2);
    } else {
      // Portrait mobile: fit width (93%) or height (61%)
      const scaleW = (_vw * 0.93) / uiWidth;
      const scaleH = (_vh * 0.61) / uiHeight;
      scaleFactor = Math.min(scaleW, scaleH);
      this.gameUi.style.transform = `scale(${scaleFactor})`;
      this.gameUi.style.transformOrigin = 'center top';

      // Keep top margin on portrait to leave room for the header text
      marginTop = 70;
    }

    this.gameUi.style.marginTop = `${marginTop}px`;
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
  }

  handleTouchMove(e) {
    const touch = e.touches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
  }

  handleTouchEnd(e) {
    if (!this.touchStartX || !this.touchStartY) return;
    
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;
    
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) this.changeDirection('right');
        else this.changeDirection('left');
      } else {
        if (diffY > 0) this.changeDirection('down');
        else this.changeDirection('up');
      }
    }
    
    this.touchStartX = null;
    this.touchStartY = null;
  }

  /**
   * Calls Pacman's changeDirection event if certain conditions are met
   * @param {({'up'|'down'|'left'|'right'})} direction
   */
  changeDirection(direction) {
    if (this.allowKeyPresses && this.gameEngine.running) {
      this.pacman.changeDirection(
        direction, this.allowPacmanMovement,
      );
    }
  }

  /**
   * Calls various class functions depending upon the pressed key
   * @param {Event} e - The keydown event to evaluate
   */
  handleKeyDown(e) {
    if (e.keyCode === 27) {
      // ESC key
      this.handlePauseKey();
    } else if (e.keyCode === 81) {
      // Q
      this.soundButtonClick();
    } else if (this.movementKeys[e.keyCode]) {
      this.changeDirection(this.movementKeys[e.keyCode]);
    }
  }

  /**
   * Handle behavior for the pause key
   */
  handlePauseKey() {
    if (this.allowPause) {
      this.allowPause = false;

      setTimeout(() => {
        if (!this.cutscene) {
          this.allowPause = true;
        }
      }, 500);

      this.gameEngine.changePausedState(this.gameEngine.started);
      this.soundManager.play('pause');

      if (this.gameEngine.started) {
        this.soundManager.resumeAmbience();
        this.gameUi.style.filter = 'unset';
        this.pausedText.style.visibility = 'hidden';
        this.setPauseButtonIcon('pause');
        this.activeTimers.forEach((timer) => {
          timer.resume();
        });
      } else {
        this.soundManager.stopAmbience();
        this.soundManager.setAmbience('pause_beat', true);
        this.gameUi.style.filter = 'blur(5px)';
        this.pausedText.style.visibility = 'visible';
        this.setPauseButtonIcon('play');
        this.activeTimers.forEach((timer) => {
          timer.pause();
        });
      }
    }
  }

  /**
   * Sets the SVG icon for the pause button (pause bars or play triangle)
   */
  setPauseButtonIcon(state) {
    const pauseSvg = document.getElementById('pause-button');
    if (!pauseSvg) return;
    if (state === 'pause') {
      // Two vertical bars (pause)
      pauseSvg.innerHTML = '<rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/>';
    } else {
      // Right-pointing triangle (play)
      pauseSvg.innerHTML = '<path d="M8 5v14l11-7z"/>';
    }
  }

  /**
   * Adds points to the player's total
   * @param {({ detail: { points: Number }})} e - Contains a quantity of points to add
   */
  awardPoints(e) {
    this.points += e.detail.points;
    this.pointsDisplay.innerText = this.points;
    if (this.points > (this.highScore || 0)) {
      this.highScore = this.points;
      this.highScoreDisplay.innerText = this.points;
      localStorage.setItem('highScore', this.highScore);
    }

    if (this.points >= 10000 && !this.extraLifeGiven) {
      this.extraLifeGiven = true;
      this.soundManager.play('extra_life');
      this.lives += 1;
      this.updateExtraLivesDisplay();
    }

    if (e.detail.type === 'fruit') {
      const { pickup } = e.detail;
      this.updateFruitDisplay(pickup.determineImage(
        'fruit', e.detail.points,
      ), e.detail.points);

      // Save position BEFORE removing the fruit
      const fruitLeft = pickup.x;
      const fruitTop = pickup.y;

      const width = e.detail.points >= 1000
        ? this.scaledTileSize * 3
        : this.scaledTileSize * 2;
      const height = this.scaledTileSize * 2;

      this.soundManager.play('fruit');

      // Remove the specific fruit instance first
      this.activeFruits = this.activeFruits.filter(f => f !== pickup);
      this.removeFromList(this.entityList, pickup);
      this.removeFromList(this.pickups, pickup);
      pickup.animationTarget.remove();

      // Show points at the fruit's location
      this.displayText({ left: fruitLeft, top: fruitTop }, e.detail.points, 2000, width, height);

      this.startTrivia();
    }
  }

  /**
   * Animates Pacman's death, subtracts a life, and resets character positions if
   * the player has remaining lives.
   */
  deathSequence() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.soundManager.stopAmbience();
    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    this.allowKeyPresses = false;
    this.pacman.moving = false;
    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.moving = false;
    });

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });
      this.pacman.prepDeathAnimation();
      this.soundManager.play('death');

      if (this.lives > 0) {
        this.lives -= 1;

        new Timer(() => {
          this.mazeCover.style.visibility = 'visible';
          new Timer(() => {
            this.allowKeyPresses = true;
            this.mazeCover.style.visibility = 'hidden';
            this.pacman.reset();
            this.ghosts.forEach((ghost) => {
              ghost.reset();
              ghost.display = true;
              ghost.pause(false);
            });
            this.activeFruits.forEach(fruit => {
              fruit.animationTarget.remove();
              this.removeFromList(this.entityList, fruit);
              this.removeFromList(this.pickups, fruit);
            });
            this.activeFruits = [];

            // Ensure the engine is running before starting gameplay
            if (!this.gameEngine.started) {
              this.gameEngine.start();
            }

            this.startGameplay(true);
          }, 500);
        }, 2250);
      } else {
        this.gameOver();
      }
    }, 750);
  }

  /**
   * Displays GAME OVER text and displays the menu so players can play again
   */
  gameOver() {
    localStorage.setItem('highScore', this.highScore);

    new Timer(() => {
      this.displayText(
        {
          left: this.scaledTileSize * 9,
          top: this.scaledTileSize * 16.5,
        },
        'game_over', 4000,
        this.scaledTileSize * 10,
        this.scaledTileSize * 2,
      );
      this.activeFruits.forEach(fruit => {
        fruit.animationTarget.remove();
        this.removeFromList(this.entityList, fruit);
        this.removeFromList(this.pickups, fruit);
      });
      this.activeFruits = [];

      new Timer(() => {
        this.leftCover.style.left = '0';
        this.rightCover.style.right = '0';

        setTimeout(() => {
          this.mainMenu.style.opacity = 1;
          this.gameStartButton.disabled = false;
          this.mainMenu.style.visibility = 'visible';
        }, 1000);
      }, 2500);
    }, 2250);
  }

  /**
   * Handle events related to the number of remaining dots
   */
  dotEaten() {
    this.remainingDots -= 1;

    this.soundManager.playDotSound();

    if (this.remainingDots === 174 || this.remainingDots === 74) {
      this.createFruit();
    }

    if (this.remainingDots === 40 || this.remainingDots === 20) {
      this.speedUpBlinky();
    }

    if (this.remainingDots === 0) {
      this.advanceLevel();
    }
  }

  /**
   * Creates a bonus fruit and adds it to the active fruits list
   */
  createFruit() {
    const randomTile = this.validFruitTiles[
      Math.floor(Math.random() * this.validFruitTiles.length)
    ];

    // Check if tile is occupied by another fruit to avoid overlaps
    const isOccupied = this.activeFruits.some((fruit) => {
      const gridX = Math.floor(fruit.center.x / this.scaledTileSize);
      const gridY = Math.floor(fruit.center.y / this.scaledTileSize);
      return gridX === randomTile.x && gridY === randomTile.y;
    });

    if (isOccupied) return;

    const points = this.fruitPoints[this.level] || 5000;
    const newFruit = new Pickup(
      'fruit', this.scaledTileSize, randomTile.x, randomTile.y,
      this.pacman, this.mazeDiv, points,
    );

    newFruit.showFruit(points);
    this.activeFruits.push(newFruit);
    this.entityList.push(newFruit);
    this.pickups.push(newFruit);
  }

  /**
   * Starts a repeated timer to spawn fruits randomly
   */
  initFruitSpawner() {
    this.removeTimer({ detail: { timer: this.fruitSpawnLoop } });
    this.fruitSpawnLoop = new Timer(() => {
      if (this.gameEngine.running && !this.cutscene) {
        this.createFruit();
      }
      this.initFruitSpawner();
    }, 15000);
  }

  /**
   * Starts the trivia sequence
   * @param {Boolean} reuseConcept - If true, reuses the last concept shown
   */
  startTrivia(reuseConcept) {
    this.allowPause = false;
    this.gameEngine.changePausedState(true);
    this.soundManager.stopAmbience();
    this.activeTimers.forEach((timer) => {
      timer.pause();
    });

    // Global pause
    this.allowPacmanMovement = false;
    this.pacman.moving = false;
    this.ghosts.forEach((ghost) => {
      ghost.moving = false;
      ghost.pause(true);
    });

    if (!reuseConcept) {
      const randomIndex = Math.floor(Math.random() * triviaData.length);
      this.currentTriviaConcept = triviaData[randomIndex];
    }
    
    this.displayConcept(this.currentTriviaConcept);
  }

  /**
   * Shows the concept screen of the trivia
   * @param {Object} conceptData
   */
  displayConcept(conceptData) {
    const modal = document.getElementById('trivia-modal');
    const conceptScreen = document.getElementById('concept-screen');
    const questionScreen = document.getElementById('question-screen');
    const resultScreen = document.getElementById('result-screen');
    const countdownScreen = document.getElementById('countdown-screen');

    modal.classList.remove('modal-correct', 'modal-incorrect');
    document.getElementById('concept-title').innerText = conceptData.title;
    document.getElementById('concept-description').innerText = conceptData.description;

    modal.classList.remove('hidden');
    conceptScreen.classList.remove('hidden');
    questionScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    countdownScreen.classList.add('hidden');
  }

  /**
   * Shows the question screen of the trivia
   * @param {Object} conceptData
   */
  displayQuestion(conceptData) {
    const conceptScreen = document.getElementById('concept-screen');
    const questionScreen = document.getElementById('question-screen');
    const optionsContainer = document.getElementById('trivia-options');

    document.getElementById('trivia-question').innerText = conceptData.question;
    this.clearDisplay(optionsContainer);

    conceptData.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.classList.add('option-btn');
      btn.innerText = option;
      btn.addEventListener('click', () => {
        this.checkTriviaAnswer(index, conceptData.correctIndex);
      });
      optionsContainer.appendChild(btn);
    });

    conceptScreen.classList.add('hidden');
    questionScreen.classList.remove('hidden');
  }

  /**
   * Checks if the selected answer is correct
   * @param {Number} selected
   * @param {Number} correct
   */
  checkTriviaAnswer(selected, correct) {
    const modal = document.getElementById('trivia-modal');
    if (selected === correct) {
      modal.classList.add('modal-correct');
      this.runCountdown();
    } else {
      modal.classList.add('modal-incorrect');
      this.handleTriviaWrong();
    }
  }

  /**
   * Runs the 3-second countdown before resuming the game
   */
  runCountdown() {
    const questionScreen = document.getElementById('question-screen');
    const countdownScreen = document.getElementById('countdown-screen');
    const countdownText = document.getElementById('countdown-text');

    questionScreen.classList.add('hidden');
    countdownScreen.classList.remove('hidden');

    let count = 3;
    countdownText.innerText = count;

    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(interval);
        this.resumeGameAfterTrivia();
      } else {
        countdownText.innerText = count;
      }
    }, 1000);
  }

  /**
   * Resumes the game after a correct answer
   */
  resumeGameAfterTrivia() {
    const modal = document.getElementById('trivia-modal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-correct', 'modal-incorrect');

    // Ensure the engine is running
    if (!this.gameEngine.started) {
      this.gameEngine.start();
    } else {
      this.gameEngine.changePausedState(false);
    }
    this.cutscene = false;
    this.allowPause = true;
    this.soundManager.setCutscene(false);
    this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
    
    this.allowPacmanMovement = true;
    this.allowKeyPresses = true;
    this.pacman.moving = true;
    this.ghosts.forEach((ghost) => {
      ghost.moving = true;
      ghost.pause(false);
    });

    this.activeTimers.forEach((timer) => {
      timer.resume();
    });
  }

  /**
   * Handles incorrect trivia answers
   */
  handleTriviaWrong() {
    const questionScreen = document.getElementById('question-screen');
    const resultScreen = document.getElementById('result-screen');

    this.lives -= 1;
    this.updateExtraLivesDisplay();

    if (this.lives < 0) {
      document.getElementById('trivia-modal').classList.add('hidden');
      this.gameOver();
    } else {
      questionScreen.classList.add('hidden');
      resultScreen.classList.remove('hidden');
    }
  }

  /**
   * Speeds up Blinky and raises the background noise pitch
   */
  speedUpBlinky() {
    this.blinky.speedUp();

    if (this.scaredGhosts.length === 0 && this.eyeGhosts === 0) {
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
    }
  }


  /**
   * Determines the correct siren ambience
   * @param {Number} remainingDots
   * @returns {String}
   */
  determineSiren(remainingDots) {
    let sirenNum;

    if (remainingDots > 40) {
      sirenNum = 1;
    } else if (remainingDots > 20) {
      sirenNum = 2;
    } else {
      sirenNum = 3;
    }

    return `siren_${sirenNum}`;
  }

  /**
   * Resets the gameboard and prepares the next level
   */
  advanceLevel() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.allowKeyPresses = false;
    this.soundManager.stopAmbience();

    this.entityList.forEach((entity) => {
      const entityRef = entity;
      entityRef.moving = false;
    });

    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    const imgBase = 'app/style//graphics/spriteSheets/maze/';

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });

      this.mazeImg.src = `${imgBase}maze_white.svg`;
      new Timer(() => {
        this.mazeImg.src = `${imgBase}maze_blue.svg`;
        new Timer(() => {
          this.mazeImg.src = `${imgBase}maze_white.svg`;
          new Timer(() => {
            this.mazeImg.src = `${imgBase}maze_blue.svg`;
            new Timer(() => {
              this.mazeImg.src = `${imgBase}maze_white.svg`;
              new Timer(() => {
                this.mazeImg.src = `${imgBase}maze_blue.svg`;
                new Timer(() => {
                  this.mazeCover.style.visibility = 'visible';
                  new Timer(() => {
                    this.mazeCover.style.visibility = 'hidden';
                    this.level += 1;
                    this.allowKeyPresses = true;
                    this.activeFruits.forEach(fruit => {
                      fruit.animationTarget.remove();
                      this.removeFromList(this.entityList, fruit);
                      this.removeFromList(this.pickups, fruit);
                    });
                    this.activeFruits = [];

                    this.entityList.forEach((entity) => {
                      const entityRef = entity;
                      if (entityRef.level) {
                        entityRef.level = this.level;
                      }
                      entityRef.reset();
                      if (entityRef instanceof Ghost) {
                        entityRef.resetDefaultSpeed();
                      }
                      if (entityRef instanceof Pickup
                        && entityRef.type !== 'fruit') {
                        this.remainingDots += 1;
                      }
                    });
                    this.startGameplay(true);
                  }, 500);
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }, 250);
      }, 250);
    }, 2000);
  }

  /**
   * Flashes ghosts blue and white to indicate the end of the powerup
   * @param {Number} flashes - Total number of elapsed flashes
   * @param {Number} maxFlashes - Total flashes to show
   */
  flashGhosts(flashes, maxFlashes) {
    if (flashes === maxFlashes) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.endScared();
      });
      this.scaredGhosts = [];
      if (this.eyeGhosts === 0) {
        this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
      }
    } else if (this.scaredGhosts.length > 0) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.toggleScaredColor();
      });

      this.ghostFlashTimer = new Timer(() => {
        this.flashGhosts(flashes + 1, maxFlashes);
      }, 250);
    }
  }

  /**
   * Upon eating a power pellet, sets the ghosts to 'scared' mode
   */
  powerUp() {
    if (this.remainingDots !== 0) {
      this.soundManager.setAmbience('power_up');
    }

    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    this.ghostCombo = 0;
    this.scaredGhosts = [];

    this.ghosts.forEach((ghost) => {
      if (ghost.mode !== 'eyes') {
        this.scaredGhosts.push(ghost);
      }
    });

    this.scaredGhosts.forEach((ghost) => {
      ghost.becomeScared();
    });

    const powerDuration = Math.max((7 - this.level) * 1000, 0);
    this.ghostFlashTimer = new Timer(() => {
      this.flashGhosts(0, 9);
    }, powerDuration);
  }

  /**
   * Determines the quantity of points to give based on the current combo
   */
  determineComboPoints() {
    return (100 * (2 ** this.ghostCombo));
  }

  /**
   * Upon eating a ghost, award points and temporarily pause movement
   * @param {CustomEvent} e - Contains a target ghost object
   */
  eatGhost(e) {
    const pauseDuration = 1000;
    const { position, measurement } = e.detail.ghost;

    this.pauseTimer({ detail: { timer: this.ghostFlashTimer } });
    this.pauseTimer({ detail: { timer: this.ghostCycleTimer } });
    this.soundManager.play('eat_ghost');

    this.scaredGhosts = this.scaredGhosts.filter(
      ghost => ghost.name !== e.detail.ghost.name,
    );
    this.eyeGhosts += 1;

    this.ghostCombo += 1;
    const comboPoints = this.determineComboPoints();
    window.dispatchEvent(new CustomEvent('awardPoints', {
      detail: {
        points: comboPoints,
      },
    }));
    this.displayText(
      position, comboPoints, pauseDuration, measurement,
    );

    this.allowPacmanMovement = false;
    this.pacman.display = false;
    this.pacman.moving = false;
    e.detail.ghost.display = false;
    e.detail.ghost.moving = false;

    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.animate = false;
      ghostRef.pause(true);
      ghostRef.allowCollision = false;
    });

    new Timer(() => {
      this.soundManager.setAmbience('eyes');

      this.resumeTimer({ detail: { timer: this.ghostFlashTimer } });
      this.resumeTimer({ detail: { timer: this.ghostCycleTimer } });
      this.allowPacmanMovement = true;
      this.pacman.display = true;
      this.pacman.moving = true;
      e.detail.ghost.display = true;
      e.detail.ghost.moving = true;
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.animate = true;
        ghostRef.pause(false);
        ghostRef.allowCollision = true;
      });
    }, pauseDuration);
  }

  /**
   * Decrements the count of "eye" ghosts and updates the ambience
   */
  restoreGhost() {
    this.eyeGhosts -= 1;

    if (this.eyeGhosts === 0) {
      const sound = this.scaredGhosts.length > 0
        ? 'power_up' : this.determineSiren(this.remainingDots);
      this.soundManager.setAmbience(sound);
    }
  }

  /**
   * Creates a temporary div to display points on screen
   * @param {({ left: number, top: number })} position - CSS coordinates to display the points at
   * @param {Number} amount - Amount of points to display
   * @param {Number} duration - Milliseconds to display the points before disappearing
   * @param {Number} width - Image width in pixels
   * @param {Number} height - Image height in pixels
   */
  displayText(position, amount, duration, width, height) {
    const pointsDiv = document.createElement('div');

    pointsDiv.style.position = 'absolute';
    pointsDiv.style.backgroundSize = `${width}px`;
    pointsDiv.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/text/${amount}.svg`;
    pointsDiv.style.width = `${width}px`;
    pointsDiv.style.height = `${height || width}px`;
    pointsDiv.style.top = `${position.top}px`;
    pointsDiv.style.left = `${position.left}px`;
    pointsDiv.style.zIndex = 2;

    this.mazeDiv.appendChild(pointsDiv);

    new Timer(() => {
      this.mazeDiv.removeChild(pointsDiv);
    }, duration);
  }

  /**
   * Pushes a Timer to the activeTimers array
   * @param {({ detail: { timer: Object }})} e
   */
  addTimer(e) {
    this.activeTimers.push(e.detail.timer);
  }

  /**
   * Checks if a Timer with a matching ID exists
   * @param {({ detail: { timer: Object }})} e
   * @returns {Boolean}
   */
  timerExists(e) {
    return !!(e.detail.timer || {}).timerId;
  }

  /**
   * Pauses a timer
   * @param {({ detail: { timer: Object }})} e
   */
  pauseTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.pause(true);
    }
  }

  /**
   * Resumes a timer
   * @param {({ detail: { timer: Object }})} e
   */
  resumeTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.resume(true);
    }
  }

  /**
   * Removes a Timer from activeTimers
   * @param {({ detail: { timer: Object }})} e
   */
  removeTimer(e) {
    if (this.timerExists(e)) {
      window.clearTimeout(e.detail.timer.timerId);
      this.activeTimers = this.activeTimers.filter(
        timer => timer.timerId !== e.detail.timer.timerId,
      );
    }
  }

  /**
   * Removes an item from a list by index to avoid modifying original array reference.
   * @param {Array} list
   * @param {Object} item
   */
  removeFromList(list, item) {
    const index = list.indexOf(item);
    if (index > -1) {
      list.splice(index, 1);
    }
  }
}


class GameEngine {
  constructor(maxFps, entityList) {
    this.fpsDisplay = document.getElementById('fps-display');
    this.elapsedMs = 0;
    this.lastFrameTimeMs = 0;
    this.entityList = entityList;
    this.maxFps = maxFps;
    this.timestep = 1000 / this.maxFps;
    this.fps = this.maxFps;
    this.framesThisSecond = 0;
    this.lastFpsUpdate = 0;
    this.frameId = 0;
    this.running = false;
    this.started = false;
  }

  /**
   * Toggles the paused/running status of the game
   * @param {Boolean} running - Whether the game is currently in motion
   */
  changePausedState(running) {
    if (running) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Updates the on-screen FPS counter once per second
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  updateFpsDisplay(timestamp) {
    if (timestamp > this.lastFpsUpdate + 1000) {
      this.fps = (this.framesThisSecond + this.fps) / 2;
      this.lastFpsUpdate = timestamp;
      this.framesThisSecond = 0;
    }
    this.framesThisSecond += 1;
    this.fpsDisplay.textContent = `${Math.round(this.fps)} FPS`;
  }

  /**
   * Calls the draw function for every member of the entityList
   * @param {number} interp - The animation accuracy as a percentage
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  draw(interp, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.draw === 'function') {
        entity.draw(interp);
      }
    });
  }

  /**
   * Calls the update function for every member of the entityList
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  update(elapsedMs, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.update === 'function') {
        entity.update(elapsedMs);
      }
    });
  }

  /**
   * In the event that a ton of unsimulated frames pile up, discard all of these frames
   * to prevent crashing the game
   */
  panic() {
    this.elapsedMs = 0;
  }

  /**
   * Draws an initial frame, resets a few tracking variables related to animation, and calls
   * the mainLoop function to start the engine
   */
  start() {
    if (!this.started) {
      this.started = true;

      this.frameId = requestAnimationFrame((firstTimestamp) => {
        this.draw(1, []);
        this.running = true;
        this.lastFrameTimeMs = firstTimestamp;
        this.lastFpsUpdate = firstTimestamp;
        this.framesThisSecond = 0;

        this.frameId = requestAnimationFrame((timestamp) => {
          this.mainLoop(timestamp);
        });
      });
    }
  }

  /**
   * Stops the engine and cancels the current animation frame
   */
  stop() {
    this.running = false;
    this.started = false;
    cancelAnimationFrame(this.frameId);
  }

  /**
   * The loop which will process all necessary frames to update the game's entities
   * prior to animating them
   */
  processFrames() {
    let numUpdateSteps = 0;
    while (this.elapsedMs >= this.timestep) {
      this.update(this.timestep, this.entityList);
      if (!this.running) break;
      this.elapsedMs -= this.timestep;
      numUpdateSteps += 1;
      if (numUpdateSteps >= this.maxFps) {
        this.panic();
        break;
      }
    }
  }

  /**
   * A single cycle of the engine which checks to see if enough time has passed, and, if so,
   * will kick off the loops to update and draw the game's entities.
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  engineCycle(timestamp) {
    if (timestamp < this.lastFrameTimeMs + (1000 / this.maxFps)) {
      this.frameId = requestAnimationFrame((nextTimestamp) => {
        this.mainLoop(nextTimestamp);
      });
      return;
    }

    this.elapsedMs += timestamp - this.lastFrameTimeMs;
    this.lastFrameTimeMs = timestamp;
    this.updateFpsDisplay(timestamp);
    this.processFrames();
    this.draw(this.elapsedMs / this.timestep, this.entityList);

    if (this.running) {
      this.frameId = requestAnimationFrame((nextTimestamp) => {
        this.mainLoop(nextTimestamp);
      });
    }
  }

  /**
   * The endless loop which will kick off engine cycles so long as the game is running
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  mainLoop(timestamp) {
    this.engineCycle(timestamp);
  }
}


const triviaData = [
  {
    concept: "CPU",
    title: "Unidad Central de Procesamiento",
    description: "El CPU es el cerebro de la computadora. Procesa todas las instrucciones y datos que pasan por el sistema.",
    question: "¿Qué significan las siglas CPU?",
    options: ["Central Processing Unit", "Computer Personal Unit", "Control Process Utility", "Central Program User"],
    correctIndex: 0
  },
  {
    concept: "RAM",
    title: "Memoria de Acceso Aleatorio",
    description: "La RAM es la memoria a corto plazo de una computadora, donde se almacenan los datos que se están utilizando en el momento.",
    question: "¿Qué sucede con la información en la RAM cuando se apaga la computadora?",
    options: ["Se guarda permanentemente", "Se borra", "Se duplica", "Se envía a la nube"],
    correctIndex: 1
  },
  {
    concept: "GPU",
    title: "Unidad de Procesamiento Gráfico",
    description: "Es un procesador especializado en el renderizado de imágenes y videos, muy importante para juegos y diseño.",
    question: "¿Cuál es la función principal de una GPU?",
    options: ["Gestionar el teclado", "Procesar gráficos", "Almacenar archivos", "Enfriar el sistema"],
    correctIndex: 1
  },
  {
    concept: "SSD",
    title: "Unidad de Estado Sólido",
    description: "Es un dispositivo de almacenamiento de datos que utiliza memoria flash para guardar información, mucho más rápido que un HDD.",
    question: "¿Cuál es la principal ventaja de un SSD sobre un HDD?",
    options: ["Es más barato", "Es más ruidoso", "Es mucho más rápido", "Tiene partes móviles"],
    correctIndex: 2
  },
  {
    concept: "HDD",
    title: "Disco Duro Rígido",
    description: "Es un dispositivo de almacenamiento que utiliza platos magnéticos giratorios para grabar datos.",
    question: "¿Cómo almacena la información un HDD?",
    options: ["Con memoria flash", "Con imanes y discos giratorios", "Con luz láser", "Con vapor de agua"],
    correctIndex: 1
  },
  {
    concept: "Placa Base",
    title: "Motherboard",
    description: "Es el componente principal que conecta todos los demás elementos de la computadora (CPU, RAM, discos, etc.).",
    question: "¿Cómo se llama la placa donde se conectan todos los componentes?",
    options: ["Placa de Video", "Placa Base (Motherboard)", "Placa de Sonido", "Placa de Red"],
    correctIndex: 1
  },
  {
    concept: "Algoritmo",
    title: "Algoritmo",
    description: "Un conjunto de pasos lógicos y finitos para resolver un problema o realizar una tarea específica.",
    question: "¿Qué es un algoritmo?",
    options: ["Un lenguaje de programación", "Una serie de pasos para resolver un problema", "Un tipo de computadora", "Una marca de mouse"],
    correctIndex: 1
  },
  {
    concept: "Variable",
    title: "Variable de Programación",
    description: "Un espacio en la memoria reservado para almacenar un valor que puede cambiar durante la ejecución de un programa.",
    question: "En programación, ¿qué es una variable?",
    options: ["Un valor que nunca cambia", "Un contenedor para almacenar datos", "Un error del sistema", "Un tipo de monitor"],
    correctIndex: 1
  },
  {
    concept: "Bucle (Loop)",
    title: "Estructura de Ciclo",
    description: "Es una instrucción que repite un bloque de código mientras se cumpla una condición específica.",
    question: "¿Para qué sirve un 'bucle' en programación?",
    options: ["Para apagar el equipo", "Para repetir instrucciones", "Para borrar archivos", "Para saltar líneas de código"],
    correctIndex: 1
  },
  {
    concept: "Función",
    title: "Función o Método",
    description: "Un bloque de código reutilizable que realiza una tarea específica y puede devolver un resultado.",
    question: "¿Cuál es el beneficio de usar funciones?",
    options: ["Hacer el código más lento", "Evitar repetir el mismo código", "Aumentar el consumo de RAM", "Cambiar el color del editor"],
    correctIndex: 1
  },
  {
    concept: "Bug",
    title: "Error de Software",
    description: "Un error, falla o defecto en un programa de computadora que causa un resultado inesperado o incorrecto.",
    question: "¿A qué se refiere el término 'Bug' en informática?",
    options: ["A un virus de hardware", "A un error de programación", "A un tipo de cable", "A un insecto real en el teclado"],
    correctIndex: 1
  },
  {
    concept: "Sistema Operativo",
    title: "Controlador Maestro",
    description: "Software que administra el hardware y permite que el usuario interactúe con la computadora.",
    question: "¿Cuál de estos es un ejemplo de Sistema Operativo?",
    options: ["Microsoft Word", "Windows 11", "Google Chrome", "Adobe Photoshop"],
    correctIndex: 1
  },
  {
    concept: "Dirección IP",
    title: "Identificador de Red",
    description: "Una etiqueta numérica que identifica de manera única a un dispositivo conectado a una red.",
    question: "¿Para qué sirve la dirección IP?",
    options: ["Para saber el precio del equipo", "Para identificar un dispositivo en la red", "Para cargar la batería", "Para limpiar el disco"],
    correctIndex: 1
  },
  {
    concept: "DNS",
    title: "Sistema de Nombres de Dominio",
    description: "Traduce los nombres de dominio (como google.com) en direcciones IP numéricas.",
    question: "¿Qué hace el DNS?",
    options: ["Acelera el internet", "Convierte nombres de web en IPs", "Bloquea anuncios", "Descarga archivos"],
    correctIndex: 1
  },
  {
    concept: "HTTP",
    title: "Protocolo de Transferencia",
    description: "Es el protocolo utilizado para transmitir documentos de hipertexto, como páginas web, en Internet.",
    question: "¿En qué lugar solemos ver las siglas HTTP?",
    options: ["En el teclado", "En las direcciones de páginas web", "En las facturas de luz", "En los cables de red"],
    correctIndex: 1
  },
  {
    concept: "Firewall",
    title: "Cortafuegos",
    description: "Un sistema de seguridad de red que monitorea y controla el tráfico entrante y saliente basado en reglas de seguridad.",
    question: "¿Cuál es la función de un Firewall?",
    options: ["Aumentar la velocidad del Wi-Fi", "Bloquear accesos no autorizados", "Limpiar virus del disco", "Apagar fuegos eléctricos"],
    correctIndex: 1
  },
  {
    concept: "Nube (Cloud)",
    title: "Computación en la Nube",
    description: "Servicios de computación (servidores, bases de datos) que se ofrecen a través de Internet.",
    question: "¿Qué significa 'guardar en la nube'?",
    options: ["Guardar en un satélite", "Guardar en servidores de internet", "Subir datos al cielo", "Guardar en un CD"],
    correctIndex: 1
  },
  {
    concept: "Software Libre",
    title: "Open Source",
    description: "Software que respeta la libertad de los usuarios y la comunidad para ejecutar, copiar, distribuir y mejorar el programa.",
    question: "¿Qué caracteriza al Software Libre?",
    options: ["Es siempre gratis", "Su código fuente es accesible para todos", "No tiene licencia", "Solo funciona en Linux"],
    correctIndex: 1
  },
  {
    concept: "Bit",
    title: "Dígito Binario",
    description: "La unidad mínima de información en informática, que puede tener el valor 0 o 1.",
    question: "¿Cuántos valores puede tener un Bit?",
    options: ["10 valores", "2 valores (0 y 1)", "Infinitos", "256 valores"],
    correctIndex: 1
  },
  {
    concept: "Byte",
    title: "Grupo de 8 Bits",
    description: "Unidad de medida de información digital que equivale a 8 bits.",
    question: "¿A cuántos bits equivale un Byte?",
    options: ["10 bits", "8 bits", "100 bits", "1 bit"],
    correctIndex: 1
  },
  {
    concept: "ASCII",
    title: "Código de Caracteres",
    description: "Un estándar para representar caracteres de texto en computadoras.",
    question: "¿Para qué se usa el código ASCII?",
    options: ["Para medir la batería", "Representar letras y números en código", "Dibujar en 3D", "Controlar la temperatura"],
    correctIndex: 1
  },
  {
    concept: "Kernel",
    title: "Núcleo del Sistema",
    description: "La parte central del sistema operativo que gestiona la comunicación entre el software y el hardware.",
    question: "¿Qué es el Kernel?",
    options: ["Un tipo de procesador", "El corazón del sistema operativo", "Un virus informático", "Una marca de laptops"],
    correctIndex: 1
  },
  {
    concept: "BIOS",
    title: "Sistema Básico de Entrada/Salida",
    description: "Firmware instalado en la placa base que se encarga del arranque inicial de la computadora.",
    question: "¿Cuándo se ejecuta la BIOS?",
    options: ["Al abrir Word", "Al encender la computadora", "Al apagar el monitor", "Al jugar Pac-Man"],
    correctIndex: 1
  },
  {
    concept: "Compilador",
    title: "Traductor de Código",
    description: "Un programa que traduce el código escrito en un lenguaje de programación a lenguaje de máquina.",
    question: "¿Qué hace un compilador?",
    options: ["Borra el código", "Traduce código humano a código de máquina", "Busca virus", "Optimiza la batería"],
    correctIndex: 1
  },
  {
    concept: "Base de Datos",
    title: "Almacén de Datos",
    description: "Un sistema organizado para almacenar y gestionar grandes cantidades de información.",
    question: "¿Qué lenguaje se usa comúnmente para consultar bases de datos?",
    options: ["HTML", "SQL", "CSS", "Photoshop"],
    correctIndex: 1
  },
  {
    concept: "Router",
    title: "Enrutador",
    description: "Dispositivo que conecta diferentes redes y dirige el tráfico de datos entre ellas.",
    question: "¿Cuál es la función de un Router?",
    options: ["Amplificar el sonido", "Dirigir el tráfico de internet", "Cargar el mouse", "Imprimir documentos"],
    correctIndex: 1
  },
  {
    concept: "Wi-Fi",
    title: "Conexión Inalámbrica",
    description: "Tecnología que permite la conexión inalámbrica de dispositivos electrónicos a una red de datos.",
    question: "¿Qué permite la tecnología Wi-Fi?",
    options: ["Imprimir en 3D", "Conectarse a internet sin cables", "Ver televisión", "Cargar el celular"],
    correctIndex: 1
  },
  {
    concept: "Bluetooth",
    title: "Red de Corto Alcance",
    description: "Protocolo de comunicaciones diseñado para conectar dispositivos de bajo consumo a corta distancia.",
    question: "¿Cuál es una característica del Bluetooth?",
    options: ["Funciona a miles de kilómetros", "Conexión inalámbrica de corto alcance", "Se usa para limpiar discos", "Es una marca de café"],
    correctIndex: 1
  },
  {
    concept: "URL",
    title: "Localizador de Recursos",
    description: "La dirección única que identifica a un recurso en la web.",
    question: "¿Qué es una URL?",
    options: ["Un tipo de monitor", "La dirección de una página web", "Un lenguaje de programación", "Una marca de discos"],
    correctIndex: 1
  },
  {
    concept: "Cookie",
    title: "Galleta Informática",
    description: "Pequeño archivo enviado por un sitio web y almacenado en el navegador del usuario.",
    question: "¿Cuál es el propósito de una cookie?",
    options: ["Alimentar al usuario", "Recordar información del usuario", "Bloquear el virus", "Aumentar el brillo"],
    correctIndex: 1
  },
  {
    concept: "Phishing",
    title: "Suplantación de Identidad",
    description: "Una técnica de ingeniería social para engañar a los usuarios y obtener información confidencial.",
    question: "¿Qué busca un ataque de Phishing?",
    options: ["Regalar dinero", "Robar datos personales y claves", "Actualizar el sistema", "Mejorar la velocidad"],
    correctIndex: 1
  },
  {
    concept: "Malware",
    title: "Software Malicioso",
    description: "Cualquier tipo de software diseñado para infiltrarse o dañar una computadora sin el consentimiento del usuario.",
    question: "¿Qué es el Malware?",
    options: ["Un programa de antivirus", "Software dañino para el equipo", "Un juego de video", "Un tipo de cable"],
    correctIndex: 1
  },
  {
    concept: "Criptografía",
    title: "Cifrado de Datos",
    description: "Técnicas de escritura secreta para proteger la información frente a terceros no autorizados.",
    question: "¿Para qué sirve la criptografía?",
    options: ["Para dibujar mejor", "Para ocultar y proteger mensajes", "Para medir la RAM", "Para borrar archivos"],
    correctIndex: 1
  },
  {
    concept: "API",
    title: "Interfaz de Programación",
    description: "Un conjunto de definiciones y protocolos que permite que dos aplicaciones se comuniquen entre sí.",
    question: "¿Qué permite una API?",
    options: ["Que dos programas hablen entre sí", "Cambiar el mouse", "Limpiar el monitor", "Jugar en línea"],
    correctIndex: 0
  },
  {
    concept: "HTML",
    title: "Lenguaje de Marcado",
    description: "El lenguaje estándar utilizado para crear y estructurar páginas web.",
    question: "¿Para qué se usa principalmente HTML?",
    options: ["Para crear bases de datos", "Para estructurar páginas web", "Para editar fotos", "Para hackear"],
    correctIndex: 1
  },
  {
    concept: "CSS",
    title: "Hojas de Estilo",
    description: "Lenguaje utilizado para definir el diseño, los colores y las fuentes de una página web.",
    question: "¿Cuál es la función del CSS?",
    options: ["Dar estilo y diseño a la web", "Controlar los servidores", "Instalar programas", "Sumar números"],
    correctIndex: 0
  },
  {
    concept: "JavaScript",
    title: "Lenguaje de Scripting",
    description: "Lenguaje que permite crear contenido dinámico e interactivo en las páginas web.",
    question: "¿Qué permite hacer JavaScript en una web?",
    options: ["Hacerla interactiva", "Solo poner texto", "Imprimir la página", "Apagar el internet"],
    correctIndex: 0
  },
  {
    concept: "Git",
    title: "Control de Versiones",
    description: "Sistema para rastrear cambios en el código fuente durante el desarrollo de software.",
    question: "¿Para qué sirve Git?",
    options: ["Navegar en la web", "Controlar versiones de código", "Escuchar música", "Dibujar en 2D"],
    correctIndex: 1
  },
  {
    concept: "Firma Digital",
    title: "Identidad Digital",
    description: "Mecanismo que asegura la autenticidad e integridad de un mensaje o documento digital.",
    question: "¿Qué garantiza una firma digital?",
    options: ["El color del archivo", "Que el documento es auténtico", "Que el virus se borró", "La velocidad de carga"],
    correctIndex: 1
  },
  {
    concept: "Servidor",
    title: "Servidor Informático",
    description: "Una computadora potente que provee servicios, datos o recursos a otras computadoras llamadas clientes.",
    question: "¿Qué hace un servidor?",
    options: ["Solo juega Pac-Man", "Provee servicios a otros equipos", "Limpia teclados", "Se usa solo para ver videos"],
    correctIndex: 1
  },
  {
    concept: "Protocolo",
    title: "Reglas de Comunicación",
    description: "Un conjunto de reglas que permiten que dos o más entidades de un sistema de comunicación se comuniquen entre sí.",
    question: "¿Qué establece un protocolo?",
    options: ["El precio del internet", "Reglas para el intercambio de datos", "El tamaño de la pantalla", "La cantidad de RAM"],
    correctIndex: 1
  },
  {
    concept: "Ping",
    title: "Latencia de Red",
    description: "Utilidad que mide el tiempo de respuesta de una conexión entre dos dispositivos de red.",
    question: "¿Qué mide el comando Ping?",
    options: ["La temperatura", "La velocidad de respuesta de la red", "La memoria libre", "La cantidad de archivos"],
    correctIndex: 1
  },
  {
    concept: "USB",
    title: "Bus Serie Universal",
    description: "Estándar que define los cables, conectores y protocolos para conectar y alimentar periféricos.",
    question: "¿Para qué sirve el puerto USB?",
    options: ["Para ver televisión", "Conectar periféricos y cargar datos", "Enfriar la CPU", "Limpiar la placa base"],
    correctIndex: 1
  },
  {
    concept: "Hardware",
    title: "Componentes Físicos",
    description: "Las partes físicas y tangibles de un sistema informático.",
    question: "¿Cuál de estos es un Hardware?",
    options: ["Windows", "El Teclado", "Chrome", "Excel"],
    correctIndex: 1
  },
  {
    concept: "Software",
    title: "Componentes Lógicos",
    description: "El conjunto de programas y reglas informáticas para ejecutar tareas en una computadora.",
    question: "¿Cuál de estos es un Software?",
    options: ["El Monitor", "La Impresora", "Google Chrome", "El Cable de red"],
    correctIndex: 2
  },
  {
    concept: "Binario",
    title: "Sistema Numérico",
    description: "Sistema que utiliza solo dos símbolos (0 y 1) para representar valores.",
    question: "¿Qué números usa el sistema binario?",
    options: ["0 al 9", "0 y 1", "Solo el 1", "A y B"],
    correctIndex: 1
  },
  {
    concept: "IoT",
    title: "Internet de las Cosas",
    description: "La red de objetos físicos conectados a internet que recolectan e intercambian datos.",
    question: "¿Qué significan las siglas IoT?",
    options: ["Internal of Tools", "Internet of Things", "Input of Total", "Internet of Technology"],
    correctIndex: 1
  },
  {
    concept: "Inteligencia Artificial",
    title: "IA",
    description: "Capacidad de las máquinas de imitar funciones cognitivas humanas como el aprendizaje y la resolución de problemas.",
    question: "¿Cuál es el objetivo de la IA?",
    options: ["Hacer que las máquinas piensen", "Consumir menos luz", "Borrar fotos", "Aumentar el brillo"],
    correctIndex: 0
  },
  {
    concept: "Blockchain",
    title: "Cadena de Bloques",
    description: "Un registro digital descentralizado y seguro de transacciones distribuido en muchas computadoras.",
    question: "¿Qué tecnología es la base del Bitcoin?",
    options: ["Photoshop", "Blockchain", "Excel", "Windows"],
    correctIndex: 1
  },
  {
    concept: "Recursividad",
    title: "Función Recursiva",
    description: "Técnica de programación donde una función se llama a sí misma para resolver un problema.",
    question: "¿Qué hace una función recursiva?",
    options: ["Se borra a sí misma", "Se llama a sí misma", "Apaga el equipo", "Solo suma 1"],
  },
  {
    concept: "Linux",
    title: "Sistema Operativo Linux",
    description: "Un sistema operativo de código abierto basado en Unix, muy popular en servidores y desarrollo de software.",
    question: "¿Qué es Linux?",
    options: ["Un programa de edición", "Un sistema operativo de código abierto", "Una marca de discos duros", "Un tipo de cable de red"],
    correctIndex: 1
  },
  {
    concept: "Unix",
    title: "Sistema Operativo Unix",
    description: "Un sistema operativo multiusuario y multitarea desarrollado en los años 70, base de macOS y Linux.",
    question: "¿De cuál sistema operativo derivan macOS y Linux?",
    options: ["Windows", "MS-DOS", "Unix", "Android"],
    correctIndex: 2
  },
  {
    concept: "Compresión de Datos",
    title: "Reducción de Tamaño",
    description: "Proceso de reducir el tamaño de un archivo para que ocupe menos espacio en el disco o se envíe más rápido.",
    question: "¿Para qué sirve comprimir un archivo (ej. en formato ZIP)?",
    options: ["Para que ocupe menos espacio", "Para cambiar su color", "Para que sea más ruidoso", "Para instalar más RAM"],
    correctIndex: 0
  },
  {
    concept: "LAN",
    title: "Red de Área Local",
    description: "Una red de computadoras que abarca un área reducida, como una casa, oficina o edificio.",
    question: "¿Qué significa LAN?",
    options: ["Local Area Network", "Large Android Node", "Linux Apple Network", "Logic Access Name"],
    correctIndex: 0
  },
  {
    concept: "WAN",
    title: "Red de Área Amplia",
    description: "Una red de computadoras que se extiende sobre una gran distancia geográfica. Internet es la WAN más grande.",
    question: "¿Qué tipo de red es Internet?",
    options: ["LAN", "PAN", "WAN", "MAN"],
    correctIndex: 2
  },
  {
    concept: "Banda Ancha",
    title: "Ancho de Banda",
    description: "La cantidad máxima de datos que se pueden transmitir a través de una conexión de internet en un tiempo determinado.",
    question: "¿Qué mide el ancho de banda?",
    options: ["El peso del monitor", "La velocidad de transmisión de datos", "El brillo de la pantalla", "La cantidad de teclas"],
    correctIndex: 1
  },
  {
    concept: "Latencia",
    title: "Retraso en la Red",
    description: "El tiempo que tarda un paquete de datos en viajar desde su origen hasta su destino.",
    question: "¿Qué es la latencia en internet?",
    options: ["El retraso o lag en la conexión", "La marca del router", "El costo mensual", "La cantidad de virus"],
    correctIndex: 0
  },
  {
    concept: "Pixel",
    title: "Píxel",
    description: "La unidad más pequeña y básica de una imagen digital o pantalla que puede mostrar un color.",
    question: "¿Qué es un píxel?",
    options: ["Un tipo de memoria", "La unidad mínima de una imagen en pantalla", "Un programa para escribir", "Un cable de energía"],
    correctIndex: 1
  },
  {
    concept: "Resolución",
    title: "Resolución de Pantalla",
    description: "El número total de píxeles que puede ser mostrado en la pantalla, generalmente expresado como ancho x alto (ej. 1920x1080).",
    question: "¿A qué se refiere la resolución 1080p?",
    options: ["Al precio del monitor", "Al número de teclas", "A la cantidad de píxeles en pantalla", "A la velocidad del ventilador"],
    correctIndex: 2
  },
  {
    concept: "Tasa de Refresco",
    title: "Refresh Rate (Hz)",
    description: "La cantidad de veces por segundo que la pantalla actualiza su imagen. Se mide en Hercios (Hz).",
    question: "¿En qué se mide la tasa de refresco de un monitor?",
    options: ["En Litros", "En Metros", "En Hercios (Hz)", "En Kilogramos"],
    correctIndex: 2
  },
  {
    concept: "Cache",
    title: "Memoria Caché",
    description: "Memoria temporal muy rápida que guarda datos frecuentemente usados para acceder a ellos más rápido.",
    question: "¿Para qué sirve la memoria caché?",
    options: ["Para jugar mejor", "Para acceder a datos frecuentes más rápido", "Para apagar la computadora", "Para imprimir documentos"],
    correctIndex: 1
  },
  {
    concept: "VPN",
    title: "Red Privada Virtual",
    description: "Crea una conexión segura y cifrada sobre una red menos segura, como Internet, ocultando la dirección IP real.",
    question: "¿Para qué se utiliza una VPN?",
    options: ["Para comprar juegos", "Para navegar de forma segura y privada", "Para limpiar el teclado", "Para crear virus"],
    correctIndex: 1
  },
  {
    concept: "Antivirus",
    title: "Software Antivirus",
    description: "Programa diseñado para prevenir, buscar, detectar y eliminar virus informáticos y otro software malicioso.",
    question: "¿Cuál es la función principal de un Antivirus?",
    options: ["Acelerar internet", "Detectar y eliminar software malicioso", "Hacer los juegos más rápidos", "Guardar fotos"],
    correctIndex: 1
  },
  {
    concept: "Encriptación",
    title: "Cifrado",
    description: "El proceso de convertir información legible en un formato ilegible para protegerla de accesos no autorizados.",
    question: "¿Qué hace la encriptación de extremo a extremo?",
    options: ["Borra los mensajes", "Asegura que solo el emisor y receptor puedan leer el mensaje", "Traduce idiomas", "Mejora los gráficos"],
    correctIndex: 1
  },
  {
    concept: "Frontend",
    title: "Desarrollo Frontend",
    description: "La parte de un sitio web o aplicación con la que interactúa directamente el usuario (lo que se ve).",
    question: "¿De qué se encarga un desarrollador Frontend?",
    options: ["De los servidores", "De la base de datos", "De la interfaz visual y experiencia de usuario", "De instalar cables"],
    correctIndex: 2
  },
  {
    concept: "Backend",
    title: "Desarrollo Backend",
    description: "La parte de un sitio web o aplicación que funciona detrás de escena, incluyendo el servidor y la base de datos.",
    question: "¿Qué gestiona principalmente el Backend?",
    options: ["Los colores de la web", "El servidor, la lógica y la base de datos", "El diseño del logo", "El mouse del usuario"],
    correctIndex: 1
  },
  {
    concept: "Full Stack",
    title: "Desarrollador Full Stack",
    description: "Un programador que tiene habilidades tanto en el desarrollo Frontend como en el Backend.",
    question: "¿Qué hace un desarrollador Full Stack?",
    options: ["Solo arregla teclados", "Solo diseña logos", "Trabaja en el Frontend y en el Backend", "Solo instala Windows"],
    correctIndex: 2
  },
  {
    concept: "C++",
    title: "Lenguaje C++",
    description: "Un potente lenguaje de programación de propósito general, ampliamente usado en videojuegos y sistemas operativos.",
    question: "¿Para qué es famoso el lenguaje C++?",
    options: ["Para hacer páginas web simples", "Por su alto rendimiento en videojuegos y sistemas", "Por ser el lenguaje más fácil", "Por ser usado solo en calculadoras"],
    correctIndex: 1
  },
  {
    concept: "Python",
    title: "Lenguaje Python",
    description: "Un lenguaje de programación versátil y fácil de aprender, muy popular en inteligencia artificial y análisis de datos.",
    question: "¿En qué área destaca especialmente Python actualmente?",
    options: ["En el diseño de teclados", "En la inteligencia artificial y análisis de datos", "En la impresión 3D", "En la refrigeración de PC"],
    correctIndex: 1
  },
  {
    concept: "Java",
    title: "Lenguaje Java",
    description: "Un lenguaje de programación orientado a objetos, famoso por su filosofía 'Escribe una vez, ejecuta en cualquier lugar'.",
    question: "¿Qué caracteriza al lenguaje Java?",
    options: ["Solo funciona en Windows", "Puede ejecutarse en múltiples plataformas", "Es solo para hacer dibujos", "No usa código"],
    correctIndex: 1
  },
  {
    concept: "JSON",
    title: "Notación de Objetos JS",
    description: "Un formato de texto ligero para el intercambio de datos, fácil de leer para humanos y máquinas.",
    question: "¿Para qué se utiliza JSON?",
    options: ["Para comprimir videos", "Para intercambiar datos entre cliente y servidor", "Para limpiar la pantalla", "Para apagar la PC"],
    correctIndex: 1
  },
  {
    concept: "Terminal",
    title: "Línea de Comandos",
    description: "Una interfaz basada en texto que permite a los usuarios interactuar con el sistema operativo escribiendo comandos.",
    question: "¿Qué haces en una Terminal (o Consola)?",
    options: ["Jugar con el mouse", "Escribir comandos de texto al sistema operativo", "Dibujar con el cursor", "Grabar audios"],
    correctIndex: 1
  },
  {
    concept: "Bugs vs Errores",
    title: "Tipos de Errores",
    description: "Un bug es un defecto lógico en el código, mientras que un error de sintaxis es escribir mal una instrucción.",
    question: "¿Qué es un error de sintaxis en programación?",
    options: ["Un virus en la computadora", "Un fallo de hardware", "Escribir mal el código, incumpliendo las reglas del lenguaje", "Un cable desconectado"],
    correctIndex: 2
  },
  {
    concept: "Compilar vs Interpretar",
    title: "Ejecución de Código",
    description: "Compilar traduce todo el código de una vez, interpretar lo traduce línea por línea al momento de ejecutarse.",
    question: "¿Qué hace un lenguaje interpretado?",
    options: ["Traduce y ejecuta el código línea por línea", "Convierte todo a un archivo .exe", "Borra el código fuente", "Imprime el código en papel"],
    correctIndex: 0
  },
  {
    concept: "IDE",
    title: "Entorno de Desarrollo",
    description: "Un software que proporciona herramientas completas para los programadores, como editor de código, depurador y compilador.",
    question: "¿Qué significan las siglas IDE?",
    options: ["Internet Data Editor", "Integrated Development Environment", "Internal Digital Engine", "International Display Error"],
    correctIndex: 1
  },
  {
    concept: "Debug",
    title: "Depuración de Código",
    description: "El proceso de identificar y corregir errores (bugs) en el código de un programa.",
    question: "¿Qué hace un programador al depurar (debug) un programa?",
    options: ["Le agrega virus", "Busca y corrige los errores en el código", "Cambia el color de la pantalla", "Aumenta la memoria RAM"],
    correctIndex: 1
  },
  {
    concept: "Array",
    title: "Arreglo o Vector",
    description: "Una estructura de datos que almacena una colección de elementos, generalmente del mismo tipo, en un orden específico.",
    question: "¿Qué es un Array en programación?",
    options: ["Una lista ordenada de elementos", "Un tipo de monitor", "Un error del sistema", "Una marca de mouse"],
    correctIndex: 0
  },
  {
    concept: "String",
    title: "Cadena de Texto",
    description: "En programación, un String es una secuencia de caracteres usada para representar texto.",
    question: "¿Qué almacena una variable de tipo String?",
    options: ["Solo números enteros", "Texto o cadena de caracteres", "Imágenes en 3D", "Direcciones IP"],
    correctIndex: 1
  },
  {
    concept: "Boolean",
    title: "Valor Booleano",
    description: "Un tipo de dato lógico que solo puede tener dos valores: Verdadero (True) o Falso (False).",
    question: "¿Qué valores puede tomar un Booleano?",
    options: ["Cualquier número", "Rojo o Azul", "Verdadero (True) o Falso (False)", "Días de la semana"],
    correctIndex: 2
  },
  {
    concept: "If-Else",
    title: "Estructura Condicional",
    description: "Permite al programa tomar decisiones, ejecutando un código si se cumple una condición, o de lo contrario ejecutando otro.",
    question: "¿Para qué sirve un bloque 'If-Else'?",
    options: ["Para multiplicar números", "Para tomar decisiones lógicas en el código", "Para apagar la computadora", "Para borrar archivos"],
    correctIndex: 1
  },
  {
    concept: "Servidor Web",
    title: "Web Server",
    description: "Software o hardware que almacena y entrega el contenido de los sitios web a los navegadores de los usuarios.",
    question: "¿Cuál es la función de un servidor web?",
    options: ["Limpiar virus", "Entregar páginas web a los navegadores que las solicitan", "Cargar el celular", "Imprimir fotos"],
    correctIndex: 1
  },
  {
    concept: "Navegador Web",
    title: "Browser",
    description: "Un programa de software utilizado para acceder, recuperar y ver información en la World Wide Web.",
    question: "¿Cuál de los siguientes es un Navegador Web?",
    options: ["Windows", "Google Chrome", "Excel", "Photoshop"],
    correctIndex: 1
  },
  {
    concept: "Motor de Búsqueda",
    title: "Search Engine",
    description: "Un sistema informático que busca información en la World Wide Web según los términos ingresados por el usuario.",
    question: "¿Cuál de estos es un motor de búsqueda?",
    options: ["Google", "Word", "El Teclado", "Paint"],
    correctIndex: 0
  },
  {
    concept: "Open Source",
    title: "Código Abierto",
    description: "Modelo de desarrollo de software donde el código fuente está disponible públicamente para que cualquiera lo vea, modifique y distribuya.",
    question: "¿Qué significa que un programa sea Open Source?",
    options: ["Que siempre tiene virus", "Que su código fuente es público y modificable", "Que solo funciona de día", "Que cuesta mucho dinero"],
    correctIndex: 1
  },
  {
    concept: "Licencia de Software",
    title: "Derechos de Uso",
    description: "Un contrato legal que establece cómo se puede utilizar, modificar y distribuir un programa informático.",
    question: "¿Qué define una licencia de software?",
    options: ["El color del icono", "Los términos legales para su uso y distribución", "La velocidad de carga", "El tamaño en disco"],
    correctIndex: 1
  },
  {
    concept: "Freeware",
    title: "Software Gratuito",
    description: "Software que se distribuye sin costo, pero su código fuente no está disponible para modificación.",
    question: "¿Qué diferencia al Freeware del Open Source?",
    options: ["El Freeware es gratis pero su código es cerrado (privado)", "El Freeware cuesta dinero", "El Freeware solo es para Mac", "No hay diferencia"],
    correctIndex: 0
  },
  {
    concept: "Ping vs FPS",
    title: "Juegos Online",
    description: "Ping es el retraso de la red en milisegundos, FPS son los fotogramas visuales por segundo. Ping bajo y FPS alto es lo ideal.",
    question: "En videojuegos online, ¿qué es lo ideal?",
    options: ["Ping alto y FPS bajo", "Ping bajo y FPS alto", "Que ambos sean 0", "No importan los FPS"],
    correctIndex: 1
  },
  {
    concept: "Mac Address",
    title: "Dirección Física",
    description: "Un identificador único asignado a las interfaces de red de un dispositivo para comunicaciones en red.",
    question: "¿Qué es una dirección MAC?",
    options: ["Una computadora de Apple", "La dirección física única de una tarjeta de red", "Una dirección de correo", "Un tipo de hamburguesa"],
    correctIndex: 1
  },
  {
    concept: "IPv4 vs IPv6",
    title: "Protocolo de Internet",
    description: "IPv4 usa direcciones numéricas de 32 bits. Como se agotaron, se creó IPv6 que usa 128 bits e incluye letras.",
    question: "¿Por qué se creó el estándar IPv6?",
    options: ["Para hacerlo más difícil", "Porque las direcciones IPv4 se estaban agotando", "Para vender nuevos routers", "Para borrar el internet antiguo"],
    correctIndex: 1
  },
  {
    concept: "Ancho de Banda vs Velocidad",
    title: "Redes",
    description: "El ancho de banda es la capacidad de la tubería de datos, la velocidad es qué tan rápido fluyen realmente los datos.",
    question: "Si comparamos el internet con una tubería de agua, ¿qué sería el ancho de banda?",
    options: ["El color del agua", "El grosor o diámetro de la tubería", "La temperatura del agua", "El costo de la tubería"],
    correctIndex: 1
  },
  {
    concept: "Ciberseguridad",
    title: "Seguridad Informática",
    description: "La práctica de proteger sistemas, redes y programas de ataques digitales.",
    question: "¿Cuál es el objetivo de un ciberataque?",
    options: ["Limpiar el polvo de la PC", "Acceder, alterar o destruir información sensible", "Actualizar el reloj", "Mejorar la conexión"],
    correctIndex: 1
  },
  {
    concept: "Ransomware",
    title: "Secuestro de Datos",
    description: "Un tipo de software malicioso que bloquea el acceso a los datos de la víctima, exigiendo un rescate para liberarlos.",
    question: "¿Qué caracteriza a un ataque de Ransomware?",
    options: ["Borra todos los juegos", "Secuestra la información y pide un rescate económico", "Apaga el monitor", "Imprime hojas en blanco"],
    correctIndex: 1
  },
  {
    concept: "DDoS",
    title: "Ataque de Denegación",
    description: "Un ataque que busca saturar un servidor o red con tráfico falso para que no pueda responder a usuarios legítimos.",
    question: "¿Qué ocurre durante un ataque DDoS?",
    options: ["Se va la luz eléctrica", "Se inunda de tráfico un servidor hasta colapsarlo", "Se roban las contraseñas", "Se cambia el fondo de pantalla"],
    correctIndex: 1
  },
  {
    concept: "Framework",
    title: "Marco de Trabajo",
    description: "Una estructura base de código que proporciona herramientas y librerías predefinidas para acelerar el desarrollo.",
    question: "¿Para qué usan los programadores un Framework?",
    options: ["Para crear virus", "Para no tener que programar todo desde cero y ahorrar tiempo", "Para escribir más lento", "Para jugar videojuegos"],
    correctIndex: 1
  },
  {
    concept: "Librería (Library)",
    title: "Biblioteca de Código",
    description: "Un conjunto de funciones o códigos preescritos que los programadores pueden usar para tareas específicas.",
    question: "¿Qué es una librería en programación?",
    options: ["Una tienda de libros", "Un conjunto de código reutilizable para tareas específicas", "Un tipo de disco duro", "Un antivirus"],
    correctIndex: 1
  },
  {
    concept: "SQL",
    title: "Lenguaje de Consultas",
    description: "Structured Query Language, es el lenguaje estándar utilizado para gestionar y consultar bases de datos relacionales.",
    question: "¿Qué tipo de bases de datos utilizan principalmente SQL?",
    options: ["Bases de datos relacionales (con tablas)", "Bases de datos de imágenes", "Archivos de audio", "Bases de datos de juegos"],
    correctIndex: 0
  },
  {
    concept: "NoSQL",
    title: "Bases de Datos No Relacionales",
    description: "Sistemas de bases de datos que no usan tablas relacionales, ideales para almacenar datos no estructurados a gran escala.",
    question: "¿Cuál es una ventaja de las bases de datos NoSQL?",
    options: ["Son más lentas", "Son ideales para datos muy flexibles o no estructurados", "No guardan información", "Solo funcionan sin internet"],
    correctIndex: 1
  },
  {
    concept: "Big Data",
    title: "Macrodatos",
    description: "Término que describe el enorme volumen de datos que inunda los negocios cada día, y cómo se analizan para tomar decisiones.",
    question: "¿Qué busca el análisis de Big Data?",
    options: ["Encontrar patrones útiles en volúmenes masivos de información", "Borrar archivos grandes", "Aumentar el tamaño de la pantalla", "Acelerar el Wi-Fi"],
    correctIndex: 0
  },
  {
    concept: "Algoritmo Genético",
    title: "Inteligencia Artificial",
    description: "Un método de búsqueda y optimización basado en el proceso biológico de evolución natural (mutación y selección).",
    question: "¿En qué se inspiran los algoritmos genéticos?",
    options: ["En la teoría de la relatividad", "En la evolución biológica y selección natural", "En la receta del pan", "En la construcción de edificios"],
    correctIndex: 1
  },
  {
    concept: "Machine Learning",
    title: "Aprendizaje Automático",
    description: "Una rama de la inteligencia artificial que permite a las computadoras aprender de los datos sin ser programadas explícitamente.",
    question: "¿Cómo aprenden los sistemas de Machine Learning?",
    options: ["Leyendo libros", "Entrenándose con grandes cantidades de datos", "Copiando a otros robots", "Viendo videos"],
    correctIndex: 1
  }
];


class Pickup {
  constructor(type, scaledTileSize, column, row, pacman, mazeDiv, points) {
    this.type = type;
    this.pacman = pacman;
    this.mazeDiv = mazeDiv;
    this.points = points;
    this.nearPacman = false;

    this.fruitImages = {
      100: 'cherry',
      300: 'strawberry',
      500: 'orange',
      700: 'apple',
      1000: 'melon',
      2000: 'galaxian',
      3000: 'bell',
      5000: 'key',
    };

    this.setStyleMeasurements(type, scaledTileSize, column, row, points);
  }

  /**
   * Resets the pickup's visibility
   */
  reset() {
    this.animationTarget.style.visibility = (this.type === 'fruit')
      ? 'hidden' : 'visible';
  }

  /**
   * Sets various style measurements for the pickup depending on its type
   * @param {('pacdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {number} scaledTileSize
   * @param {number} column
   * @param {number} row
   * @param {number} points
   */
  setStyleMeasurements(type, scaledTileSize, column, row, points) {
    if (type === 'pacdot') {
      this.size = scaledTileSize * 0.25;
      this.x = (column * scaledTileSize) + ((scaledTileSize / 8) * 3);
      this.y = (row * scaledTileSize) + ((scaledTileSize / 8) * 3);
    } else if (type === 'powerPellet') {
      this.size = scaledTileSize;
      this.x = (column * scaledTileSize);
      this.y = (row * scaledTileSize);
    } else {
      this.size = scaledTileSize * 2;
      this.x = (column * scaledTileSize) - (scaledTileSize * 0.5);
      this.y = (row * scaledTileSize) - (scaledTileSize * 0.5);
    }

    this.center = {
      x: column * scaledTileSize,
      y: row * scaledTileSize,
    };

    this.animationTarget = document.createElement('div');
    this.animationTarget.style.position = 'absolute';
    this.animationTarget.style.backgroundSize = `${this.size}px`;
    this.animationTarget.style.backgroundImage = this.determineImage(
      type, points,
    );
    this.animationTarget.style.height = `${this.size}px`;
    this.animationTarget.style.width = `${this.size}px`;
    this.animationTarget.style.top = `${this.y}px`;
    this.animationTarget.style.left = `${this.x}px`;
    this.mazeDiv.appendChild(this.animationTarget);

    if (type === 'powerPellet') {
      this.animationTarget.classList.add('power-pellet');
    }

    this.reset();
  }

  /**
   * Determines the Pickup image based on type and point value
   * @param {('pacdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {Number} points
   * @returns {String}
   */
  determineImage(type, points) {
    let image = '';

    if (type === 'fruit') {
      image = this.fruitImages[points] || 'cherry';
    } else {
      image = type;
    }

    return `url(app/style/graphics/spriteSheets/pickups/${image}.svg)`;
  }

  /**
   * Shows a bonus fruit, resetting its point value and image
   * @param {number} points
   */
  showFruit(points) {
    this.points = points;
    this.animationTarget.style.backgroundImage = this.determineImage(
      this.type, points,
    );
    this.animationTarget.style.visibility = 'visible';
  }

  /**
   * Makes the fruit invisible (happens if Pacman was too slow)
   */
  hideFruit() {
    this.animationTarget.style.visibility = 'hidden';
  }

  /**
   * Returns true if the Pickup is touching a bounding box at Pacman's center
   * @param {({ x: number, y: number, size: number})} pickup
   * @param {({ x: number, y: number, size: number})} originalPacman
   */
  checkForCollision(pickup, originalPacman) {
    const pacman = Object.assign({}, originalPacman);

    pacman.x += (pacman.size * 0.25);
    pacman.y += (pacman.size * 0.25);
    pacman.size /= 2;

    return (pickup.x < pacman.x + pacman.size
      && pickup.x + pickup.size > pacman.x
      && pickup.y < pacman.y + pacman.size
      && pickup.y + pickup.size > pacman.y);
  }

  /**
   * Checks to see if the pickup is close enough to Pacman to be considered for collision detection
   * @param {number} maxDistance - The maximum distance Pacman can travel per cycle
   * @param {({ x:number, y:number })} pacmanCenter - The center of Pacman's hitbox
   * @param {Boolean} debugging - Flag to change the appearance of pickups for testing
   */
  checkPacmanProximity(maxDistance, pacmanCenter, debugging) {
    if (this.animationTarget.style.visibility !== 'hidden') {
      const distance = Math.sqrt(
        ((this.center.x - pacmanCenter.x) ** 2)
        + ((this.center.y - pacmanCenter.y) ** 2),
      );

      this.nearPacman = (distance <= maxDistance);

      if (debugging) {
        this.animationTarget.style.background = this.nearPacman
          ? 'lime' : 'red';
      }
    }
  }

  /**
   * Checks if the pickup is visible and close to Pacman
   * @returns {Boolean}
   */
  shouldCheckForCollision() {
    return this.animationTarget.style.visibility !== 'hidden'
      && this.nearPacman;
  }

  /**
   * If the Pickup is still visible, it checks to see if it is colliding with Pacman.
   * It will turn itself invisible and cease collision-detection after the first
   * collision with Pacman.
   */
  update() {
    if (this.shouldCheckForCollision()) {
      if (this.checkForCollision(
        {
          x: this.x,
          y: this.y,
          size: this.size,
        }, {
          x: this.pacman.position.left,
          y: this.pacman.position.top,
          size: this.pacman.measurement,
        },
      )) {
        this.animationTarget.style.visibility = 'hidden';
        window.dispatchEvent(new CustomEvent('awardPoints', {
          detail: {
            points: this.points,
            type: this.type,
            pickup: this,
          },
        }));

        if (this.type === 'pacdot') {
          window.dispatchEvent(new Event('dotEaten'));
        } else if (this.type === 'powerPellet') {
          window.dispatchEvent(new Event('dotEaten'));
          window.dispatchEvent(new Event('powerUp'));
        }
      }
    }
  }
}


class CharacterUtil {
  constructor() {
    this.directions = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
    };
  }

  /**
   * Check if a given character has moved more than five in-game tiles during a frame.
   * If so, we want to temporarily hide the object to avoid 'animation stutter'.
   * @param {({top: number, left: number})} position - Position during the current frame
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @returns {('hidden'|'visible')} - The new 'visibility' css property value for the character.
   */
  checkForStutter(position, oldPosition) {
    let stutter = false;
    const threshold = 5;

    if (position && oldPosition) {
      if (Math.abs(position.top - oldPosition.top) > threshold
        || Math.abs(position.left - oldPosition.left) > threshold) {
        stutter = true;
      }
    }

    return stutter ? 'hidden' : 'visible';
  }

  /**
   * Check which CSS property needs to be changed given the character's current direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('top'|'left')}
   */
  getPropertyToChange(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        return 'top';
      default:
        return 'left';
    }
  }

  /**
   * Calculate the velocity for the character's next frame.
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @returns {number} - Moving down or right is positive, while up or left is negative.
   */
  getVelocity(direction, velocityPerMs) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return velocityPerMs * -1;
      default:
        return velocityPerMs;
    }
  }

  /**
   * Determine the next value which will be used to draw the character's position on screen
   * @param {number} interp - The percentage of the desired timestamp between frames
   * @param {('top'|'left')} prop - The css property to be changed
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @param {({top: number, left: number})} position - Position during the current frame
   * @returns {number} - New value for css positioning
   */
  calculateNewDrawValue(interp, prop, oldPosition, position) {
    return oldPosition[prop] + (position[prop] - oldPosition[prop]) * interp;
  }

  /**
   * Convert the character's css position to a row-column on the maze array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({x: number, y: number})}
   */
  determineGridPosition(position, scaledTileSize) {
    return {
      x: (position.left / scaledTileSize) + 0.5,
      y: (position.top / scaledTileSize) + 0.5,
    };
  }

  /**
   * Check to see if a character's disired direction results in turning around
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('up'|'down'|'left'|'right')} desiredDirection - Character's desired orientation
   * @returns {boolean}
   */
  turningAround(direction, desiredDirection) {
    return desiredDirection === this.getOppositeDirection(direction);
  }

  /**
   * Calculate the opposite of a given direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('up'|'down'|'left'|'right')}
   */
  getOppositeDirection(direction) {
    switch (direction) {
      case this.directions.up:
        return this.directions.down;
      case this.directions.down:
        return this.directions.up;
      case this.directions.left:
        return this.directions.right;
      default:
        return this.directions.left;
    }
  }

  /**
   * Calculate the proper rounding function to assist with collision detection
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {Function}
   */
  determineRoundingFunction(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return Math.floor;
      default:
        return Math.ceil;
    }
  }

  /**
   * Check to see if the character's next frame results in moving to a new tile on the maze array
   * @param {({x: number, y: number})} oldPosition - Position during the previous frame
   * @param {({x: number, y: number})} position - Position during the current frame
   * @returns {boolean}
   */
  changingGridPosition(oldPosition, position) {
    return (
      Math.floor(oldPosition.x) !== Math.floor(position.x)
            || Math.floor(oldPosition.y) !== Math.floor(position.y)
    );
  }

  /**
   * Check to see if the character is attempting to run into a wall of the maze
   * @param {({x: number, y: number})} desiredNewGridPosition - Character's target tile
   * @param {Array} mazeArray - The 2D array representing the game's maze
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {boolean}
   */
  checkForWallCollision(desiredNewGridPosition, mazeArray, direction) {
    const roundingFunction = this.determineRoundingFunction(
      direction, this.directions,
    );

    const desiredX = roundingFunction(desiredNewGridPosition.x);
    const desiredY = roundingFunction(desiredNewGridPosition.y);
    let newGridValue;

    if (Array.isArray(mazeArray[desiredY])) {
      newGridValue = mazeArray[desiredY][desiredX];
    }

    return (newGridValue === 'X');
  }

  /**
   * Returns an object containing the new position and grid position based upon a direction
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {object}
   */
  determineNewPositions(
    position, direction, velocityPerMs, elapsedMs, scaledTileSize,
  ) {
    const newPosition = Object.assign({}, position);
    newPosition[this.getPropertyToChange(direction)]
      += this.getVelocity(direction, velocityPerMs) * elapsedMs;
    const newGridPosition = this.determineGridPosition(
      newPosition, scaledTileSize,
    );

    return {
      newPosition,
      newGridPosition,
    };
  }

  /**
   * Calculates the css position when snapping the character to the x-y grid
   * @param {({x: number, y: number})} position - The character's position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  snapToGrid(position, direction, scaledTileSize) {
    const newPosition = Object.assign({}, position);
    const roundingFunction = this.determineRoundingFunction(
      direction, this.directions,
    );

    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        newPosition.y = roundingFunction(newPosition.y);
        break;
      default:
        newPosition.x = roundingFunction(newPosition.x);
        break;
    }

    return {
      top: (newPosition.y - 0.5) * scaledTileSize,
      left: (newPosition.x - 0.5) * scaledTileSize,
    };
  }

  /**
   * Returns a modified position if the character needs to warp
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  handleWarp(position, scaledTileSize, mazeArray) {
    const newPosition = Object.assign({}, position);
    const gridPosition = this.determineGridPosition(position, scaledTileSize);

    if (gridPosition.x < -0.75) {
      newPosition.left = (scaledTileSize * (mazeArray[0].length - 0.75));
    } else if (gridPosition.x > (mazeArray[0].length - 0.25)) {
      newPosition.left = (scaledTileSize * -1.25);
    }

    return newPosition;
  }

  /**
   * Advances spritesheet by one frame if needed
   * @param {Object} character - The character which needs to be animated
   */
  advanceSpriteSheet(character) {
    const {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    } = character;
    const updatedProperties = {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    };

    const ready = (character.msSinceLastSprite > character.msBetweenSprites)
      && character.animate;
    if (ready) {
      updatedProperties.msSinceLastSprite = 0;

      if (character.backgroundOffsetPixels
        < (character.measurement * (character.spriteFrames - 1))
      ) {
        updatedProperties.backgroundOffsetPixels += character.measurement;
      } else if (character.loopAnimation) {
        updatedProperties.backgroundOffsetPixels = 0;
      }

      const style = `-${updatedProperties.backgroundOffsetPixels}px 0px`;
      updatedProperties.animationTarget.style.backgroundPosition = style;
    }

    return updatedProperties;
  }
}


class SoundManager {
  constructor() {
    this.baseUrl = 'app/style/audio/';
    this.fileFormat = 'mp3';
    this.masterVolume = 1;
    this.paused = false;
    this.cutscene = true;

    this.ambience = new AudioContext();

    this.dotBuffers = [null, null];
    this.currentDotSound = 0;
    this.dotPlayerActive = false;
    
    this.preloadDotSounds();
  }

  async preloadDotSounds() {
    try {
      const response1 = await fetch(`${this.baseUrl}dot_1.${this.fileFormat}`);
      const arrayBuffer1 = await response1.arrayBuffer();
      this.dotBuffers[0] = await this.ambience.decodeAudioData(arrayBuffer1);

      const response2 = await fetch(`${this.baseUrl}dot_2.${this.fileFormat}`);
      const arrayBuffer2 = await response2.arrayBuffer();
      this.dotBuffers[1] = await this.ambience.decodeAudioData(arrayBuffer2);
    } catch (e) {
      console.error('Failed to load dot sounds', e);
    }
  }

  /**
   * Sets the cutscene flag to determine if players should be able to resume ambience
   * @param {Boolean} newValue
   */
  setCutscene(newValue) {
    this.cutscene = newValue;
  }

  /**
   * Sets the master volume for all sounds and stops/resumes ambience
   * @param {(0|1)} newVolume
   */
  setMasterVolume(newVolume) {
    this.masterVolume = newVolume;

    if (this.soundEffect) {
      this.soundEffect.volume = this.masterVolume;
    }



    if (this.masterVolume === 0) {
      this.stopAmbience();
    } else {
      this.resumeAmbience(this.paused);
    }
  }

  /**
   * Plays a single sound effect
   * @param {String} sound
   */
  play(sound) {
    this.soundEffect = new Audio(`${this.baseUrl}${sound}.${this.fileFormat}`);
    this.soundEffect.volume = this.masterVolume;
    this.soundEffect.play();
  }

  /**
   * Special method for eating dots. The dots should alternate between two
   * sound effects, but not too quickly.
   */
  playDotSound() {
    this.queuedDotSound = true;

    if (!this.dotPlayerActive && this.dotBuffers[0] && this.dotBuffers[1]) {
      this.queuedDotSound = false;
      this.dotPlayerActive = true;
      this.currentDotSound = (this.currentDotSound === 0) ? 1 : 0;

      const source = this.ambience.createBufferSource();
      source.buffer = this.dotBuffers[this.currentDotSound];
      
      const gainNode = this.ambience.createGain();
      gainNode.gain.value = this.masterVolume;
      
      source.connect(gainNode);
      gainNode.connect(this.ambience.destination);
      
      source.onended = this.dotSoundEnded.bind(this);
      source.start();
    }
  }

  /**
   * Deletes the dotSound player and plays another dot sound if needed
   */
  dotSoundEnded() {
    this.dotPlayerActive = false;

    if (this.queuedDotSound) {
      this.playDotSound();
    }
  }

  /**
   * Loops an ambient sound
   * @param {String} sound
   */
  async setAmbience(sound, keepCurrentAmbience) {
    if (!this.cutscene) {
      this.latestAmbienceRequest = sound;
      this.isAmbienceStopped = false;

      if (!keepCurrentAmbience) {
        this.currentAmbience = sound;
        this.paused = false;
      } else {
        this.paused = true;
      }

      if (this.ambienceSource) {
        try {
          this.ambienceSource.stop();
        } catch (e) {
          // Ignore InvalidStateError if already stopped or not started
        }
      }

      if (this.masterVolume !== 0) {
        this.fetchingAmbience = true;
        const response = await fetch(
          `${this.baseUrl}${sound}.${this.fileFormat}`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ambience.decodeAudioData(arrayBuffer);

        if (this.latestAmbienceRequest !== sound || this.isAmbienceStopped) {
          this.fetchingAmbience = false;
          return;
        }

        this.ambienceSource = this.ambience.createBufferSource();
        this.ambienceSource.buffer = audioBuffer;
        this.ambienceSource.connect(this.ambience.destination);
        this.ambienceSource.loop = true;
        this.ambienceSource.start();

        this.fetchingAmbience = false;
      }
    }
  }

  /**
   * Resumes the ambience
   */
  resumeAmbience(paused) {
    if (this.ambienceSource) {
      // Resetting the ambience since an AudioBufferSourceNode can only
      // have 'start()' called once
      if (paused) {
        this.setAmbience('pause_beat', true);
      } else {
        this.setAmbience(this.currentAmbience);
      }
    }
  }

  /**
   * Stops the ambience
   */
  stopAmbience() {
    this.isAmbienceStopped = true;
    if (this.ambienceSource) {
      try {
        this.ambienceSource.stop();
      } catch (e) {
        // Ignore InvalidStateError if already stopped or not started
      }
    }
  }
}


class Timer {
  constructor(callback, delay) {
    this.callback = callback;
    this.remaining = delay;
    this.resume();
  }

  /**
   * Pauses the timer marks whether the pause came from the player
   * or the system
   * @param {Boolean} systemPause
   */
  pause(systemPause) {
    window.clearTimeout(this.timerId);
    this.remaining -= new Date() - this.start;
    this.oldTimerId = this.timerId;

    if (systemPause) {
      this.pausedBySystem = true;
    }
  }

  /**
   * Creates a new setTimeout based upon the remaining time, giving the
   * illusion of 'resuming' the old setTimeout
   * @param {Boolean} systemResume
   */
  resume(systemResume) {
    if (systemResume || !this.pausedBySystem) {
      this.pausedBySystem = false;

      this.start = new Date();
      this.timerId = window.setTimeout(() => {
        this.callback();
        window.dispatchEvent(new CustomEvent('removeTimer', {
          detail: {
            timer: this,
          },
        }));
      }, this.remaining);

      if (!this.oldTimerId) {
        window.dispatchEvent(new CustomEvent('addTimer', {
          detail: {
            timer: this,
          },
        }));
      }
    }
  }
}

