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

// removeIf(production)
module.exports = SoundManager;
// endRemoveIf(production)
