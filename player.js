/**
 * PlayerController: Wraps HTML5 video element with dynamic speed adjustments,
 * speed override option, progress caching across refreshes, and stream reload.
 */
class PlayerController {
  constructor(videoElementId, options = {}) {
    this.video = document.getElementById(videoElementId);
    this.waitingOverlay = document.getElementById("waitingOverlay");
    this.loadingOverlay = document.getElementById("videoLoadingOverlay");
    this.loadingText = document.getElementById("loadingStatusText");
    this.btnToggleWait = document.getElementById("btnToggleWaitForSlowest");
    this.waitSubText = document.getElementById("waitToggleSub");

    this.onStateChange = options.onStateChange || (() => {});
    this.defaultSpeed = 1.25;
    this.currentSpeed = 1.25;
    this.speedOverride = "auto"; // "auto" or numeric (e.g., 1.0, 1.25)
    this.isBuffering = false;
    this.waitingForSlowest = false;

    this.currentStreamUrl = "";
    this.currentVideoKey = "";
    this.lastCacheSaveTime = 0;

    this.initVideo();
    this.initEvents();
  }

  initVideo() {
    this.video.defaultPlaybackRate = this.defaultSpeed;
    this.video.playbackRate = this.defaultSpeed;
    this.video.controls = true; // Use native browser controls for volume, seek
  }

  initEvents() {
    // Playback events
    this.video.addEventListener("play", () => this.handleStateChange());
    this.video.addEventListener("pause", () => {
      this.saveProgressCache();
      this.handleStateChange();
    });
    this.video.addEventListener("seeking", () => this.handleStateChange());
    this.video.addEventListener("seeked", () => {
      this.saveProgressCache();
      this.handleStateChange();
    });

    // Time update progress caching (every 500ms)
    this.video.addEventListener("timeupdate", () => {
      const now = Date.now();
      if (now - this.lastCacheSaveTime > 500) {
        this.lastCacheSaveTime = now;
        this.saveProgressCache();
      }
    });

    // Save on beforeunload
    window.addEventListener("beforeunload", () => {
      this.saveProgressCache();
    });

    // Buffering detection
    this.video.addEventListener("waiting", () => {
      this.isBuffering = true;
      this.handleStateChange();
    });

    this.video.addEventListener("playing", () => {
      this.isBuffering = false;
      this.hideLoading();
      this.handleStateChange();
    });

    this.video.addEventListener("canplay", () => {
      this.isBuffering = false;
      this.hideLoading();
    });

    this.video.addEventListener("loadedmetadata", () => {
      this.hideLoading();
      if (this.video.videoWidth && this.video.videoHeight) {
        const ratio = (this.video.videoWidth / this.video.videoHeight).toFixed(4);
        const theater = this.video.closest(".player-theater-container");
        const wrapper = this.video.closest(".player-wrapper");
        if (theater) {
          theater.style.setProperty("--theater-ratio", ratio);
          theater.style.setProperty("--video-aspect-ratio", ratio);
        }
        if (wrapper) {
          wrapper.style.setProperty("--video-aspect-ratio", ratio);
          wrapper.style.aspectRatio = `${this.video.videoWidth} / ${this.video.videoHeight}`;
        }
      }
      this.handleStateChange();
    });

    this.video.addEventListener("loadeddata", () => {
      this.hideLoading();
    });

    this.video.addEventListener("error", () => {
      this.isBuffering = false;
      const err = this.video.error;
      console.error("Video element playback error:", err);
      let msg = "Could not load video stream";
      if (err) {
        if (err.code === 2) msg = "Network error loading video stream";
        else if (err.code === 3) msg = "Media decoding error - Click 'Reload Video' to resume";
        else if (err.code === 4) msg = "Video format not supported or stream unreachable";
      }
      this.showLoading(`⚠️ ${msg}. Click 'Reload Video' to retry.`);
    });

    this.video.addEventListener("ratechange", () => {
      this.currentSpeed = this.video.playbackRate;
    });

    // "Wait for Slowest" button click
    if (this.btnToggleWait) {
      this.btnToggleWait.addEventListener("click", () => {
        this.toggleWaitForSlowest();
      });
    }

    const btnCancelWait = document.getElementById("btnCancelWaiting");
    if (btnCancelWait) {
      btnCancelWait.addEventListener("click", () => {
        this.cancelWaitForSlowest();
      });
    }
  }

  saveProgressCache() {
    if (this.currentVideoKey && this.video && this.video.currentTime > 1.0) {
      try {
        localStorage.setItem(`wp_pos_${this.currentVideoKey}`, this.video.currentTime.toFixed(2));
      } catch (e) {}
    }
  }

  restoreProgressCache() {
    if (this.currentVideoKey && this.video) {
      try {
        const saved = localStorage.getItem(`wp_pos_${this.currentVideoKey}`);
        if (saved) {
          const t = parseFloat(saved);
          if (t > 1.0 && t < (this.video.duration || 999999) - 2) {
            console.log(`[Player] Restoring cached progress at ${t}s for ${this.currentVideoKey}`);
            this.video.currentTime = t;
            return true;
          }
        }
      } catch (e) {}
    }
    return false;
  }

