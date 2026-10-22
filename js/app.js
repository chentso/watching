/**
 * Watch Party Application Main Controller
 */
(function() {
  // 1. Identify Room, Backend Origin & User Profile
  const urlParams = new URLSearchParams(window.location.search);
  const DEFAULT_TUNNEL_ORIGIN = "https://5z774h6f-8000.usw2.devtunnels.ms";
  const isExternalHost = window.location.hostname.endsWith("github.io");
  const BACKEND_ORIGIN = (urlParams.get("backend") || (isExternalHost ? DEFAULT_TUNNEL_ORIGIN : window.location.origin)).replace(/\/+$/, "");

  function apiUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${BACKEND_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
  }

  function apiFetch(path, options = {}) {
    const headers = Object.assign({ "X-Tunnel-Skip-AntiPhishing-Page": "true" }, options.headers || {});
    return fetch(apiUrl(path), Object.assign({}, options, { headers }));
  }

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  let roomId = "main";
  if (pathParts.length >= 2 && pathParts[0] === "room") {
    roomId = pathParts[1];
  } else if (urlParams.get("room")) {
    roomId = urlParams.get("room");
  }

  // Avatar and color presets
  const AVATAR_OPTIONS = [
    // Animals & Creatures
    "🦊", "🐱", "🐶", "🐼", "🐨", "🦁", "🐯", "🐵",
    "🐸", "🐙", "🦄", "🐲", "🦖", "🦉", "🐧", "🐰",
    // Fun Faces & Characters
    "😎", "🤓", "🥳", "🤠", "🤖", "👻", "👽", "👾",
    "🥷", "🧙", "🦸", "🧑‍🚀", "👑", "😺", "😸", "😈",
    // Objects & Symbols
    "🚀", "⭐", "⚡", "🔥", "🌈", "🍿", "🎮", "🍕",
    "🍔", "🍦", "🎨", "🎸", "🎧", "💎", "🔮", "☕"
  ];

  const COLOR_OPTIONS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#6366f1", // Indigo
    "#a855f7", // Violet
    "#84cc16", // Lime
    "#e11d48", // Rose
    "#0284c7", // Sky
    "#d97706", // Gold
    "#22c55e"  // Green
  ];

  function getRandomColor() {
    return COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
  }

  function getRandomAvatar() {
    return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  }

  function safeGet(storage, key, fallback = "") {
    try {
      if (!storage) return fallback;
      return storage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(storage, key, val) {
    try {
      if (storage) storage.setItem(key, val);
    } catch (e) {}
  }

  console.log("🎬 [WatchParty] Client controller initialized v2.2");

  // Load or generate user state per session/tab
  let userId = safeGet(sessionStorage, "wp_user_id");
  if (!userId) {
    userId = "usr_" + Math.random().toString(36).substring(2, 9);
    safeSet(sessionStorage, "wp_user_id", userId);
  }

  // Allow custom name from localStorage if previously saved in profile modal,
  // but generate a unique name per session if no custom name exists
  let customUsername = safeGet(localStorage, "wp_custom_username");
  let username = safeGet(sessionStorage, "wp_username") || customUsername || ("Viewer_" + Math.floor(1000 + Math.random() * 9000));
  safeSet(sessionStorage, "wp_username", username);

  let userColor = safeGet(sessionStorage, "wp_color") || getRandomColor();
  safeSet(sessionStorage, "wp_color", userColor);

  let userAvatar = safeGet(sessionStorage, "wp_avatar") || getRandomAvatar();
  safeSet(sessionStorage, "wp_avatar", userAvatar);

  // Host status is determined strictly by the server
  let isHost = false;

  // Clean up legacy localStorage host keys if present
  try {
    localStorage.removeItem(`wp_is_host_${roomId}`);
  } catch (e) {}

  // Elements
  const elRoomDisplay = document.getElementById("currentRoomDisplay");
  const elRoomPinDisplay = document.getElementById("roomPinDisplay");
  const btnCopyPin = document.getElementById("btnCopyPin");
  const pinModal = document.getElementById("pinModal");
  const inputJoinPin = document.getElementById("inputJoinPin");
  const btnSubmitPin = document.getElementById("btnSubmitPin");
  const pinErrorMsg = document.getElementById("pinErrorMsg");

  const elConnStatus = document.getElementById("connStatus");
  const elUserAvatar = document.getElementById("userAvatarBadge");
  const elUserName = document.getElementById("userNameDisplay");
  const elUserRole = document.getElementById("userRoleBadge");
  const elCopyInvite = document.getElementById("btnCopyInvite");
  const elHostControls = document.getElementById("hostControlsRow");

  const elVideoTitle = document.getElementById("videoTitle");
  const elVideoUploader = document.getElementById("videoUploader");
  const elVideoDuration = document.getElementById("videoDuration");
  const elVideoBvid = document.getElementById("videoBvid");

  const elViewersList = document.getElementById("viewersList");
  const elViewerCount = document.getElementById("viewerListCount");
  const elChatMessages = document.getElementById("chatMessages");
  const elChatForm = document.getElementById("chatForm");
  const elChatInput = document.getElementById("chatInput");
  const elChatEmojiBar = document.getElementById("chatEmojiBar");
  const btnToggleChatEmoji = document.getElementById("btnToggleChatEmoji");
  const emojiContextMenu = document.getElementById("emojiContextMenu");
  const emojiMenuTitle = document.getElementById("emojiMenuTitle");
  const btnCloseEmojiMenu = document.getElementById("btnCloseEmojiMenu");
  const emojiSearchInput = document.getElementById("emojiSearchInput");
  const btnClearEmojiSearch = document.getElementById("btnClearEmojiSearch");
  const emojiCategoryTabs = document.getElementById("emojiCategoryTabs");
  const emojiPickerGrid = document.getElementById("emojiPickerGrid");

  // Video load input
  const elInputVideo = document.getElementById("inputVideoQuery");
  const btnLoadVideo = document.getElementById("btnLoadVideo");
  const elEpisodeGroup = document.getElementById("episodeGroup");
  const elSelectEpisode = document.getElementById("selectEpisode");

  // Player Toolbar Controls
  const btnReloadVideo = document.getElementById("btnReloadVideo");
  const elSelectSpeed = document.getElementById("selectPlaybackSpeed");
  const elSelectQuality = document.getElementById("selectQuality");
  const elSelectHostQuality = document.getElementById("selectHostQuality");
  const elSelectSub = document.getElementById("selectSubtitle");
  const elSelectSubSize = document.getElementById("selectSubSize");
  const elSubOverlay = document.getElementById("subtitleOverlay");
  const elSubText = document.getElementById("subtitleText");
  const theaterContainer = document.getElementById("playerTheaterContainer");

  // Subs History Panel Elements
  const lyricsCard = document.getElementById("lyricsCard");
  const lyricsContainer = document.getElementById("lyricsContainer");
  const btnRecenterLyrics = document.getElementById("btnRecenterLyrics");
  const btnCloseLyrics = document.getElementById("btnCloseLyrics");

  // Room PIN state
  let roomPin = "";
  let pendingPin = urlParams.get("pin") || safeGet(sessionStorage, `wp_pin_${roomId}`) || safeGet(localStorage, `wp_pin_${roomId}`) || "";

  if (elRoomDisplay) elRoomDisplay.textContent = roomId;
  updateUserBadge();

  // 2. Subtitles State & Subs History Logic
  let activeVideoMetadata = null;
  let activeSubtitles = [];
  let currentSubtitleCues = [];
  let activeSubItem = null;
  let activeCueIndex = -1;

  let activeSubtitleLoadSeq = 0;

  async function updateSubtitlesList(subs) {
    activeSubtitles = subs || [];
    if (!elSelectSub) return;

    elSelectSub.innerHTML = '<option value="off">Off (None)</option>';

    if (activeSubtitles.length > 0) {
      activeSubtitles.forEach((s, idx) => {
        const opt = document.createElement("option");
        opt.value = JSON.stringify({ url: s.url, transform: s.transform || "none", name: s.lan_doc || s.lan, lan: s.lan });
        opt.textContent = s.lan_doc || s.lan || `Subtitle ${idx + 1}`;
        elSelectSub.appendChild(opt);
      });

      // Check if user has a preferred subtitle track type (e.g. "en" or "traditional" or "off")
      const savedPref = localStorage.getItem("wp_sub_preference");
      let selectedSub = activeSubtitles[0];
      if (savedPref === "off") {
        elSelectSub.value = "off";
        await loadSubtitleTrack(null);
        return;
      } else if (savedPref) {
        const match = activeSubtitles.find(s => (s.transform && s.transform === savedPref) || (s.lan && s.lan === savedPref) || (s.lan && s.lan.includes(savedPref)));
        if (match) selectedSub = match;
      }

      const selectedVal = JSON.stringify({ url: selectedSub.url, transform: selectedSub.transform || "none", name: selectedSub.lan_doc || selectedSub.lan, lan: selectedSub.lan });
      elSelectSub.value = selectedVal;
      await loadSubtitleTrack(selectedSub.url, selectedSub.transform || "none", selectedSub.lan_doc || selectedSub.lan);
    } else {
      currentSubtitleCues = [];
      activeSubItem = null;
      if (elSubOverlay) elSubOverlay.classList.add("hidden");
      renderLyricsContainer();
    }
  }

  async function loadSubtitleTrack(url, transform = "none", name = "Subtitle") {
    const seq = ++activeSubtitleLoadSeq;
    if (!url || url === "off") {
      currentSubtitleCues = [];
      activeSubItem = null;
      if (elSubOverlay) elSubOverlay.classList.add("hidden");
      renderLyricsContainer();
      return;
    }

    activeSubItem = { url, transform, name };

    try {
      const bvid = (activeVideoMetadata && activeVideoMetadata.bvid) ? activeVideoMetadata.bvid : "";
      const bvidParam = bvid ? `&bvid=${encodeURIComponent(bvid)}` : "";
      const resp = await apiFetch(`/api/subtitles/proxy?url=${encodeURIComponent(url)}&transform=${encodeURIComponent(transform)}&format=json${bvidParam}`);
      if (seq !== activeSubtitleLoadSeq) return;

      if (resp.ok) {
        const rawCues = await resp.json();
        // Ensure cues have valid float timestamps and are strictly sorted chronologically
        currentSubtitleCues = (rawCues || []).map(c => ({
          from: parseFloat(c.from) || 0,
          to: parseFloat(c.to) || 0,
          content: c.content || ""
        })).sort((a, b) => a.from - b.from);
        if (lyricsCard) lyricsCard.classList.remove("hidden");
      } else {
        currentSubtitleCues = [];
      }
    } catch (e) {
      if (seq !== activeSubtitleLoadSeq) return;
      console.warn("Could not load subtitles from proxy:", e);
      currentSubtitleCues = [];
    }
    renderLyricsContainer();
    if (player && player.video) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
  }

  // Subs history scrolling state
  let isUserScrolledAway = false;
  let isProgrammaticScroll = false;

  function updateRecenterButtonState() {
    if (!btnRecenterLyrics) return;
    if (isUserScrolledAway) {
      btnRecenterLyrics.classList.add("scrolled-away");
      btnRecenterLyrics.title = "Playback line is out of view. Click to re-center.";
    } else {
      btnRecenterLyrics.classList.remove("scrolled-away");
      btnRecenterLyrics.title = "Currently following playback. Click to re-center.";
    }
  }

  if (lyricsContainer) {
    const onUserManualScroll = () => {
      if (isProgrammaticScroll) return;
      isUserScrolledAway = true;
      updateRecenterButtonState();
    };

    lyricsContainer.addEventListener("wheel", onUserManualScroll, { passive: true });
    lyricsContainer.addEventListener("touchmove", onUserManualScroll, { passive: true });
    lyricsContainer.addEventListener("mousedown", () => {
      if (!isProgrammaticScroll) {
        isUserScrolledAway = true;
        updateRecenterButtonState();
      }
    });
    lyricsContainer.addEventListener("scroll", () => {
      if (!isProgrammaticScroll) {
        isUserScrolledAway = true;
        updateRecenterButtonState();
      }
    }, { passive: true });
  }

  if (btnRecenterLyrics) {
    btnRecenterLyrics.addEventListener("click", () => {
      isUserScrolledAway = false;
      updateRecenterButtonState();
      scrollSubsToCurrent(true);
    });
  }

  function renderLyricsContainer() {
    if (!lyricsContainer) return;
    lyricsContainer.innerHTML = "";
    activeCueIndex = -1;

    if (!currentSubtitleCues || currentSubtitleCues.length === 0) {
      lyricsContainer.innerHTML = '<div class="lyrics-empty">No subtitles available for this track.</div>';
      return;
    }

    currentSubtitleCues.forEach((cue, idx) => {
      const lineEl = document.createElement("div");
      lineEl.className = "lyrics-line";
      lineEl.id = `lyrics-line-${idx}`;
      lineEl.setAttribute("data-from", cue.from);
      lineEl.setAttribute("data-to", cue.to);
      lineEl.innerHTML = `
        <span class="lyrics-time">${formatTime(cue.from)}</span>
        <span class="lyrics-text">${escapeHtml(cue.content)}</span>
      `;
      lineEl.addEventListener("click", () => {
        player.seek(cue.from);
        isUserScrolledAway = false;
        updateRecenterButtonState();
        scrollSubsToCurrent(true);
      });
      lyricsContainer.appendChild(lineEl);
    });

    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
  }

  function renderSubtitlesAtTime(currentTime) {
    if (!currentSubtitleCues || currentSubtitleCues.length === 0 || !activeSubItem || !elSubOverlay || !elSubText) {
      if (elSubOverlay) elSubOverlay.classList.add("hidden");
      return;
    }

    // 1. Find speaking cue (active speech right now) and anchor cue (current or last-spoken)
    let speakingIdx = -1;
    let anchorIdx = -1;

    for (let i = 0; i < currentSubtitleCues.length; i++) {
      const c = currentSubtitleCues[i];
      if (currentTime >= (c.from - 0.05) && currentTime <= (c.to + 0.15)) {
        speakingIdx = i;
        anchorIdx = i;
        break;
      }
      if (c.from <= currentTime) {
        anchorIdx = i; // Retain last cue spoken prior to currentTime
      } else {
        // Since cues are sorted chronologically, future cues cannot match
        break;
      }
    }

    // 2. Update Video Player Overlay: only show during active speech
    if (speakingIdx !== -1) {
      elSubText.textContent = currentSubtitleCues[speakingIdx].content;
      elSubOverlay.classList.remove("hidden");
    } else {
      elSubOverlay.classList.add("hidden");
    }

    // 3. Synchronize Subs History Viewer:
    // Anchor on speaking cue, or remain anchored on the last spoken cue during pauses.
    // This prevents the position from flashing, dropping, or jumping into the future.
    if (anchorIdx !== activeCueIndex && lyricsContainer) {
      activeCueIndex = anchorIdx;
      const allLines = lyricsContainer.children;
      for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i];
        if (anchorIdx === -1) {
          // Before the first cue has started in the video
          line.className = (i === 0) ? "lyrics-line upcoming" : "lyrics-line";
        } else {
          if (i < anchorIdx) {
            line.className = "lyrics-line past";
          } else if (i === anchorIdx) {
            line.className = "lyrics-line current";
          } else if (i === anchorIdx + 1) {
            line.className = "lyrics-line upcoming";
          } else {
            line.className = "lyrics-line";
          }
        }
      }

      // Always auto-scroll unless the user has manually scrolled away
      if (!isUserScrolledAway) {
        scrollSubsToCurrent(true);
      }
    }
  }

  function scrollSubsToCurrent(smooth = true) {
    if (!lyricsContainer || !lyricsCard || lyricsCard.classList.contains("hidden")) return;
    const targetLine = lyricsContainer.querySelector(".lyrics-line.current") || lyricsContainer.querySelector(".lyrics-line.upcoming");
    if (!targetLine) return;

    // Use invariant offsetTop to calculate stable centered scroll position
    const targetTop = targetLine.offsetTop;
    const containerH = lyricsContainer.clientHeight;
    const lineH = targetLine.clientHeight || 28;
    const newScrollTop = Math.max(0, targetTop - (containerH / 2) + (lineH / 2));

    if (Math.abs(lyricsContainer.scrollTop - newScrollTop) > 4) {
      isProgrammaticScroll = true;
      if (smooth) {
        lyricsContainer.scrollTo({
          top: newScrollTop,
          behavior: "smooth"
        });
      } else {
        lyricsContainer.scrollTop = newScrollTop;
      }
      setTimeout(() => {
        isProgrammaticScroll = false;
      }, 400);
    }
  }

  // 3. Initialize Player Controller & Minimap
  const player = new PlayerController("videoPlayer", {
    onStateChange: (state) => {
      sendProgressUpdate(state);
    }
  });

  const minimap = new Minimap("minimapContainer", {
    onSeek: (percent) => {
      const dur = player.video.duration || 0;
      if (dur > 0) {
        const targetSec = dur * percent;
        player.seek(targetSec);
      }
    }
  });

  // Ensure local user's progress lane is immediately visible on DOM load
  minimap.ensureLocalUserLane(userId, username, userColor, userAvatar, isHost);

  // Local progress ticker for smooth local scrubber bar & subtitles
  if (player && player.video) {
    player.video.addEventListener("timeupdate", () => {
      renderSubtitlesAtTime(player.video.currentTime || 0);
    });
    player.video.addEventListener("seeked", () => {
      renderSubtitlesAtTime(player.video.currentTime || 0);
    });
  }

  setInterval(() => {
    if (player.video) {
      const curTime = player.video.currentTime || 0;
      if (!player.video.paused) {
        const buffered = (player.video.buffered && player.video.buffered.length > 0) ? player.video.buffered.end(player.video.buffered.length - 1) : 0;
        minimap.updateLocalProgress(curTime, player.video.duration, buffered);
      }
      renderSubtitlesAtTime(curTime);
    }
  }, 100);

  // 4. Player Toolbar Event Listeners
  if (btnReloadVideo) {
    btnReloadVideo.addEventListener("click", () => {
      player.reload();
    });
  }

  if (elSelectSpeed) {
    elSelectSpeed.addEventListener("change", (e) => {
      player.setSpeedOverride(e.target.value);
    });
  }

  if (elSelectSub) {
    elSelectSub.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "off") {
        localStorage.setItem("wp_sub_preference", "off");
        loadSubtitleTrack(null);
      } else {
        try {
          const parsed = JSON.parse(val);
          if (parsed.transform && parsed.transform !== "none") {
            localStorage.setItem("wp_sub_preference", parsed.transform);
          } else if (parsed.lan) {
            localStorage.setItem("wp_sub_preference", parsed.lan);
          }
          loadSubtitleTrack(parsed.url, parsed.transform, parsed.name);
        } catch (err) {
          loadSubtitleTrack(val);
        }
      }
    });
  }

  // Close Subs History card
  if (btnCloseLyrics && lyricsCard) {
    btnCloseLyrics.addEventListener("click", () => {
      lyricsCard.classList.add("hidden");
    });
  }

  // Quality Selection (Toolbar & Host panel)
  async function requestQualityChange(targetQn) {
    if (!targetQn) return;
    const qnInt = parseInt(targetQn);
    player.showLoading(`Switching stream quality to ${qnInt}p...`);
    try {
      const resp = await apiFetch(`/api/room/${roomId}/quality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qn: qnInt, user_id: userId })
      });
      const res = await resp.json();
      if (!resp.ok) {
        throw new Error(res.detail || "Failed to switch quality");
      }
    } catch (err) {
      alert("Error changing quality: " + err.message);
      player.hideLoading();
    }
  }

  if (elSelectQuality) {
    elSelectQuality.addEventListener("change", (e) => {
      requestQualityChange(e.target.value);
    });
  }

  if (elSelectHostQuality) {
    elSelectHostQuality.addEventListener("change", (e) => {
      requestQualityChange(e.target.value);
    });
  }

  // Room PIN Verification Handlers
  if (btnSubmitPin) {
    btnSubmitPin.addEventListener("click", () => {
      const pinVal = inputJoinPin ? inputJoinPin.value.trim() : "";
      if (pinVal) {
        pendingPin = pinVal;
        sessionStorage.setItem(`wp_pin_${roomId}`, pendingPin);
        if (pinModal) pinModal.classList.add("hidden");
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "join",
            user_id: userId,
            username: username,
            color: userColor,
            avatar: userAvatar,
            is_host: isHost,
            pin: pendingPin
          }));
        }
      }
    });
  }

  if (inputJoinPin && btnSubmitPin) {
    inputJoinPin.addEventListener("keypress", (e) => {
      if (e.key === "Enter") btnSubmitPin.click();
    });
  }

  if (btnCopyPin) {
    btnCopyPin.addEventListener("click", () => {
      if (roomPin) {
        navigator.clipboard.writeText(roomPin).then(() => {
          const original = btnCopyPin.textContent;
          btnCopyPin.textContent = "✅";
          setTimeout(() => btnCopyPin.textContent = original, 1500);
        });
      }
    });
  }

  if (elSelectSubSize && elSubText) {
    elSelectSubSize.addEventListener("change", (e) => {
      elSubText.style.fontSize = e.target.value;
    });
  }




  // 5. WebSocket Connection & Synchronization
  let socket = null;
  let heartbeatTimer = null;
  let reconnectTimeout = null;

  function connectWebSocket() {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    const wsBase = BACKEND_ORIGIN.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/ws/${roomId}`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setConnectionStatus(true);
      // Join Room with Security PIN
      socket.send(JSON.stringify({
        type: "join",
        user_id: userId,
        username: username,
        color: userColor,
        avatar: userAvatar,
        is_host: isHost,
        pin: pendingPin
      }));

      // Start periodic progress reporting loop
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        sendProgressUpdate(player.getState());
      }, 350);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    socket.onclose = () => {
      setConnectionStatus(false);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      reconnectTimeout = setTimeout(connectWebSocket, 2000);
    };

    socket.onerror = () => {
      setConnectionStatus(false);
    };
  }

  function sendProgressUpdate(state) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "progress",
        user_id: userId,
        current_time: state.current_time,
        duration: state.duration,
        is_paused: state.is_paused,
        is_buffering: state.is_buffering,
        waiting_for_slowest: state.waiting_for_slowest
      }));
    }
  }

  function handleServerMessage(data) {
    switch (data.type) {
      case "error":
        if (data.error_code === "invalid_pin") {
          if (pinModal) {
            pinModal.classList.remove("hidden");
            if (pinErrorMsg) {
              pinErrorMsg.textContent = pendingPin ? "❌ Incorrect PIN. Please enter the valid PIN from host." : "🔒 Please enter the room PIN to join.";
              pinErrorMsg.classList.remove("hidden");
            }
            if (inputJoinPin) {
              inputJoinPin.value = "";
              inputJoinPin.focus();
            }
          }
        }
        break;

      case "room_state":
        if (data.is_host !== undefined) {
          isHost = !!data.is_host;
          updateUserBadge();
        }
        if (data.pin) {
          roomPin = data.pin;
          sessionStorage.setItem(`wp_pin_${roomId}`, roomPin);
          localStorage.setItem(`wp_pin_${roomId}`, roomPin);
          if (elRoomPinDisplay) elRoomPinDisplay.textContent = roomPin;
        }
        if (pinModal) pinModal.classList.add("hidden");
        if (data.video) {
          applyVideoMetadata(data.video);
        }
        if (data.minimap) {
          processMinimapUpdate(data.minimap);
        }
        if (data.chat_messages) {
          elChatMessages.innerHTML = "";
          data.chat_messages.forEach(addChatMessage);
        }
        if (data.config) {
          applyConfigValues(data.config);
        }
        break;

      case "minimap_update":
        if (data.minimap) {
          processMinimapUpdate(data.minimap);
        }
        break;

      case "sync_action":
        if (data.target_user_id === userId) {
          if (data.action === "auto_resume") {
            player.autoResume(data.message);
            addSystemNotification(data.message || "Slowest viewer caught up! Video resumed.");
          }
        }
        break;

      case "video_changed":
        if (data.video) {
          applyVideoMetadata(data.video);
          const streamUrl = apiUrl(data.video.proxy_stream_url);
          if (player.currentStreamUrl !== streamUrl) {
            player.loadSource(streamUrl, data.video);
          }
        }
        if (data.minimap) {
          processMinimapUpdate(data.minimap);
        }
        break;

      case "video_quality_changed":
        if (data.video) {
          applyVideoMetadata(data.video);
          const prevTime = player.video.currentTime || 0;
          const wasPlaying = !player.video.paused;
          player.loadSource(apiUrl(data.video.proxy_stream_url), data.video);
          const onMeta = () => {
            player.video.removeEventListener("loadedmetadata", onMeta);
            if (prevTime > 0) player.video.currentTime = prevTime;
            if (wasPlaying) player.video.play().catch(() => {});
          };
          player.video.addEventListener("loadedmetadata", onMeta);
          addSystemNotification(`Video quality updated to ${formatQualityLabel(data.video.quality)}`);
        }
        break;

      case "chat_message":
        if (data.message) {
          addChatMessage(data.message);
        }
        break;

      case "chat_reaction_update":
        if (data.message_id && data.reactions) {
          renderMessageReactions(data.message_id, data.reactions);
        }
        break;

      case "config_updated":
        if (data.config) {
          applyConfigValues(data.config);
        }
        break;

      case "host_command":
        if (data.command === "seek" && data.target_time !== undefined) {
          player.seek(data.target_time);
        } else if (data.command === "play") {
          player.video.play().catch(() => {});
        } else if (data.command === "pause") {
          player.video.pause();
        }
        break;
    }
  }

  function processMinimapUpdate(minimapData) {
    // 1. Render minimap scrubber
    minimap.render(minimapData, userId);

    // 2. Find self in markers to check dynamic target speed assigned by server
    const markers = minimapData.markers || [];
    const selfMarker = markers.find(m => m.user_id === userId);

    if (selfMarker) {
      if (selfMarker.is_host !== undefined && selfMarker.is_host !== isHost) {
        isHost = !!selfMarker.is_host;
        updateUserBadge();
      }
      if (!player.video.paused) {
        player.applySpeed(selfMarker.target_speed, selfMarker.effective_status);
      }
    }

    // 3. Update viewers list in sidebar
    renderViewersList(markers);
  }

  let lastLeadCalcTime = 0;
  let cachedLeadStatus = new Map(); // userId -> status string

  function calculateViewerLeadStatus(markers) {
    const now = Date.now();
    // Only recalculate lead status once every 1000ms (1 second) to prevent jitter
    if (now - lastLeadCalcTime < 1000 && cachedLeadStatus.size > 0) {
      return cachedLeadStatus;
    }
    lastLeadCalcTime = now;
    cachedLeadStatus.clear();

    if (!markers || markers.length === 0) return cachedLeadStatus;

    const times = markers.map(m => Number(m.current_time) || 0);
    const tMax = Math.max(...times);
    const tMin = Math.min(...times);
    const spread = Math.max(0, tMax - tMin);

    markers.forEach(m => {
      const vTime = Number(m.current_time) || 0;
      const lag = Math.max(0, tMax - vTime);

      // If the spread between clocks is within 2.0s, consider everyone synchronized (no flip-flop)
      if (spread <= 2.0 || lag <= 2.0) {
        cachedLeadStatus.set(m.user_id, spread > 2.0 ? "• Lead" : "• In Sync");
      } else {
        // More than 2 seconds behind leader
        cachedLeadStatus.set(m.user_id, `(-${lag.toFixed(1)}s)`);
      }
    });

    return cachedLeadStatus;
  }

  function renderViewersList(markers) {
    if (!elViewersList) return;
    if (elViewerCount) elViewerCount.textContent = markers.length;
    elViewersList.innerHTML = "";

    const leadStatuses = calculateViewerLeadStatus(markers);

    markers.forEach(m => {
      const isSelf = m.user_id === userId;
      const card = document.createElement("div");
      card.className = `viewer-card ${isSelf ? 'is-self' : ''}`;
      card.style.setProperty("--viewer-color", m.color || "#3b82f6");

      const isBoosted = m.target_speed > (player.defaultSpeed || 1.25);
      let speedClass = "speed-125";
      if (m.waiting_for_slowest) speedClass = "waiting";
      else if (m.is_paused) speedClass = "paused";
      else if (isBoosted) speedClass = "speed-14";
      else if (m.target_speed === 1.0) speedClass = "speed-10";

      let speedLabel = `${m.target_speed}x`;
      if (m.waiting_for_slowest) speedLabel = "⏳ Waiting";
      else if (m.is_paused) speedLabel = "⏸ Paused";
      else if (isBoosted) speedLabel = `🚀 ${m.target_speed}x`;
      else if (m.target_speed === 1.0) speedLabel = "🐢 1.0x";

      const leadLabel = leadStatuses.get(m.user_id) || "• In Sync";

      card.innerHTML = `
        <div class="viewer-card-left">
          <div class="viewer-avatar">${m.avatar || '👤'}</div>
          <div class="viewer-info-col">
            <div class="viewer-name-row">
              <span class="viewer-name">${escapeHtml(m.username)} ${isSelf ? '(You)' : ''}</span>
              ${m.is_host ? '<span class="tag-host" title="Host">👑</span>' : ''}
            </div>
            <span class="viewer-time-sub">${m.formatted_time} ${leadLabel}</span>
          </div>
        </div>
        <div class="viewer-card-right">
          <span class="viewer-status-badge ${speedClass}">${speedLabel}</span>
        </div>
      `;
      elViewersList.appendChild(card);
    });
  }

  const QUALITY_LABELS = {
    127: "8K",
    120: "4K",
    116: "1080p 60fps",
    112: "1080p+",
    80: "1080p",
    74: "720p 60fps",
    64: "720p",
    32: "480p",
    16: "360p"
  };

  function formatQualityLabel(qn, rawDesc) {
    const num = Number(qn);
    if (QUALITY_LABELS[num]) {
      return QUALITY_LABELS[num];
    }
    if (rawDesc) {
      const clean = rawDesc.replace(/[\u4e00-\u9fa5]/g, "").trim();
      if (clean) return clean.toLowerCase();
    }
    return `${qn}p`;
  }

  function updateQualityList(availableQualities, currentQuality) {
    const list = availableQualities && availableQualities.length > 0 ? availableQualities : [
      { qn: 80, desc: "1080p" },
      { qn: 64, desc: "720p" },
      { qn: 32, desc: "480p" },
      { qn: 16, desc: "360p" }
    ];

    [elSelectQuality, elSelectHostQuality].forEach(sel => {
      if (!sel) return;
      sel.innerHTML = "";
      list.forEach(q => {
        const opt = document.createElement("option");
        opt.value = q.qn;
        opt.textContent = formatQualityLabel(q.qn, q.desc);
        if (Number(q.qn) === Number(currentQuality)) {
          opt.selected = true;
        }
        sel.appendChild(opt);
      });
      sel.disabled = false;
      sel.title = isHost ? "Change Room Video Quality (Host)" : "Change Room Video Quality";
    });
  }

  function updateEpisodeList(pages, currentCid, bvid) {
    if (!elEpisodeGroup || !elSelectEpisode) return;
    if (!pages || pages.length <= 1) {
      elEpisodeGroup.classList.add("hidden");
      elSelectEpisode.innerHTML = "";
      return;
    }

    elEpisodeGroup.classList.remove("hidden");
    elSelectEpisode.innerHTML = "";
    pages.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.page;
      opt.textContent = `P${p.page}: ${p.part || `Part ${p.page}`}`;
      if (currentCid && Number(p.cid) === Number(currentCid)) {
        opt.selected = true;
      }
      elSelectEpisode.appendChild(opt);
    });
  }

  function applyVideoMetadata(video) {
    if (!video) return;
    activeVideoMetadata = video;
    elVideoTitle.textContent = video.title || "Untitled Video";
    if (video.bvid && video.bvid !== "custom") {
      elVideoTitle.href = `https://www.bilibili.com/video/${video.bvid}`;
      elVideoTitle.title = `Watch on Bilibili (${video.bvid})`;
    } else {
      elVideoTitle.removeAttribute("href");
      elVideoTitle.removeAttribute("title");
    }

    elVideoUploader.textContent = `Uploader: ${video.uploader || 'Bilibili'}`;
    if (elVideoDuration) elVideoDuration.textContent = `Duration: ${formatTime(video.duration || 0)}`;

    if (elVideoBvid) {
      elVideoBvid.innerHTML = "";
    }

    if (!player.video.src || player.video.src === "" || player.video.src === window.location.href) {
      player.loadSource(apiUrl(video.proxy_stream_url), video);
    }

    // Populate qualities list
    updateQualityList(video.available_qualities, video.quality);

    // Populate episodes list if multi-part
    updateEpisodeList(video.pages, video.cid, video.bvid);

    // Populate subtitles if present
    updateSubtitlesList(video.subtitles || []);
  }

  // =========================================
  // Chat Emoji Bar, Picker Context Menu & Message Reactions
  // =========================================
  const QUICK_CHAT_EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "👏", "🎉", "🍿", "😮", "😭"];

  const EMOJI_CATEGORIES = [
    {
      name: "Smileys",
      icon: "😃",
      emojis: [
        { char: "😀", name: "grinning face smile happy" },
        { char: "😃", name: "smiling face with big eyes" },
        { char: "😄", name: "grinning face with smiling eyes" },
        { char: "😁", name: "beaming face grin" },
        { char: "😆", name: "laughing squinting haha" },
        { char: "😅", name: "sweat smile phew" },
        { char: "😂", name: "face with tears of joy lol haha" },
        { char: "🤣", name: "rolling on floor laughing rofl lmao" },
        { char: "🥲", name: "smiling tear grateful" },
        { char: "🥹", name: "face holding back tears emotional touching" },
        { char: "😊", name: "smiling blush warm" },
        { char: "😇", name: "innocent halo angel" },
        { char: "🙂", name: "slightly smiling face" },
        { char: "🙃", name: "upside down sarcastic" },
        { char: "😉", name: "winking face wink" },
        { char: "😌", name: "relieved peace calm" },
        { char: "😍", name: "heart eyes love crush" },
        { char: "🥰", name: "smiling hearts lovely" },
        { char: "😘", name: "kiss blow kiss" },
        { char: "😋", name: "delicious yummy food" },
        { char: "😛", name: "tongue cheeky" },
        { char: "😜", name: "winking tongue crazy" },
        { char: "🤪", name: "zany wacky goofy" },
        { char: "😝", name: "squinting tongue playful" },
        { char: "🤑", name: "money mouth rich cash" },
        { char: "🤗", name: "hugging open hands" },
        { char: "🤭", name: "hand over mouth giggle oops" },
        { char: "🤫", name: "shushing quiet silence secret" },
        { char: "🤔", name: "thinking hmm ponder" },
        { char: "🫡", name: "saluting respect salute" },
        { char: "🤐", name: "zipper mouth silent" },
        { char: "🤨", name: "raised eyebrow skeptic suspect" },
        { char: "😐", name: "neutral face meh whatever" },
        { char: "😑", name: "expressionless blank" },
        { char: "😶", name: "face without mouth silent" },
        { char: "😏", name: "smirking sly sexy" },
        { char: "😒", name: "unamused bored unimpressed" },
        { char: "🙄", name: "rolling eyes eyeroll whatever" },
        { char: "😬", name: "grimacing awkward oof" },
        { char: "😮‍💨", name: "exhaling sigh relief tired" },
        { char: "🤥", name: "lying pinocchio cap lie" },
        { char: "😔", name: "pensive sad down" },
        { char: "😪", name: "sleepy drool tired" },
        { char: "🤤", name: "drooling delicious hungry" },
        { char: "😴", name: "sleeping zzz goodnight" },
        { char: "😷", name: "mask medical covid sick" },
        { char: "🤒", name: "thermometer fever ill" },
        { char: "🤕", name: "head bandage hurt ouch" },
        { char: "🤢", name: "nauseated gross disgust" },
        { char: "🤮", name: "vomiting barf puke ew" },
        { char: "🤧", name: "sneezing bless you cold" },
        { char: "🥵", name: "hot face sweating spicy heat" },
        { char: "🥶", name: "cold face freezing ice chilly" },
        { char: "🥴", name: "woozy drunk tipsy dizzy" },
        { char: "😵", name: "dizzy knock out faint" },
        { char: "🤯", name: "exploding head mind blown boom" },
        { char: "🤠", name: "cowboy yeehaw western" },
        { char: "🥳", name: "partying celebration yay party" },
        { char: "😎", name: "cool sunglasses badass" },
        { char: "🤓", name: "nerd geek smart dork" },
        { char: "🧐", name: "monocle fancy examine" },
        { char: "😕", name: "confused huh" },
        { char: "😟", name: "worried anxious concern" },
        { char: "🙁", name: "frowning sad" },
        { char: "😮", name: "open mouth wow surprise" },
        { char: "😯", name: "hushed astonished" },
        { char: "😲", name: "astonished shocked omg" },
        { char: "😳", name: "flushed blush embarrass shocked" },
        { char: "🥺", name: "pleading puppy eyes please" },
        { char: "😦", name: "frowning open mouth dismay" },
        { char: "😧", name: "anguished what" },
        { char: "😨", name: "fearful scared afraid" },
        { char: "😰", name: "anxious sweat nervous panic" },
        { char: "😥", name: "sad relieved close call" },
        { char: "😢", name: "crying sad tear weeping" },
        { char: "😭", name: "loudly crying bawling sob" },
        { char: "😱", name: "screaming horrified terror omg" },
        { char: "😖", name: "confounded frustrated" },
        { char: "😣", name: "persevering struggle" },
        { char: "😞", name: "disappointed bummer" },
        { char: "😓", name: "sweat tired difficult" },
        { char: "😩", name: "weary groan ugh" },
        { char: "😫", name: "tired fed up exhausted" },
        { char: "🥱", name: "yawning bored sleepy" },
        { char: "😤", name: "triumph proud snort" },
        { char: "😡", name: "pouting rage angry mad" },
        { char: "😠", name: "angry mad furious" },
        { char: "🤬", name: "swearing cursing toxic" },
        { char: "😈", name: "devil smile mischievous bad" },
        { char: "👿", name: "angry devil imp" },
        { char: "💀", name: "skull dead ded deadass rip" },
        { char: "☠️", name: "skull crossbones danger" },
        { char: "💩", name: "poop pile crap funny" },
        { char: "🤡", name: "clown bozo funny joke" },
        { char: "👻", name: "ghost spooky boo" },
        { char: "👽", name: "alien extraterrestrial ufo" },
        { char: "🤖", name: "robot bot machine tech" }
      ]
    },
    {
      name: "Gestures",
      icon: "👍",
      emojis: [
        { char: "👋", name: "waving hand hi bye hello" },
        { char: "🤚", name: "raised back of hand" },
        { char: "🖐️", name: "hand splayed fingers" },
        { char: "✋", name: "raised hand high five stop" },
        { char: "🖖", name: "vulcan salute spock live long" },
        { char: "👌", name: "ok hand okay perfect zero" },
        { char: "🤌", name: "pinched fingers italian what do you want" },
        { char: "🤏", name: "pinching hand small little tiny bit" },
        { char: "✌️", name: "peace victory two" },
        { char: "🤞", name: "crossed fingers good luck hope" },
        { char: "🫰", name: "hand finger heart love korean" },
        { char: "🤟", name: "love-you ily rock" },
        { char: "🤘", name: "horns rock metal hardcore" },
        { char: "🤙", name: "call me shaka hang loose" },
        { char: "👈", name: "pointing left that" },
        { char: "👉", name: "pointing right this" },
        { char: "👆", name: "pointing up look above" },
        { char: "👇", name: "pointing down below link" },
        { char: "☝️", name: "index up one point listen" },
        { char: "👍", name: "thumbs up like yes agree +1 approve" },
        { char: "👎", name: "thumbs down dislike no -1 reject" },
        { char: "✊", name: "raised fist power solidarity" },
        { char: "👊", name: "fist bump punch bro" },
        { char: "👏", name: "clapping hands applause cheer clap bravo" },
        { char: "🙌", name: "raising hands praise hooray celebration" },
        { char: "👐", name: "open hands hug" },
        { char: "🤲", name: "palms up praying offer" },
        { char: "🤝", name: "handshake agree deal partnership" },
        { char: "🙏", name: "folded hands please pray thank you thanks" },
        { char: "✍️", name: "writing hand note pen author" },
        { char: "💪", name: "flexed biceps muscle strong power flex" },
        { char: "👀", name: "eyes looking look see watch peek" },
        { char: "👁️", name: "eye vision look" },
        { char: "🧠", name: "brain mind genius smart big brain" },
        { char: "🫂", name: "people hugging comfort support" }
      ]
    },
    {
      name: "Hearts & Symbols",
      icon: "❤️",
      emojis: [
        { char: "❤️", name: "red heart love favorite" },
        { char: "🧡", name: "orange heart" },
        { char: "💛", name: "yellow heart" },
        { char: "💚", name: "green heart" },
        { char: "💙", name: "blue heart bilibili" },
        { char: "💜", name: "purple heart" },
        { char: "🖤", name: "black heart" },
        { char: "🤍", name: "white heart" },
        { char: "🤎", name: "brown heart" },
        { char: "💔", name: "broken heart sad sorrow heartbreak" },
        { char: "❤️‍🔥", name: "heart on fire passion hot love" },
        { char: "❤️‍🩹", name: "mending heart healing recovering" },
        { char: "❣️", name: "heart exclamation mark" },
        { char: "💕", name: "two hearts love" },
        { char: "💞", name: "revolving hearts" },
        { char: "💓", name: "beating heart heartbeat" },
        { char: "💗", name: "growing heart affection" },
        { char: "💖", name: "sparkling heart sparkle shine" },
        { char: "💘", name: "cupid arrow heart romance" },
        { char: "💝", name: "ribbon gift heart" },
        { char: "✨", name: "sparkles shiny magical stars glitter" },
        { char: "⭐", name: "star favorite rating gold" },
        { char: "🌟", name: "glowing star shine bright" },
        { char: "💫", name: "dizzy star shooting sparkle" },
        { char: "💥", name: "collision boom explosion blast bang" },
        { char: "💢", name: "anger sign annoyed anime" },
        { char: "💯", name: "hundred points 100 percent keep it real perfect" },
        { char: "🔥", name: "fire flame lit hype hot awesome" },
        { char: "⚡", name: "lightning bolt fast shock electric" },
        { char: "🎉", name: "party popper tada congrats celebration hooray" },
        { char: "🎊", name: "confetti ball party celebrate" },
        { char: "🏆", name: "trophy championship winner #1 gold" },
        { char: "🥇", name: "1st medal first place gold" },
        { char: "🎯", name: "bullseye target exact accurate direct hit" },
        { char: "✔️", name: "check mark correct yes pass" },
        { char: "❌", name: "cross mark wrong no fail x" },
        { char: "❓", name: "question mark question help wonder" },
        { char: "❗", name: "exclamation mark alert notice warn" }
      ]
    },
    {
      name: "Food & Cinema",
      icon: "🍿",
      emojis: [
        { char: "🍿", name: "popcorn movie theater cinema cinema snack" },
        { char: "🍕", name: "pizza slice cheese pepperoni food" },
        { char: "🍔", name: "hamburger burger fast food" },
        { char: "🍟", name: "french fries fries potato" },
        { char: "🌭", name: "hot dog sausage" },
        { char: "🥪", name: "sandwich bread lunch" },
        { char: "🌮", name: "taco mexican street food" },
        { char: "🌯", name: "burrito wrap mexican" },
        { char: "🍜", name: "steaming bowl ramen noodles soup" },
        { char: "🍲", name: "pot of food hotpot soup stew" },
        { char: "🍣", name: "sushi japanese fish roll" },
        { char: "🍱", name: "bento box lunch japanese" },
        { char: "🥟", name: "dumpling potsticker gyoza dimsum" },
        { char: "🍦", name: "soft ice cream dessert dairy sweet cone" },
        { char: "🍧", name: "shaved ice dessert sweet" },
        { char: "🍨", name: "ice cream bowl gelato" },
        { char: "🍩", name: "doughnut donut sweet pastry" },
        { char: "🍪", name: "cookie biscuit chocolate chip" },
        { char: "🎂", name: "birthday cake celebration party slice" },
        { char: "🍰", name: "shortcake cake strawberry dessert" },
        { char: "🍫", name: "chocolate bar sweet candy" },
        { char: "🍬", name: "candy sweet treat" },
        { char: "🍭", name: "lollipop sweet suck" },
        { char: "🍮", name: "custard pudding flan dessert" },
        { char: "☕", name: "hot beverage coffee cafe tea morning" },
        { char: "🍵", name: "teacup green tea matcha herbal" },
        { char: "🧋", name: "bubble tea boba milk tea tapioca" },
        { char: "🥤", name: "cup with straw soda soft drink beverage" },
        { char: "🍺", name: "beer mug drink alcohol pub cheers" },
        { char: "🍻", name: "clinking beer mugs cheers toast pub" },
        { char: "🥂", name: "clinking glasses champagne toast celebration" },
        { char: "🍷", name: "wine glass red alcohol drink" },
        { char: "🍸", name: "cocktail martini olive drink" },
        { char: "🍹", name: "tropical drink cocktail summer beach" },
        { char: "🍾", name: "bottle with popping cork champagne party celebrate" }
      ]
    },
    {
      name: "Objects & Fun",
      icon: "🚀",
      emojis: [
        { char: "🚀", name: "rocket spaceship blastoff fast speed moon" },
        { char: "🛸", name: "flying saucer alien ufo sci-fi" },
        { char: "🎮", name: "video game controller gaming play gamer console" },
        { char: "🕹️", name: "joystick retro gaming arcade" },
        { char: "🎲", name: "game die dice roll chance boardgame" },
        { char: "🎵", name: "musical note tune audio sound" },
        { char: "🎶", name: "musical notes melody song music" },
        { char: "🎤", name: "microphone sing vocal karaoke podcast" },
        { char: "🎧", name: "headphone listening sound music track" },
        { char: "🎸", name: "guitar rock concert instrument electric" },
        { char: "🎹", name: "musical keyboard piano keys classical" },
        { char: "🥁", name: "drum percussion beat rhythm" },
        { char: "📱", name: "mobile phone smartphone tech screen" },
        { char: "💻", name: "laptop computer notebook pc device" },
        { char: "🖥️", name: "desktop computer monitor screen pc" },
        { char: "📷", name: "camera photography picture photo snap" },
        { char: "📹", name: "video camera film camcorder recording" },
        { char: "📼", name: "videocassette vhs tape retro movie" },
        { char: "🔍", name: "magnifying glass search find zoom look" },
        { char: "💡", name: "light bulb idea smart bright eureka" },
        { char: "🏮", name: "red paper lantern festival light asian" },
        { char: "💰", name: "money bag cash wealth dollar bag" },
        { char: "💎", name: "gem stone diamond crystal shiny valuable" },
        { char: "🎁", name: "wrapped gift present box surprise celebration" },
        { char: "🎈", name: "balloon birthday party celebration float" },
        { char: "🔮", name: "crystal ball fortune future psychic magic" },
        { char: "🪄", name: "magic wand wizard spell magical" },
        { char: "🔔", name: "bell notification alert ring chime" },
        { char: "🔕", name: "bell with slash mute silent quiet" },
        { char: "📣", name: "megaphone cheer announce shout cheer" },
        { char: "📢", name: "loudspeaker broadcast announcement news" },
        { char: "⏳", name: "hourglass sand time ticking timer countdown" },
        { char: "⌛", name: "hourglass done time over timeout" },
        { char: "⏰", name: "alarm clock morning wake up time ring" },
        { char: "🛡️", name: "shield defense protect armor safety" },
        { char: "⚔️", name: "crossed swords fight battle weapon duel" }
      ]
    },
    {
      name: "Animals & Nature",
      icon: "🐶",
      emojis: [
        { char: "🐶", name: "dog face puppy pet cute doggo" },
        { char: "🐱", name: "cat face kitten pet kitty meow cute" },
        { char: "🐭", name: "mouse face rodent cheese" },
        { char: "🐹", name: "hamster face cute rodent pet" },
        { char: "🐰", name: "rabbit face bunny cute easter" },
        { char: "🦊", name: "fox face clever sneaky orange" },
        { char: "🐻", name: "bear face grizzly teddy cute" },
        { char: "🐼", name: "panda face bear bamboo cute" },
        { char: "🐨", name: "koala bear marsupial australia cute" },
        { char: "🐯", name: "tiger face wild cat roar stripes" },
        { char: "🦁", name: "lion face king wild jungle roar" },
        { char: "🐮", name: "cow face beef milk moo" },
        { char: "🐷", name: "pig face oink bacon pork cute" },
        { char: "🐸", name: "frog face toad ribbit pepe animal" },
        { char: "🐵", name: "monkey face primate ape cute" },
        { char: "🐔", name: "chicken bird rooster cluck farm" },
        { char: "🐧", name: "penguin bird cold antarctica waddle" },
        { char: "🐦", name: "bird tweet fly chirp avian" },
        { char: "🦆", name: "duck bird quack pond waterfowl" },
        { char: "🦅", name: "eagle bird raptor usa freedom" },
        { char: "🦉", name: "owl bird wise nocturnal night" },
        { char: "🐺", name: "wolf face wild howl predator" },
        { char: "🐴", name: "horse face stallion farm ride" },
        { char: "🦄", name: "unicorn mythical fantasy magic rainbow" },
        { char: "🐝", name: "honeybee bee insect honey buzz" },
        { char: "🦋", name: "butterfly insect wings pretty nature" },
        { char: "🌸", name: "cherry blossom sakura flower pink spring" },
        { char: "🌹", name: "rose flower red romance love petal" },
        { char: "🌺", name: "hibiscus flower tropical summer" },
        { char: "🌻", name: "sunflower yellow flower summer sun" },
        { char: "🌼", name: "blossom yellow flower bloom" },
        { char: "🌱", name: "seedling sprout plant grow nature green" },
        { char: "🌲", name: "evergreen tree pine forest nature christmas" },
        { char: "🌴", name: "palm tree tropical island beach summer" },
        { char: "🍀", name: "four leaf clover lucky fortune ireland st patrick" },
        { char: "🍁", name: "maple leaf autumn fall orange nature" }
      ]
    }
  ];

  let activeEmojiTarget = null; // { targetType: "chatInput" | "messageReaction", messageId?: string, anchorEl?: HTMLElement, x?: number, y?: number }
  let activeEmojiTab = 0;

  function insertEmojiAtCursor(emoji) {
    if (!elChatInput) return;
    const start = elChatInput.selectionStart !== null ? elChatInput.selectionStart : elChatInput.value.length;
    const end = elChatInput.selectionEnd !== null ? elChatInput.selectionEnd : elChatInput.value.length;
    const val = elChatInput.value;
    elChatInput.value = val.substring(0, start) + emoji + val.substring(end);
    const newPos = start + emoji.length;
    elChatInput.setSelectionRange(newPos, newPos);
    elChatInput.focus();
  }

  function initChatEmojiBar() {
    if (!elChatEmojiBar) return;
    elChatEmojiBar.innerHTML = "";
    QUICK_CHAT_EMOJIS.forEach(emoji => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-emoji-quick";
      btn.textContent = emoji;
      btn.title = `Insert ${emoji}`;
      btn.addEventListener("click", () => {
        insertEmojiAtCursor(emoji);
      });
      elChatEmojiBar.appendChild(btn);
    });

    const btnMore = document.createElement("button");
    btnMore.type = "button";
    btnMore.className = "btn-emoji-quick btn-emoji-more";
    btnMore.textContent = "➕";
    btnMore.title = "More emojis...";
    btnMore.addEventListener("click", (e) => {
      e.stopPropagation();
      openEmojiPicker({
        targetType: "chatInput",
        anchorEl: btnMore
      });
    });
    elChatEmojiBar.appendChild(btnMore);
  }

  function openEmojiPicker(options) {
    activeEmojiTarget = options;
    if (!emojiContextMenu) return;

    if (emojiMenuTitle) {
      emojiMenuTitle.textContent = options.targetType === "messageReaction" ? "React to message" : "Insert Emoji";
    }

    emojiContextMenu.classList.remove("hidden");

    let top = 100;
    let left = 100;
    const menuW = 320;
    const menuH = 400;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    if (options.x !== undefined && options.y !== undefined) {
      left = options.x;
      top = options.y;
    } else if (options.anchorEl) {
      const rect = options.anchorEl.getBoundingClientRect();
      if (rect.top - menuH - 8 > 0) {
        top = rect.top - menuH - 8;
      } else {
        top = rect.bottom + 8;
      }
      left = rect.right - menuW;
    }

    // Clamping within viewport
    left = Math.max(10, Math.min(vpW - menuW - 10, left));
    top = Math.max(10, Math.min(vpH - menuH - 10, top));

    emojiContextMenu.style.left = `${left}px`;
    emojiContextMenu.style.top = `${top}px`;

    if (emojiSearchInput) {
      emojiSearchInput.value = "";
      if (btnClearEmojiSearch) btnClearEmojiSearch.classList.add("hidden");
      setTimeout(() => emojiSearchInput.focus(), 50);
    }

    renderEmojiTabsAndGrid(activeEmojiTab, "");
  }

  function closeEmojiPicker() {
    if (!emojiContextMenu) return;
    emojiContextMenu.classList.add("hidden");
    activeEmojiTarget = null;
  }

  function handleEmojiSelected(emoji) {
    if (!activeEmojiTarget) {
      insertEmojiAtCursor(emoji);
      closeEmojiPicker();
      return;
    }

    if (activeEmojiTarget.targetType === "messageReaction" && activeEmojiTarget.messageId) {
      toggleMessageReaction(activeEmojiTarget.messageId, emoji);
    } else {
      insertEmojiAtCursor(emoji);
    }
    closeEmojiPicker();
  }

  function renderEmojiTabsAndGrid(categoryIndex = null, searchQuery = "") {
    if (!emojiCategoryTabs || !emojiPickerGrid) return;

    if (categoryIndex !== null) {
      activeEmojiTab = categoryIndex;
    }

    const query = (searchQuery || "").trim().toLowerCase();

    // 1. Category Tabs
    emojiCategoryTabs.innerHTML = "";
    if (!query) {
      emojiCategoryTabs.style.display = "flex";
      EMOJI_CATEGORIES.forEach((cat, idx) => {
        const tabBtn = document.createElement("button");
        tabBtn.type = "button";
        tabBtn.className = `emoji-cat-tab ${idx === activeEmojiTab ? 'active' : ''}`;
        tabBtn.textContent = cat.icon;
        tabBtn.title = cat.name;
        tabBtn.addEventListener("click", () => {
          renderEmojiTabsAndGrid(idx, "");
        });
        emojiCategoryTabs.appendChild(tabBtn);
      });
    } else {
      emojiCategoryTabs.style.display = "none";
    }

    // 2. Emoji Grid
    emojiPickerGrid.innerHTML = "";

    if (query) {
      let matchCount = 0;
      EMOJI_CATEGORIES.forEach(cat => {
        cat.emojis.forEach(item => {
          if (item.name.toLowerCase().includes(query) || item.char === query) {
            matchCount++;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "emoji-grid-btn";
            btn.textContent = item.char;
            btn.title = item.name;
            btn.addEventListener("click", () => {
              handleEmojiSelected(item.char);
            });
            emojiPickerGrid.appendChild(btn);
          }
        });
      });

      if (matchCount === 0) {
        const empty = document.createElement("div");
        empty.className = "emoji-empty-search";
        empty.textContent = `No emojis found for "${query}"`;
        emojiPickerGrid.appendChild(empty);
      }
    } else {
      const cat = EMOJI_CATEGORIES[activeEmojiTab] || EMOJI_CATEGORIES[0];
      const header = document.createElement("div");
      header.className = "emoji-section-header";
      header.textContent = `${cat.icon} ${cat.name}`;
      emojiPickerGrid.appendChild(header);

      cat.emojis.forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "emoji-grid-btn";
        btn.textContent = item.char;
        btn.title = item.name;
        btn.addEventListener("click", () => {
          handleEmojiSelected(item.char);
        });
        emojiPickerGrid.appendChild(btn);
      });
    }
  }

  function toggleMessageReaction(messageId, emoji) {
    if (!messageId || !emoji || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({
      type: "chat_reaction",
      message_id: messageId,
      emoji: emoji,
      user_id: userId
    }));
  }

  function renderMessageReactions(messageId, reactions) {
    const container = document.getElementById(`reactions-${messageId}`);
    if (!container) return;
    container.innerHTML = "";

    if (!reactions) return;

    for (const [emoji, userList] of Object.entries(reactions)) {
      if (!userList || userList.length === 0) continue;

      const isMyReaction = userList.includes(userId);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `reaction-chip ${isMyReaction ? 'active' : ''}`;
      chip.setAttribute("data-emoji", emoji);
      chip.title = `${userList.length} reaction${userList.length > 1 ? 's' : ''}`;
      chip.innerHTML = `
        <span class="reaction-emoji">${emoji}</span>
        <span class="reaction-count">${userList.length}</span>
      `;
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMessageReaction(messageId, emoji);
      });
      container.appendChild(chip);
    }
  }

  function formatTimeOfDay(ts) {
    if (!ts) return "";
    const d = new Date(ts > 1e11 ? ts : ts * 1000);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  function addChatMessage(msg) {
    if (msg.is_system) {
      const item = document.createElement("div");
      item.className = "chat-activity-log";
      item.textContent = msg.text;
      elChatMessages.appendChild(item);
    } else {
      const isSelf = (msg.user_id === userId);
      const row = document.createElement("div");
      row.className = `chat-bubble-row ${isSelf ? 'self' : 'other'}`;
      row.id = `chat-msg-${msg.id}`;
      row.setAttribute("data-msg-id", msg.id);

      const timeStr = formatTimeOfDay(msg.timestamp);

      row.innerHTML = `
        <div class="chat-bubble-meta">
          <span class="chat-bubble-avatar" style="background-color: ${msg.color || '#3b82f6'}25; border: 1.5px solid ${msg.color || '#3b82f6'};" title="${isSelf ? 'You' : 'Viewer'}">
            ${msg.avatar || '👤'}
          </span>
          ${isSelf ? '<span class="chat-self-badge">You</span>' : ''}
          ${timeStr ? `<span class="chat-bubble-time">${timeStr}</span>` : ''}
        </div>
        <div class="chat-bubble-content-wrap">
          <div class="chat-bubble ${isSelf ? 'self' : 'other'}">
            <span class="chat-bubble-text">${escapeHtml(msg.text)}</span>
          </div>
          <div class="chat-reaction-actions">
            <button type="button" class="btn-quick-react" data-emoji="👍" title="Thumbs up">👍</button>
            <button type="button" class="btn-quick-react" data-emoji="❤️" title="Heart">❤️</button>
            <button type="button" class="btn-quick-react" data-emoji="😂" title="Laugh">😂</button>
            <button type="button" class="btn-quick-react" data-emoji="🔥" title="Fire">🔥</button>
            <button type="button" class="btn-open-react-menu" title="All emojis...">➕</button>
          </div>
        </div>
        <div class="chat-reactions-row" id="reactions-${msg.id}"></div>
      `;

      // Quick react action clicks
      row.querySelectorAll(".btn-quick-react").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleMessageReaction(msg.id, btn.getAttribute("data-emoji"));
        });
      });

      // '+' button click opens full emoji context menu
      const btnMore = row.querySelector(".btn-open-react-menu");
      if (btnMore) {
        btnMore.addEventListener("click", (e) => {
          e.stopPropagation();
          openEmojiPicker({
            targetType: "messageReaction",
            messageId: msg.id,
            anchorEl: btnMore
          });
        });
      }

      // Right-click contextmenu on the message bubble opens full emoji menu
      const bubbleEl = row.querySelector(".chat-bubble");
      if (bubbleEl) {
        bubbleEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openEmojiPicker({
            targetType: "messageReaction",
            messageId: msg.id,
            x: e.clientX,
            y: e.clientY
          });
        });
      }

      elChatMessages.appendChild(row);

      // Render existing reactions if present
      if (msg.reactions) {
        renderMessageReactions(msg.id, msg.reactions);
      }
    }

    elChatMessages.scrollTop = elChatMessages.scrollHeight;
  }

  function addSystemNotification(text) {
    addChatMessage({
      is_system: true,
      text: `📢 ${text}`
    });
  }

  // 6. Video Loading API call
  async function loadVideo(query, isCustom = false) {
    if (!query) return;
    player.showLoading(`Resolving video: ${query}...`);
    try {
      const resp = await apiFetch(`/api/room/${roomId}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, is_custom: isCustom })
      });

      const result = await resp.json();
      if (!resp.ok) {
        throw new Error(result.detail || "Failed to load video");
      }
      if (result.video) {
        applyVideoMetadata(result.video);
        player.loadSource(apiUrl(result.video.proxy_stream_url), result.video);
      }
      if (elInputVideo) elInputVideo.value = "";
      addSystemNotification(`Loaded: ${result.video.title}`);
    } catch (err) {
      alert("Error loading video: " + err.message);
      player.hideLoading();
    }
  }

  if (btnLoadVideo) {
    btnLoadVideo.addEventListener("click", () => {
      if (elInputVideo) loadVideo(elInputVideo.value.trim());
    });
  }

  if (elInputVideo) {
    elInputVideo.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        loadVideo(elInputVideo.value.trim());
      }
    });
  }

  if (elSelectEpisode) {
    elSelectEpisode.addEventListener("change", (e) => {
      const pageNum = e.target.value;
      if (activeVideoMetadata && activeVideoMetadata.bvid && activeVideoMetadata.bvid !== "custom") {
        loadVideo(`https://www.bilibili.com/video/${activeVideoMetadata.bvid}?p=${pageNum}`);
      }
    });
  }

  // 7. Host Emergency Controls
  const btnHostPlay = document.getElementById("btnHostPlayAll");
  if (btnHostPlay) {
    btnHostPlay.addEventListener("click", () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "host_control",
          user_id: userId,
          command: "play"
        }));
      }
    });
  }

  const btnHostPause = document.getElementById("btnHostPauseAll");
  if (btnHostPause) {
    btnHostPause.addEventListener("click", () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "host_control",
          user_id: userId,
          command: "pause"
        }));
      }
    });
  }

  const btnHostSync = document.getElementById("btnHostSyncAll");
  if (btnHostSync) {
    btnHostSync.addEventListener("click", () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "host_control",
          user_id: userId,
          command: "seek",
          target_time: (player && player.video) ? (player.video.currentTime || 0) : 0
        }));
      }
    });
  }

  // 8. Chat Submission & Emoji Picker
  initChatEmojiBar();

  if (btnToggleChatEmoji) {
    btnToggleChatEmoji.addEventListener("click", (e) => {
      e.stopPropagation();
      if (emojiContextMenu && !emojiContextMenu.classList.contains("hidden") && activeEmojiTarget?.targetType === "chatInput") {
        closeEmojiPicker();
      } else {
        openEmojiPicker({
          targetType: "chatInput",
          anchorEl: btnToggleChatEmoji
        });
      }
    });
  }

  if (emojiSearchInput) {
    emojiSearchInput.addEventListener("input", () => {
      const q = emojiSearchInput.value;
      if (btnClearEmojiSearch) {
        if (q.length > 0) btnClearEmojiSearch.classList.remove("hidden");
        else btnClearEmojiSearch.classList.add("hidden");
      }
      renderEmojiTabsAndGrid(null, q);
    });
  }

  if (btnClearEmojiSearch) {
    btnClearEmojiSearch.addEventListener("click", () => {
      if (emojiSearchInput) {
        emojiSearchInput.value = "";
        btnClearEmojiSearch.classList.add("hidden");
        emojiSearchInput.focus();
        renderEmojiTabsAndGrid(null, "");
      }
    });
  }

  if (btnCloseEmojiMenu) {
    btnCloseEmojiMenu.addEventListener("click", closeEmojiPicker);
  }

  document.addEventListener("click", (e) => {
    if (!emojiContextMenu || emojiContextMenu.classList.contains("hidden")) return;
    if (!emojiContextMenu.contains(e.target) && !e.target.closest(".btn-emoji-trigger") && !e.target.closest(".btn-open-react-menu")) {
      closeEmojiPicker();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && emojiContextMenu && !emojiContextMenu.classList.contains("hidden")) {
      closeEmojiPicker();
    }
  });

  if (elChatForm) {
    elChatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = elChatInput ? elChatInput.value.trim() : "";
      if (text && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "chat",
          user_id: userId,
          text: text
        }));
        if (elChatInput) elChatInput.value = "";
      }
    });
  }

  // 9. Copy Invite Link with PIN
  if (elCopyInvite) {
    elCopyInvite.addEventListener("click", () => {
      const inviteUrl = `${window.location.origin}/room/${roomId}${roomPin ? `?pin=${roomPin}` : ''}`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        const originalText = elCopyInvite.textContent;
        elCopyInvite.textContent = "✅";
        setTimeout(() => elCopyInvite.textContent = originalText, 1500);
      });
    });
  }

  // 10. User Profile Modal (Avatar & Color)
  const profileModal = document.getElementById("profileModal");
  const btnEditProfile = document.getElementById("btnEditProfile");
  const btnCloseProfile = document.getElementById("btnCloseProfileModal");
  const btnSaveProfile = document.getElementById("btnSaveProfile");
  const avatarPickerGrid = document.getElementById("avatarPickerGrid");
  const colorPickerGrid = document.getElementById("colorPickerGrid");
  const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");

  let selectedAvatar = userAvatar;
  let selectedColor = userColor;

  function updateProfilePreview() {
    if (profilePreviewAvatar) {
      profilePreviewAvatar.textContent = selectedAvatar;
      profilePreviewAvatar.style.borderColor = selectedColor;
      profilePreviewAvatar.style.backgroundColor = `${selectedColor}22`;
      profilePreviewAvatar.style.boxShadow = `0 0 16px ${selectedColor}44`;
    }
  }

  function renderAvatarPicker() {
    if (!avatarPickerGrid) return;
    avatarPickerGrid.innerHTML = "";
    AVATAR_OPTIONS.forEach(emoji => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `avatar-btn ${emoji === selectedAvatar ? 'active' : ''}`;
      btn.textContent = emoji;
      btn.addEventListener("click", () => {
        avatarPickerGrid.querySelectorAll(".avatar-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedAvatar = emoji;
        updateProfilePreview();
      });
      avatarPickerGrid.appendChild(btn);
    });
  }

  function renderColorPicker() {
    if (!colorPickerGrid) return;
    colorPickerGrid.innerHTML = "";
    COLOR_OPTIONS.forEach(c => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `color-swatch ${c.toLowerCase() === selectedColor.toLowerCase() ? 'active' : ''}`;
      btn.style.backgroundColor = c;
      btn.setAttribute("data-color", c);
      btn.addEventListener("click", () => {
        colorPickerGrid.querySelectorAll(".color-swatch").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedColor = c;
        updateProfilePreview();
      });
      colorPickerGrid.appendChild(btn);
    });
  }

  if (btnEditProfile) {
    btnEditProfile.addEventListener("click", () => {
      selectedAvatar = userAvatar;
      selectedColor = userColor;
      updateProfilePreview();
      renderAvatarPicker();
      renderColorPicker();
      profileModal.classList.remove("hidden");
    });
  }

  if (btnCloseProfile) {
    btnCloseProfile.addEventListener("click", () => {
      profileModal.classList.add("hidden");
    });
  }

  if (btnSaveProfile) {
    btnSaveProfile.addEventListener("click", () => {
      userAvatar = selectedAvatar;
      userColor = selectedColor;
      sessionStorage.setItem("wp_avatar", userAvatar);
      sessionStorage.setItem("wp_color", userColor);
      localStorage.setItem("wp_avatar", userAvatar);
      localStorage.setItem("wp_color", userColor);
      updateUserBadge();
      minimap.ensureLocalUserLane(userId, username, userColor, userAvatar, isHost);
      profileModal.classList.add("hidden");

      // Announce new appearance to room
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "join",
          user_id: userId,
          username: username,
          color: userColor,
          avatar: userAvatar,
          is_host: isHost
        }));
      }
    });
  }

  // 11. Settings Modal (Thresholds)
  const settingsModal = document.getElementById("settingsModal");
  const btnOpenSettings = document.getElementById("btnOpenSettings");
  const btnCloseSettings = document.getElementById("btnCloseSettingsModal");
  const btnSaveSettings = document.getElementById("btnSaveSettings");

  if (btnOpenSettings && settingsModal) {
    btnOpenSettings.addEventListener("click", () => {
      settingsModal.classList.remove("hidden");
    });
  }

  if (btnCloseSettings && settingsModal) {
    btnCloseSettings.addEventListener("click", () => {
      settingsModal.classList.add("hidden");
    });
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener("click", async () => {
      const defEl = document.getElementById("cfgDefaultSpeed");
      const lagEl = document.getElementById("cfgLagThreshold");
      const lagSpeedEl = document.getElementById("cfgLagSpeed");
      const heavyEl = document.getElementById("cfgHeavyLagThreshold");
      const heavySpeedEl = document.getElementById("cfgHeavyLagSpeed");
      const tolEl = document.getElementById("cfgCatchupTolerance");

      const payload = {
        default_speed: defEl ? parseFloat(defEl.value) : 1.25,
        lag_threshold: lagEl ? parseFloat(lagEl.value) : 2.0,
        lag_speed: lagSpeedEl ? parseFloat(lagSpeedEl.value) : 1.25,
        heavy_lag_threshold: heavyEl ? parseFloat(heavyEl.value) : 120.0,
        heavy_lag_speed: heavySpeedEl ? parseFloat(heavySpeedEl.value) : 1.4,
        catchup_tolerance: tolEl ? parseFloat(tolEl.value) : 1.0
      };

      try {
        const resp = await apiFetch(`/api/room/${roomId}/config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (resp.ok && settingsModal) {
          settingsModal.classList.add("hidden");
        }
      } catch (e) {
        alert("Failed to save settings: " + e.message);
      }
    });
  }

  function applyConfigValues(cfg) {
    if (!cfg) return;
    const elDef = document.getElementById("cfgDefaultSpeed");
    const elLag = document.getElementById("cfgLagThreshold");
    const elLagSpeed = document.getElementById("cfgLagSpeed");
    const elHeavy = document.getElementById("cfgHeavyLagThreshold");
    const elHeavySpeed = document.getElementById("cfgHeavyLagSpeed");
    const elTol = document.getElementById("cfgCatchupTolerance");

    if (elDef && cfg.default_speed !== undefined) elDef.value = cfg.default_speed;
    if (elLag && cfg.lag_threshold !== undefined) elLag.value = cfg.lag_threshold;
    if (elLagSpeed && cfg.lag_speed !== undefined) elLagSpeed.value = cfg.lag_speed;
    if (elHeavy && cfg.heavy_lag_threshold !== undefined) elHeavy.value = cfg.heavy_lag_threshold;
    if (elHeavySpeed && cfg.heavy_lag_speed !== undefined) elHeavySpeed.value = cfg.heavy_lag_speed;
    if (elTol && cfg.catchup_tolerance !== undefined) elTol.value = cfg.catchup_tolerance;
    if (player) player.defaultSpeed = cfg.default_speed || 1.25;
    if (minimap) minimap.defaultSpeed = cfg.default_speed || 1.25;
  }

  // Helpers
  function updateUserBadge() {
    if (elUserAvatar) {
      elUserAvatar.textContent = userAvatar;
      elUserAvatar.style.backgroundColor = `${userColor}25`;
      elUserAvatar.style.border = `2px solid ${userColor}`;
      elUserAvatar.style.boxShadow = `0 0 8px ${userColor}66`;
    }
    if (elUserName) elUserName.textContent = username;
    if (elUserRole) {
      elUserRole.textContent = isHost ? "👑 Host" : "Viewer";
      elUserRole.className = `role-badge ${isHost ? 'host' : ''}`;
    }
    if (elHostControls) {
      elHostControls.style.display = isHost ? "flex" : "none";
    }
  }

  function setConnectionStatus(connected) {
    if (!elConnStatus) return;
    const textEl = elConnStatus.querySelector(".status-text");
    if (connected) {
      elConnStatus.className = "status-pill connected";
      if (textEl) textEl.textContent = "Connected";
    } else {
      elConnStatus.className = "status-pill disconnected";
      if (textEl) textEl.textContent = "Reconnecting...";
    }
  }

  function formatTime(seconds) {
    const s = Math.floor(Math.max(0, seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Start connection
  connectWebSocket();
})();
