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
        if (!icon) return;
        if (document.fullscreenElement) {
          // Show exit-fullscreen icon (compress arrows)
          icon.innerHTML = '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>';
        } else {
          // Show enter-fullscreen icon (expand arrows)
          icon.innerHTML = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
        }
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
    
    // Original physical pixel dimensions of the game UI based on the load-time scaledTileSize
    const uiWidth = this.scaledTileSize * 28;
    const uiHeight = this.scaledTileSize * 36; // Maze + UI height roughly

    let scaleFactor = 1;

    if (_vw > _vh) {
      // Landscape: scale so the height of the UI is 95% of viewport height
      scaleFactor = (_vh * 0.95) / uiHeight;
      this.gameUi.style.transform = `scale(${scaleFactor})`;
      this.gameUi.style.transformOrigin = 'center center';
    } else {
      // Portrait: fit width (93%) or height (61%)
      const scaleW = (_vw * 0.93) / uiWidth;
      const scaleH = (_vh * 0.61) / uiHeight;
      scaleFactor = Math.min(scaleW, scaleH);
      this.gameUi.style.transform = `scale(${scaleFactor})`;
      this.gameUi.style.transformOrigin = 'center top';
    }
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

// removeIf(production)
module.exports = GameCoordinator;
// endRemoveIf(production)