  setSpeedOverride(val) {
    if (val === "auto") {
      this.speedOverride = "auto";
      this.applySpeed(this.defaultSpeed, "auto_reset");
    } else {
      const spd = parseFloat(val);
      if (!isNaN(spd) && spd > 0) {
        this.speedOverride = spd;
        this.video.playbackRate = spd;
        this.currentSpeed = spd;
      }
    }
    this.handleStateChange();
  }

  toggleWaitForSlowest() {
    this.waitingForSlowest = !this.waitingForSlowest;
    if (this.waitingForSlowest) {
      this.video.pause();
      if (this.btnToggleWait) this.btnToggleWait.classList.add("active");
      if (this.waitSubText) this.waitSubText.textContent = "Active - Waiting for slowest...";
      if (this.waitingOverlay) this.waitingOverlay.classList.remove("hidden");
    } else {
      if (this.btnToggleWait) this.btnToggleWait.classList.remove("active");
      if (this.waitSubText) this.waitSubText.textContent = "Auto-resumes when caught up";
      if (this.waitingOverlay) this.waitingOverlay.classList.add("hidden");
    }
    this.handleStateChange();
  }

  cancelWaitForSlowest() {
    this.waitingForSlowest = false;
    if (this.btnToggleWait) this.btnToggleWait.classList.remove("active");
    if (this.waitSubText) this.waitSubText.textContent = "Auto-resumes when caught up";
    if (this.waitingOverlay) this.waitingOverlay.classList.add("hidden");
    this.video.play().catch(() => {});
    this.handleStateChange();
  }

  autoResume(message) {
    this.waitingForSlowest = false;
    if (this.btnToggleWait) {
      this.btnToggleWait.classList.remove("active");
      this.waitSubText.textContent = "Auto-resumes when caught up";
    }
    if (this.waitingOverlay) {
      this.waitingOverlay.classList.add("hidden");
    }
    this.video.play().catch(e => console.warn("Auto-play permission:", e));
    this.handleStateChange();
  }

  applySpeed(targetSpeed, reason = "synced") {
    // If the user manually chose a speed override, do not overwrite it with room sync
    if (this.speedOverride !== "auto") {
      return;
    }

    const clampedSpeed = Math.max(0.5, Math.min(3.0, Number(targetSpeed)));
    if (Math.abs(this.video.playbackRate - clampedSpeed) > 0.05) {
      this.video.playbackRate = clampedSpeed;
      this.currentSpeed = clampedSpeed;
    }
  }

  loadSource(streamUrl, videoMeta) {
    this.showLoading(`Loading "${videoMeta.title || 'video'}"...`);
    this.currentStreamUrl = streamUrl;
    this.currentVideoKey = videoMeta.bvid || "active_custom";

    this.video.src = streamUrl;
    this.video.load();

    const speedToUse = this.speedOverride !== "auto" ? this.speedOverride : this.defaultSpeed;
    this.video.playbackRate = speedToUse;
    this.currentSpeed = speedToUse;
  }

  reload() {
    if (!this.currentStreamUrl) {
      if (this.video.src) {
        this.currentStreamUrl = this.video.src;
      } else {
        return;
      }
    }
    const prevTime = this.video.currentTime || 0;
    const wasPlaying = !this.video.paused;
    this.showLoading("Reloading video stream...");

    const onMeta = () => {
      this.video.removeEventListener("loadedmetadata", onMeta);
      if (prevTime > 0 && prevTime < (this.video.duration || 999999)) {
        this.video.currentTime = prevTime;
      }
      if (wasPlaying) {
        this.video.play().catch(e => console.warn("Auto-play permission:", e));
      }
      this.hideLoading();
    };

    this.video.addEventListener("loadedmetadata", onMeta);
    this.video.src = this.currentStreamUrl;
    this.video.load();
  }

  seek(timeInSeconds) {
    this.video.currentTime = Math.max(0, Math.min(this.video.duration || 0, timeInSeconds));
    this.saveProgressCache();
    this.handleStateChange();
  }

  showLoading(text = "Loading stream...") {
    if (this.loadingOverlay) {
      if (this.loadingText) this.loadingText.textContent = text;
      this.loadingOverlay.classList.remove("hidden");
    }
  }

  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add("hidden");
    }
  }

  getState() {
    return {
      current_time: this.video.currentTime || 0.0,
      duration: this.video.duration || 0.0,
      is_paused: this.video.paused,
      is_buffering: this.isBuffering,
      waiting_for_slowest: this.waitingForSlowest,
      playback_rate: this.video.playbackRate || this.defaultSpeed
    };
  }

  handleStateChange() {
    this.onStateChange(this.getState());
  }
}

window.PlayerController = PlayerController;
