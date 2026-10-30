/**
 * Watch Party Application Main Controller
 */
(function() {
  // Prevent browser restoring mid-page scroll on reload / initial load
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  window.addEventListener('load', () => window.scrollTo(0, 0));

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
    // Animals & Mammals
    "🦊", "🐱", "🐶", "🐼", "🐨", "🦁", "🐯", "🐵",
    "🐰", "🐻", "🐻‍❄️", "🐹", "🐭", "🐮", "🐷", "🐺",
    "🦝", "🐗", "🐴", "🦄", "🫎", "🦌", "🦬", "🦓",
    "🦙", "🦒", "🐘", "🦣", "🦏", "🦛", "🐪", "🐐",
    "🦘", "🦥", "🦦", "🦫", "🦨", "🦡", "🦔", "🐿️",
    // Reptiles, Dinosaurs & Sea Creatures
    "🦖", "🦕", "🐲", "🐉", "🐍", "🐢", "🦎", "🐊",
    "🐸", "🐙", "🦑", "🪼", "🦐", "🦞", "🦀", "🐡",
    "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🦭", "🐚",
    // Birds & Bugs
    "🦉", "🐧", "🦅", "🦆", "🦢", "🦩", "🦚", "🦜",
    "🐦‍🔥", "🦤", "🐓", "🐣", "🐥", "🐦", "🕊️", "🦇",
    "🦋", "🐝", "🐞", "🪲", "🦂", "🕷️", "🐌", "🐛",
    // Fun Faces, Personas & Fantasy
    "😎", "🤓", "🥳", "🤠", "🥸", "🤩", "😈", "👿",
    "🤖", "👻", "👽", "👾", "💀", "🎃", "🤡", "👹",
    "🥷", "🧙", "🧚", "🧛", "🧜", "🧝", "🧞", "🧟",
    "🦸", "🦹", "🧑‍🚀", "🕵️", "🤴", "👸", "👑", "🎩",
    "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "🫡",
    // Food, Drinks & Treats
    "🍿", "🍕", "🍔", "🍟", "🌭", "🌮", "🌯", "🍜",
    "🍣", "🍱", "🥟", "🍤", "🍙", "🍩", "🍪", "🎂",
    "🧁", "🍰", "🍦", "🍧", "🍡", "🍫", "🍬", "🍭",
    "🍓", "🍒", "🍑", "🍍", "🥭", "🍉", "🥑", "🌶️",
    "☕", "🧋", "🍵", "🍺", "🍻", "🍷", "🍸", "🍹",
    // Space, Nature, Gaming & Cool Objects
    "🚀", "🛸", "⭐", "🌟", "✨", "⚡", "🔥", "💥",
    "🌈", "🌙", "☀️", "🪐", "☄️", "❄️", "🌊", "🌋",
    "🌸", "🌺", "🌻", "🌹", "🍀", "🌵", "🌴", "🍄",
    "🎮", "🕹️", "🎲", "🎯", "🎳", "🎰", "🎸", "🎧",
    "🎷", "🎺", "🥁", "🎬", "🎨", "💎", "🔮", "🧸",
    "🏆", "🥇", "⚽", "🏀", "🏈", "⚾", "🎾", "🎱"
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

  let selectedAvatar = userAvatar;
  let selectedColor = userColor;

  // Hostless room: everyone has equal controls after entering the PIN
  let isHost = false;

  // Clean up legacy localStorage host/pin keys so stale PINs are never cached across server restarts
  try {
    localStorage.removeItem(`wp_is_host_${roomId}`);
    localStorage.removeItem(`wp_pin_${roomId}`);
  } catch (e) {}

  // Elements
  const elRoomDisplay = document.getElementById("currentRoomDisplay");
  const elRoomPinDisplay = document.getElementById("roomPinDisplay");
  const btnCopyPin = document.getElementById("btnCopyPin");
  const pinModal = document.getElementById("pinModal");
  const settingsModal = document.getElementById("settingsModal");
  const profileModal = document.getElementById("profileModal");
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
  let elVideoEta = document.getElementById("videoEta");
  const elVideoBvid = document.getElementById("videoBvid");

  const elViewersList = document.getElementById("viewersList");
  const elViewerCount = document.getElementById("viewerListCount");
  const elChatMessages = document.getElementById("chatMessages");
  const elChatForm = document.getElementById("chatForm");
  const elChatInput = document.getElementById("chatInput");
  const elChatEmojiBar = document.getElementById("chatEmojiBar");
  let chatImagePreview = document.getElementById("chatImageAttachmentPreview");
  let chatPreviewImg = document.getElementById("chatPreviewImg");
  let btnRemoveChatImage = document.getElementById("btnRemoveChatImage");
  let lightboxModal = document.getElementById("lightboxModal");
  let lightboxImage = document.getElementById("lightboxImage");
  let btnCloseLightbox = document.getElementById("btnCloseLightbox");
  let pendingChatImage = null;
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
  let elSelectSub = document.getElementById("selectSubtitle");
  let elSelectSecondarySub = document.getElementById("selectSecondarySubtitle");
  const elSelectSubSize = document.getElementById("selectSubSize");
  const elSubOverlay = document.getElementById("subtitleOverlay");
  const elSubText = document.getElementById("subtitleText");
  let elSubTop = document.getElementById("subtitleTop");
  let elSubBottom = document.getElementById("subtitleBottom");
  const theaterContainer = document.getElementById("playerTheaterContainer");
  let btnToolbarVideoSource = document.getElementById("btnToolbarVideoSource");
  let toolbarVideoSourceMenu = document.getElementById("toolbarVideoSourceMenu");
  let btnCloseVideoSource = document.getElementById("btnCloseVideoSource");
  let btnToolbarSettings = document.getElementById("btnToolbarSettings");
  let toolbarSettingsMenu = document.getElementById("toolbarSettingsMenu");
  let btnCloseToolbarSettings = document.getElementById("btnCloseToolbarSettings");
  let btnToggleDanmaku = document.getElementById("btnToggleDanmaku");
  let btnToggleDanmakuTrad = document.getElementById("btnToggleDanmakuTrad");
  let danmakuStateLabel = document.getElementById("danmakuStateLabel");
  let btnToggleRoomDanmaku = document.getElementById("btnToggleRoomDanmaku");
  let roomDanmakuStateLabel = document.getElementById("roomDanmakuStateLabel");
  let danmakuOverlay = document.getElementById("danmakuOverlay");
  let reactionBurstContainer = document.getElementById("reactionBurstContainer");

  // Danmaku & Reactions state (Danmaku ON by default, Room Danmaku ON by default, Traditional Chinese OFF by default)
  const savedDanmakuPref = localStorage.getItem("wp_danmaku_enabled");
  let danmakuEnabled = savedDanmakuPref !== "false";
  let roomDanmakuEnabled = localStorage.getItem("wp_room_danmaku_enabled") !== "false";
  let danmakuTrad = (localStorage.getItem("wp_danmaku_trad") === "true");
  let danmakuComments = [];
  let loadedDanmakuCid = null;
  let lastDanmakuTime = -1;
  const DANMAKU_TRACKS = 8;
  const danmakuTrackFreeAt = new Array(DANMAKU_TRACKS).fill(0);

  // Subs History Panel Elements
  const lyricsCard = document.getElementById("lyricsCard");
  const lyricsContainer = document.getElementById("lyricsContainer");
  const btnRecenterLyrics = document.getElementById("btnRecenterLyrics");
  const btnCloseLyrics = document.getElementById("btnCloseLyrics");

  // Custom SRT Subtitles Elements & State
  let inputCustomSrt = document.getElementById("inputCustomSrt");
  let btnUploadSrt = document.getElementById("btnUploadSrt");
  let btnUploadSrtViewer = document.getElementById("btnUploadSrtViewer");
  let btnRenameCustomSrt = document.getElementById("btnRenameCustomSrt");
  let btnDeleteCustomSrt = document.getElementById("btnDeleteCustomSrt");
  let btnDeleteCustomSrtViewer = document.getElementById("btnDeleteCustomSrtViewer");
  let customSrtShareRow = document.getElementById("customSrtShareRow");
  let btnShareCustomSrt = document.getElementById("btnShareCustomSrt");
  let iconShareSrt = document.getElementById("iconShareSrt");
  let labelShareSrt = document.getElementById("labelShareSrt");
  let customSrtOptionsRow = document.getElementById("customSrtOptionsRow");
  let selectSrtSyncMode = document.getElementById("selectSrtSyncMode");
  let customSrtInfoRow = document.getElementById("customSrtInfoRow");
  let customSrtInfoText = document.getElementById("customSrtInfoText");
  let labelUploadSrt = document.getElementById("labelUploadSrt");

  let rawCustomSrtCues = [];
  let customSrtFileName = "";
  let customSrtDisplayName = "";
  let customSrtSharedId = "";
  let isCustomSrtShared = false;
  let customSrtSyncMode = "as-is"; // "as-is" or "bilibili-sync"
  let bilibiliReferenceCues = [];
  let roomSharedSubtitles = [];

  // Live Minimap and Room Configuration state
  let lastMinimapData = null;
  let currentRoomConfig = {
    default_speed: 1.25,
    lag_threshold: 2.0,
    lag_speed: 1.25,
    heavy_lag_threshold: 120.0,
    heavy_lag_speed: 1.4,
    catchup_tolerance: 1.0
  };

  // Room PIN state (generated fresh on server startup)
  let roomPin = "";
  let pendingPin = urlParams.get("pin") || safeGet(sessionStorage, `wp_pin_${roomId}`) || "";

  if (elRoomDisplay) elRoomDisplay.textContent = roomId;
  if (!pendingPin && pinModal) {
    pinModal.classList.remove("hidden");
    if (inputJoinPin) setTimeout(() => inputJoinPin.focus({ preventScroll: true }), 50);
  }
  updateUserBadge();

  // 2. Subtitles State & Subs History Logic
  let activeVideoMetadata = null;
  let activeSubtitles = [];
  let currentSubtitleCues = []; // Top subtitle cues
  let secondarySubtitleCues = []; // Bottom subtitle cues
  let activeSubItem = null; // Top subtitle item
  let activeSecondarySubItem = null; // Bottom subtitle item
  const subtitleCuesCache = new Map();
  let activeCueIndex = -1;

  let activeSubtitleLoadSeq = 0;
  let primarySubtitleLoadSeq = 0;
  let secondarySubtitleLoadSeq = 0;

  function ensureSubtitleDOMElements() {
    elSubTop = document.getElementById("subtitleTop");
    elSubBottom = document.getElementById("subtitleBottom");
    if (elSubText && !elSubTop) {
      elSubTop = document.createElement("div");
      elSubTop.id = "subtitleTop";
      elSubTop.className = "subtitle-line subtitle-top";
      elSubText.appendChild(elSubTop);
    }
    if (elSubText && !elSubBottom) {
      elSubBottom = document.createElement("div");
      elSubBottom.id = "subtitleBottom";
      elSubBottom.className = "subtitle-line subtitle-bottom";
      elSubText.appendChild(elSubBottom);
    }
  }

  function formatSubtitleLabel(s, idx) {
    const lan = (s.lan || "").toLowerCase();
    const doc = s.lan_doc || "";
    const transform = s.transform || "none";

    if (transform === "traditional" || lan === "zh-traditional" || lan.includes("hant") || lan.includes("tw") || lan.includes("hk") || doc.includes("繁體") || doc.includes("繁体") || doc.includes("Traditional")) {
      return "繁體中文";
    }
    if (transform === "en" || lan === "en-trans") {
      return "English (Auto)";
    }
    if (lan.includes("en") || doc.includes("英语") || doc.includes("英文") || doc.includes("English")) {
      return "English";
    }
    if (lan.includes("zh") || doc.includes("中文")) {
      return "简体中文";
    }
    if (lan.includes("ja") || doc.includes("日文") || doc.includes("日语") || doc.includes("Japanese")) {
      return "日本語";
    }
    if (lan.includes("ko") || doc.includes("韩") || doc.includes("Korean")) {
      return "한국어";
    }

    // Fallback: strip verbose parentheticals and arrows
    const shortDoc = doc
      .replace(/（[^）]*）/g, "")
      .replace(/\([^)]*\)/g, "")
      .split("->")
      .pop()
      .trim();
    return shortDoc || s.lan || `Sub ${idx + 1}`;
  }

  function trimSubtitleLabel(label, maxLen = 22) {
    if (!label || typeof label !== "string") return "";
    const trimmed = label.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return trimmed.slice(0, Math.max(3, maxLen - 3)) + "...";
  }

  function formatCustomSrtLabel(fileName, maxLen = 22) {
    if (!fileName) return "📁 Custom: SRT";
    const prefix = "📁 Custom: ";
    const available = maxLen - prefix.length;
    if (fileName.length <= available) {
      return prefix + fileName;
    }
    return prefix + fileName.slice(0, Math.max(3, available - 3)) + "...";
  }

  function parseSRT(srtText) {
    if (!srtText || typeof srtText !== "string") return [];
    const cleanText = srtText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!cleanText) return [];

    const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,\.](\d{1,3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[,\.](\d{1,3})/;

    function parseTimePart(hh, mm, ss, ms) {
      const h = parseInt(hh || "0", 10);
      const m = parseInt(mm || "0", 10);
      const s = parseInt(ss || "0", 10);
      const msStr = (ms || "0").padEnd(3, "0").slice(0, 3);
      const millis = parseInt(msStr, 10);
      return (h * 3600) + (m * 60) + s + (millis / 1000);
    }

    const blocks = cleanText.split(/\n\s*\n/);
    const cues = [];

    for (const block of blocks) {
      const lines = block.trim().split("\n");
      let timeLineIdx = -1;
      let match = null;

      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(timeRegex);
        if (m) {
          timeLineIdx = i;
          match = m;
          break;
        }
      }

      if (timeLineIdx === -1 || !match) continue;

      const from = parseTimePart(match[1], match[2], match[3], match[4]);
      const to = parseTimePart(match[5], match[6], match[7], match[8]);

      const contentLines = lines.slice(timeLineIdx + 1);
      const content = contentLines.join("\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\{[^}]+\}/g, "")
        .trim();

      if (content.length > 0 && to >= from) {
        cues.push({
          from: Math.round(from * 1000) / 1000,
          to: Math.round(to * 1000) / 1000,
          content: content
        });
      }
    }

    return cues.sort((a, b) => a.from - b.from);
  }

  function updateSrtUIState() {
    const hasCustomSrt = rawCustomSrtCues && rawCustomSrtCues.length > 0;
    const hasSharedSubs = roomSharedSubtitles && roomSharedSubtitles.length > 0;
    const isCustom = (activeSubItem && activeSubItem.isCustomSrt) || (activeSecondarySubItem && activeSecondarySubItem.isCustomSrt);
    const isShared = (activeSubItem && activeSubItem.isShared) || (activeSecondarySubItem && activeSecondarySubItem.isShared);

    if (btnRenameCustomSrt) {
      btnRenameCustomSrt.classList.toggle("hidden", !hasCustomSrt);
    }
    if (btnDeleteCustomSrt) {
      btnDeleteCustomSrt.classList.toggle("hidden", !(hasCustomSrt || hasSharedSubs));
      btnDeleteCustomSrt.title = hasCustomSrt ? "Delete uploaded custom subtitles" : "Delete uploaded subtitles from room";
    }
    if (btnDeleteCustomSrtViewer) {
      btnDeleteCustomSrtViewer.classList.toggle("hidden", !(hasCustomSrt || isShared || hasSharedSubs));
      btnDeleteCustomSrtViewer.title = isShared ? "Remove this shared subtitle track" : "Delete uploaded custom subtitles";
    }

    if (customSrtShareRow) {
      if (hasCustomSrt) {
        customSrtShareRow.classList.remove("hidden");
        updateShareButtonUI(isCustomSrtShared);
      } else {
        customSrtShareRow.classList.add("hidden");
      }
    }

    if (customSrtOptionsRow) {
      if (isCustom) {
        customSrtOptionsRow.classList.remove("hidden");
      } else {
        customSrtOptionsRow.classList.add("hidden");
      }
    }
    if (customSrtInfoRow) {
      if (isCustom && customSrtInfoText && customSrtInfoText.textContent.trim().length > 0) {
        customSrtInfoRow.classList.remove("hidden");
      } else {
        customSrtInfoRow.classList.add("hidden");
      }
    }
    if (labelUploadSrt) {
      const display = customSrtDisplayName || customSrtFileName;
      if (display) {
        labelUploadSrt.textContent = display.length > 13 ? display.slice(0, 10) + "..." : display;
        labelUploadSrt.title = display;
      } else {
        labelUploadSrt.textContent = "Upload .srt";
        labelUploadSrt.title = "Upload custom .srt subtitle file";
      }
    }
    if (selectSrtSyncMode) {
      selectSrtSyncMode.value = customSrtSyncMode || "as-is";
    }

    renderSharedSubtitlesListInSettings();
  }

  function renderSharedSubtitlesListInSettings() {
    const section = document.getElementById("sharedSubtitlesListSection");
    const container = document.getElementById("sharedSubtitlesListContainer");
    if (!section || !container) return;

    container.innerHTML = "";
    const items = [];

    if (rawCustomSrtCues && rawCustomSrtCues.length > 0) {
      items.push({
        type: "custom",
        id: "custom_srt",
        name: customSrtDisplayName || customSrtFileName || "Custom Subtitles",
        cuesCount: rawCustomSrtCues.length,
        isShared: isCustomSrtShared
      });
    }

    if (roomSharedSubtitles && roomSharedSubtitles.length > 0) {
      roomSharedSubtitles.forEach(sub => {
        if (customSrtSharedId && sub.id === customSrtSharedId) return;
        items.push({
          type: "shared",
          id: sub.id,
          name: sub.name || "Shared Subtitles",
          cuesCount: (sub.cues || []).length,
          username: sub.username || "Viewer"
        });
      });
    }

    if (items.length === 0) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "shared-sub-item";
      const icon = item.type === "custom" ? "📁" : "🌐";
      const info = item.type === "custom"
        ? (item.isShared ? "Uploaded & Shared" : "Local")
        : `Shared by ${item.username || 'Viewer'}`;

      row.innerHTML = `
        <div class="shared-sub-name" title="${escapeHtml(item.name)} (${item.cuesCount} cues)">
          <span>${icon}</span>
          <span style="font-weight: 500;">${escapeHtml(trimSubtitleLabel(item.name, 18))}</span>
          <span style="opacity: 0.6; font-size: 11px;">(${item.cuesCount} cues - ${info})</span>
        </div>
      `;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-delete-shared-sub";
      delBtn.title = "Delete this subtitle track";
      delBtn.textContent = "🗑️ Delete";
      delBtn.addEventListener("click", () => {
        if (item.type === "custom") {
          deleteCustomSrt();
        } else {
          deleteSharedSubtitle(item.id);
        }
      });
      row.appendChild(delBtn);
      container.appendChild(row);
    });
  }

  async function revertToDefaultOrOffSubtitle() {
    if (activeSubtitles && activeSubtitles.length > 0) {
      const defaultSub = activeSubtitles[0];
      const defaultName = formatSubtitleLabel(defaultSub, 0);
      if (elSelectSub) {
        selectSubtitleOption(elSelectSub, defaultSub);
      }
      await loadSubtitleTrack(defaultSub.url, defaultSub.transform || "none", defaultName);
    } else {
      if (elSelectSub) elSelectSub.value = "off";
      await loadSubtitleTrack(null);
    }
  }

  async function deleteSharedSubtitle(subId) {
    const cleanId = String(subId).replace(/^shared:/, "");
    const matched = (roomSharedSubtitles || []).find(s => s.id === cleanId);
    const name = matched ? matched.name : (customSrtDisplayName || customSrtFileName || "Shared Subtitles");

    if (!confirm(`Are you sure you want to delete uploaded subtitles "${name}"?`)) {
      return;
    }

    // Send delete notification via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "custom_subtitles_delete",
        sub_id: cleanId,
        user_id: userId
      }));
    }

    // Also call REST endpoint to guarantee deletion
    try {
      await apiFetch(`/api/room/${roomId}/shared-subtitles/${encodeURIComponent(cleanId)}`, {
        method: "DELETE"
      });
    } catch (e) {
      console.warn("REST shared subtitle delete:", e);
    }

    // If locally active on Top Sub, revert to default
    if (activeSubItem && (activeSubItem.url === `shared:${cleanId}` || activeSubItem.url === cleanId)) {
      activeSubItem = null;
      currentSubtitleCues = [];
      await revertToDefaultOrOffSubtitle();
    }

    // If locally active on Bottom Sub, turn off
    if (activeSecondarySubItem && (activeSecondarySubItem.url === `shared:${cleanId}` || activeSecondarySubItem.url === cleanId)) {
      activeSecondarySubItem = null;
      secondarySubtitleCues = [];
      if (elSelectSecondarySub) elSelectSecondarySub.value = "off";
      try { localStorage.setItem("wp_secondary_sub_preference", "off"); } catch (e) {}
    }

    // Also reset local custom srt state if this was our shared custom srt
    if (customSrtSharedId === cleanId) {
      customSrtSharedId = "";
      isCustomSrtShared = false;
      rawCustomSrtCues = [];
      customSrtFileName = "";
      customSrtDisplayName = "";
      if (inputCustomSrt) inputCustomSrt.value = "";
    }

    roomSharedSubtitles = (roomSharedSubtitles || []).filter(s => s.id !== cleanId);
    renderSharedSubtitlesInDropdown();
    updateSrtUIState();
    renderLyricsContainer();
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
  }

  async function deleteCustomSrt() {
    // 1. Check if viewing a shared subtitle on Top Sub or Bottom Sub
    const isTopShared = activeSubItem && activeSubItem.isShared;
    const isBottomShared = activeSecondarySubItem && activeSecondarySubItem.isShared;

    if (isTopShared || isBottomShared) {
      const activeSharedItem = isTopShared ? activeSubItem : activeSecondarySubItem;
      const subId = activeSharedItem.url ? activeSharedItem.url.replace(/^shared:/, "") : "";
      if (subId) {
        await deleteSharedSubtitle(subId);
        return;
      }
    }

    // 2. If there are local custom SRT cues, delete local custom SRT
    if (rawCustomSrtCues && rawCustomSrtCues.length > 0) {
      const name = customSrtDisplayName || customSrtFileName || "Custom Subtitles";
      if (!confirm(`Are you sure you want to delete uploaded subtitles "${name}"?`)) {
        return;
      }

      if (isCustomSrtShared && customSrtSharedId) {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "custom_subtitles_delete",
            sub_id: customSrtSharedId,
            user_id: userId
          }));
        }
        try {
          await apiFetch(`/api/room/${roomId}/shared-subtitles/${encodeURIComponent(customSrtSharedId)}`, {
            method: "DELETE"
          });
        } catch (e) {}
      }

      rawCustomSrtCues = [];
      customSrtFileName = "";
      customSrtDisplayName = "";
      customSrtSharedId = "";
      isCustomSrtShared = false;
      if (inputCustomSrt) inputCustomSrt.value = "";

      if (elSelectSub) {
        const opt = elSelectSub.querySelector('option[value="custom_srt"]');
        if (opt) opt.remove();
      }
      if (elSelectSecondarySub) {
        const opt = elSelectSecondarySub.querySelector('option[value="custom_srt"]');
        if (opt) opt.remove();
      }

      if (activeSubItem && activeSubItem.isCustomSrt) {
        activeSubItem = null;
        currentSubtitleCues = [];
        await revertToDefaultOrOffSubtitle();
      }

      if (activeSecondarySubItem && activeSecondarySubItem.isCustomSrt) {
        activeSecondarySubItem = null;
        secondarySubtitleCues = [];
        if (elSelectSecondarySub) elSelectSecondarySub.value = "off";
      }

      updateSrtUIState();
      return;
    }

    // 3. If there are room shared subtitles, offer to delete
    if (roomSharedSubtitles && roomSharedSubtitles.length > 0) {
      const firstSub = roomSharedSubtitles[0];
      await deleteSharedSubtitle(firstSub.id);
      return;
    }
  }

  function updateShareButtonUI(isShared) {
    if (!btnShareCustomSrt) return;
    if (iconShareSrt && labelShareSrt) {
      if (isShared) {
        btnShareCustomSrt.classList.add("shared");
        iconShareSrt.textContent = "✅";
        labelShareSrt.textContent = "Shared (Update)";
        btnShareCustomSrt.title = "Subtitles are shared with the room. Click to re-sync or update.";
      } else {
        btnShareCustomSrt.classList.remove("shared");
        iconShareSrt.textContent = "📢";
        labelShareSrt.textContent = "Share with Room";
        btnShareCustomSrt.title = "Share these subtitles with everyone in the room";
      }
    }
  }

  function renameCustomSrt() {
    const currentName = customSrtDisplayName || customSrtFileName || "Custom Subtitles";
    const newName = prompt("Enter display name for your custom subtitles:", currentName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) return;

    customSrtDisplayName = trimmed;
    updateSrtUIState();

    if (elSelectSub) {
      let opt = elSelectSub.querySelector('option[value="custom_srt"]');
      if (opt) {
        opt.textContent = formatCustomSrtLabel(trimmed, 22);
        opt.title = `📁 Custom SRT: ${trimmed}`;
      }
      if (elSelectSub.value === "custom_srt") {
        elSelectSub.title = `Custom SRT: ${trimmed}`;
      }
    }

    if (activeSubItem && activeSubItem.isCustomSrt) {
      activeSubItem.name = trimmed;
    }

    if (isCustomSrtShared && customSrtSharedId && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "custom_subtitles_rename",
        sub_id: customSrtSharedId,
        name: trimmed,
        user_id: userId
      }));
    }
  }

  function shareCustomSrtWithRoom() {
    if (!rawCustomSrtCues || rawCustomSrtCues.length === 0) {
      alert("Please upload a .srt subtitle file first.");
      return;
    }
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("Not connected to room. Please check your connection.");
      return;
    }

    if (!customSrtSharedId) {
      customSrtSharedId = "sub_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
    }

    const nameToShare = customSrtDisplayName || customSrtFileName || "Custom Subtitles";
    const cuesToShare = (currentSubtitleCues && currentSubtitleCues.length > 0) ? currentSubtitleCues : rawCustomSrtCues;

    socket.send(JSON.stringify({
      type: "custom_subtitles_share",
      sub_id: customSrtSharedId,
      name: nameToShare,
      cues: cuesToShare,
      user_id: userId
    }));

    isCustomSrtShared = true;
    updateShareButtonUI(true);
  }

  function updateSharedSubtitlesList(subs) {
    roomSharedSubtitles = subs || [];
    renderSharedSubtitlesInDropdown();
    updateSrtUIState();
  }

  function selectSubtitleOption(selectEl, target) {
    if (!selectEl || !target) return null;
    const options = Array.from(selectEl.options);

    if (target === "off" || target === "custom_srt" || (typeof target === "string" && target.startsWith("shared:"))) {
      const opt = options.find(o => o.value === target);
      if (opt) {
        selectEl.value = opt.value;
        return opt.value;
      }
      return null;
    }

    // Direct value match if target string exactly matches an option value
    if (typeof target === "string") {
      const exact = options.find(o => o.value === target);
      if (exact) {
        selectEl.value = exact.value;
        return exact.value;
      }
    }

    let targetTransform = null;
    let targetLan = null;
    let targetUrl = null;

    if (typeof target === "object" && target !== null) {
      targetTransform = target.transform;
      targetLan = target.lan;
      targetUrl = target.url;
    } else {
      try {
        const parsed = JSON.parse(target);
        targetTransform = parsed.transform;
        targetLan = parsed.lan;
        targetUrl = parsed.url;
      } catch (e) {
        if (target === "en" || target === "traditional" || target === "none") {
          targetTransform = target;
        } else {
          targetLan = target;
        }
      }
    }

    // 1. Match exact URL and transform if URL is specified
    if (targetUrl) {
      const match = options.find(o => {
        try {
          const p = JSON.parse(o.value);
          return p.url === targetUrl && (p.transform || "none") === (targetTransform || "none");
        } catch (e) { return false; }
      });
      if (match) {
        selectEl.value = match.value;
        return match.value;
      }
    }

    // 2. Match by transform if specific (e.g. 'en' or 'traditional')
    if (targetTransform && targetTransform !== "none") {
      const match = options.find(o => {
        try {
          const p = JSON.parse(o.value);
          return p.transform === targetTransform;
        } catch (e) { return false; }
      });
      if (match) {
        selectEl.value = match.value;
        return match.value;
      }
    }

    // 3. Match by language code (e.g. 'en-trans', 'en', 'zh-CN')
    if (targetLan && targetLan !== "none") {
      const targetLower = targetLan.toLowerCase();
      const match = options.find(o => {
        try {
          const p = JSON.parse(o.value);
          const l = (p.lan || "").toLowerCase();
          return l === targetLower || l.includes(targetLower) || (targetLower === "en" && (p.transform === "en" || l.includes("en")));
        } catch (e) { return false; }
      });
      if (match) {
        selectEl.value = match.value;
        return match.value;
      }
    }

    return null;
  }

  function renderSharedSubtitlesInDropdown() {
    populateSubtitleDropdown(elSelectSub, "primary");
    populateSubtitleDropdown(elSelectSecondarySub, "secondary");

    // Maintain Primary selection
    if (activeSubItem) {
      if (activeSubItem.isCustomSrt) {
        if (elSelectSub) elSelectSub.value = "custom_srt";
      } else if (activeSubItem.isShared) {
        const matched = (roomSharedSubtitles || []).find(s => `shared:${s.id}` === activeSubItem.url);
        if (matched) {
          if (elSelectSub) elSelectSub.value = activeSubItem.url;
        } else {
          activeSubItem = null;
          currentSubtitleCues = [];
          revertToDefaultOrOffSubtitle();
        }
      } else {
        selectSubtitleOption(elSelectSub, activeSubItem);
      }
    }

    // Maintain Secondary selection
    if (activeSecondarySubItem) {
      if (activeSecondarySubItem.isCustomSrt) {
        if (elSelectSecondarySub) elSelectSecondarySub.value = "custom_srt";
      } else if (activeSecondarySubItem.isShared) {
        const matched = (roomSharedSubtitles || []).find(s => `shared:${s.id}` === activeSecondarySubItem.url);
        if (matched) {
          if (elSelectSecondarySub) elSelectSecondarySub.value = activeSecondarySubItem.url;
        } else {
          activeSecondarySubItem = null;
          secondarySubtitleCues = [];
        }
      } else {
        selectSubtitleOption(elSelectSecondarySub, activeSecondarySubItem);
      }
    }

    renderLyricsContainer();
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
    updateVideoEtaDisplay();
  }

  function loadSharedSubtitleTrack(subId) {
    const matched = (roomSharedSubtitles || []).find(s => s.id === subId);
    if (!matched) {
      alert("Shared subtitle track not found.");
      return;
    }

    currentSubtitleCues = (matched.cues || []).map(c => ({
      from: parseFloat(c.from) || 0,
      to: parseFloat(c.to) || 0,
      content: c.content || ""
    })).sort((a, b) => a.from - b.from);

    activeSubItem = {
      url: `shared:${matched.id}`,
      transform: "none",
      name: matched.name,
      isShared: true,
      isCustomSrt: false
    };

    elSelectSub.title = `Shared Subtitle: ${matched.name} (by ${matched.username || 'Viewer'})`;
    updateSrtUIState();
    if (lyricsCard) lyricsCard.classList.remove("hidden");
    renderLyricsContainer();
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
    updateVideoEtaDisplay();
  }

  async function getBilibiliReferenceCues() {
    if (bilibiliReferenceCues && bilibiliReferenceCues.length > 0) {
      return bilibiliReferenceCues;
    }
    const subs = (activeVideoMetadata && Array.isArray(activeVideoMetadata.subtitles))
      ? activeVideoMetadata.subtitles
      : activeSubtitles;
    if (subs && subs.length > 0) {
      const targetSub = subs[0];
      const targetUrl = targetSub.subtitle_url || targetSub.url;
      if (targetUrl) {
        try {
          const bvid = (activeVideoMetadata && activeVideoMetadata.bvid) ? activeVideoMetadata.bvid : "";
          const bvidParam = bvid ? `&bvid=${encodeURIComponent(bvid)}` : "";
          const resp = await apiFetch(`/api/subtitles/proxy?url=${encodeURIComponent(targetUrl)}&transform=none&format=json${bvidParam}`);
          if (resp.ok) {
            const raw = await resp.json();
            const cues = (raw || []).map(c => ({
              from: parseFloat(c.from) || 0,
              to: parseFloat(c.to) || 0,
              content: c.content || ""
            })).sort((a, b) => a.from - b.from);
            if (cues.length > 0) {
              bilibiliReferenceCues = cues;
              return bilibiliReferenceCues;
            }
          }
        } catch (e) {
          console.warn("Could not fetch Bilibili reference subtitles:", e);
        }
      }
    }
    return null;
  }

  async function applyCustomSrtSync(mode = "as-is") {
    customSrtSyncMode = mode;
    if (selectSrtSyncMode) selectSrtSyncMode.value = mode;

    if (!rawCustomSrtCues || rawCustomSrtCues.length === 0) {
      currentSubtitleCues = [];
      renderLyricsContainer();
      updateSrtUIState();
      return;
    }

    if (mode === "bilibili-sync") {
      let bCues = await getBilibiliReferenceCues();
      if (!bCues || bCues.length === 0) {
        if (customSrtInfoText) {
          customSrtInfoText.textContent = "No Bilibili subtitles found to sync against. Using timestamps as-is.";
        }
        customSrtSyncMode = "as-is";
        if (selectSrtSyncMode) selectSrtSyncMode.value = "as-is";
        currentSubtitleCues = rawCustomSrtCues.map(c => ({ ...c }));
      } else {
        const B_start = bCues[0].from;
        const B_end = bCues[bCues.length - 1].from;
        const S_start = rawCustomSrtCues[0].from;
        const S_end = rawCustomSrtCues[rawCustomSrtCues.length - 1].from;

        const scale = (S_end !== S_start && B_end !== B_start) ? (B_end - B_start) / (S_end - S_start) : 1.0;
        const offset = B_start - (S_start * scale);

        currentSubtitleCues = rawCustomSrtCues.map(c => {
          const from = Math.max(0, Math.round((B_start + (c.from - S_start) * scale) * 1000) / 1000);
          const to = Math.max(from, Math.round((B_start + (c.to - S_start) * scale) * 1000) / 1000);
          return { from, to, content: c.content };
        }).sort((a, b) => a.from - b.from);

        if (customSrtInfoText) {
          const shiftStr = (offset >= 0 ? "+" : "") + offset.toFixed(1) + "s";
          const speedPct = (scale * 100).toFixed(1) + "%";
          customSrtInfoText.textContent = `Synced: 1st line ${formatTime(B_start)}, last ${formatTime(B_end)} (Shift: ${shiftStr}, Speed: ${speedPct})`;
        }
      }
    } else {
      // mode === "as-is"
      currentSubtitleCues = rawCustomSrtCues.map(c => ({ ...c }));
      if (customSrtInfoText) {
        const firstT = rawCustomSrtCues[0]?.from || 0;
        const lastT = rawCustomSrtCues[rawCustomSrtCues.length - 1]?.to || 0;
        customSrtInfoText.textContent = `As-Is: ${rawCustomSrtCues.length} cues (${formatTime(firstT)} - ${formatTime(lastT)})`;
      }
    }

    activeSubItem = { url: "custom_srt", transform: "none", name: customSrtDisplayName || customSrtFileName || "Custom SRT", isCustomSrt: true };
    if (lyricsCard) lyricsCard.classList.remove("hidden");
    renderLyricsContainer();
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
    updateVideoEtaDisplay();
    updateSrtUIState();

    // If already shared, automatically update the shared track in the room
    if (isCustomSrtShared && customSrtSharedId && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "custom_subtitles_share",
        sub_id: customSrtSharedId,
        name: customSrtDisplayName || customSrtFileName || "Custom Subtitles",
        cues: currentSubtitleCues,
        user_id: userId
      }));
    }
  }

  function loadCustomSrtText(srtText, fileName = "custom.srt") {
    const cues = parseSRT(srtText);
    if (!cues || cues.length === 0) {
      alert("No valid subtitle cues found in the .srt file.");
      return;
    }

    rawCustomSrtCues = cues;
    customSrtFileName = fileName;
    customSrtDisplayName = fileName.replace(/\.srt$/i, "");
    customSrtSharedId = "";
    isCustomSrtShared = false;

    populateSubtitleDropdown(elSelectSub, "primary");
    populateSubtitleDropdown(elSelectSecondarySub, "secondary");

    // If Top Sub is already active with a video track (e.g. Chinese), assign uploaded SRT to Bottom Sub!
    if (activeSubItem && activeSubItem.url && activeSubItem.url !== "off" && activeSubItem.url !== "custom_srt") {
      if (elSelectSecondarySub) elSelectSecondarySub.value = "custom_srt";
      loadSecondarySubtitleTrack("custom_srt");
    } else {
      if (elSelectSub) elSelectSub.value = "custom_srt";
      loadPrimarySubtitleTrack("custom_srt");
    }
  }

  function isSameVideo(v1, v2) {
    if (!v1 || !v2) return false;
    // Bilibili videos
    if (v1.bvid && v2.bvid && v1.bvid !== "custom" && v2.bvid !== "custom") {
      if (v1.bvid !== v2.bvid) return false;
      if (v1.cid && v2.cid) {
        return Number(v1.cid) === Number(v2.cid);
      }
      return true;
    }
    // Custom / direct stream URL
    if (v1.stream_url && v2.stream_url) {
      return v1.stream_url === v2.stream_url;
    }
    if (v1.proxy_stream_url && v2.proxy_stream_url) {
      return v1.proxy_stream_url === v2.proxy_stream_url;
    }
    if (v1.title && v2.title) {
      return v1.title === v2.title && Math.abs((v1.duration || 0) - (v2.duration || 0)) < 1;
    }
    return false;
  }

  function clearSubtitles(resetCustomSrt = true) {
    activeSubtitleLoadSeq++;
    primarySubtitleLoadSeq++;
    secondarySubtitleLoadSeq++;
    currentSubtitleCues = [];
    secondarySubtitleCues = [];
    bilibiliReferenceCues = [];
    activeSubItem = null;
    activeSecondarySubItem = null;
    activeSubtitles = [];

    ensureSubtitleDOMElements();

    if (elSubOverlay) {
      elSubOverlay.classList.add("hidden");
    }
    if (elSubTop) {
      elSubTop.textContent = "";
    }
    if (elSubBottom) {
      elSubBottom.textContent = "";
    }
    if (!elSubTop && !elSubBottom && elSubText) {
      elSubText.textContent = "";
    }

    if (elSelectSub) {
      elSelectSub.innerHTML = '<option value="off">Top Sub: Off</option>';
      elSelectSub.value = "off";
      elSelectSub.title = "Select Top Subtitle Track";
    }
    if (elSelectSecondarySub) {
      elSelectSecondarySub.innerHTML = '<option value="off">Bottom Sub: Off</option>';
      elSelectSecondarySub.value = "off";
      elSelectSecondarySub.title = "Select Bottom Subtitle Track";
    }

    if (resetCustomSrt) {
      rawCustomSrtCues = [];
      customSrtFileName = "";
      customSrtDisplayName = "";
      customSrtSharedId = "";
      isCustomSrtShared = false;
      customSrtSyncMode = "as-is";
      if (inputCustomSrt) inputCustomSrt.value = "";
      if (labelUploadSrt) labelUploadSrt.textContent = "Upload .srt";
      if (btnRenameCustomSrt) btnRenameCustomSrt.classList.add("hidden");
      if (customSrtShareRow) customSrtShareRow.classList.add("hidden");
      if (customSrtOptionsRow) customSrtOptionsRow.classList.add("hidden");
      if (customSrtInfoRow) customSrtInfoRow.classList.add("hidden");
      if (customSrtInfoText) customSrtInfoText.textContent = "";
      updateShareButtonUI(false);
    }

    // Reset subtitle delay nudger to 0.0s
    subtitleOffsetSec = 0.0;
    try {
      localStorage.setItem("wp_subtitle_offset", "0");
    } catch (e) {}
    updateSubOffsetUI();

    renderLyricsContainer();
    updateSrtUIState();
    updateVideoEtaDisplay();
  }

  async function fetchTrackCues(url, transform = "none") {
    if (!url || url === "off") return [];

    if (url === "custom_srt") {
      const mode = customSrtSyncMode || "as-is";
      if (mode === "bilibili-sync" && bilibiliReferenceCues && bilibiliReferenceCues.length > 0 && rawCustomSrtCues.length > 0) {
        return syncCustomCuesWithReference(rawCustomSrtCues, bilibiliReferenceCues);
      }
      return (rawCustomSrtCues || []).map(c => ({ ...c }));
    }

    if (url.startsWith("shared:")) {
      const subId = url.slice(7);
      const matched = (roomSharedSubtitles || []).find(s => s.id === subId);
      if (!matched) return [];
      return (matched.cues || []).map(c => ({
        from: parseFloat(c.from) || 0,
        to: parseFloat(c.to) || 0,
        content: c.content || ""
      })).sort((a, b) => a.from - b.from);
    }

    const cacheKey = `${url}_${transform}`;
    if (subtitleCuesCache.has(cacheKey)) {
      return subtitleCuesCache.get(cacheKey);
    }

    try {
      const bvid = (activeVideoMetadata && activeVideoMetadata.bvid) ? activeVideoMetadata.bvid : "";
      const bvidParam = bvid ? `&bvid=${encodeURIComponent(bvid)}` : "";
      const resp = await apiFetch(`/api/subtitles/proxy?url=${encodeURIComponent(url)}&transform=${encodeURIComponent(transform)}&format=json${bvidParam}`);
      if (resp.ok) {
        const rawCues = await resp.json();
        const cues = (rawCues || []).map(c => ({
          from: parseFloat(c.from) || 0,
          to: parseFloat(c.to) || 0,
          content: c.content || ""
        })).sort((a, b) => a.from - b.from);
        subtitleCuesCache.set(cacheKey, cues);
        return cues;
      }
    } catch (e) {
      console.warn("Could not fetch subtitle track:", e);
    }
    return [];
  }

  function populateSubtitleDropdown(selectEl, role = "primary") {
    if (!selectEl) return;
    const isSecondary = role === "secondary";
    selectEl.innerHTML = `<option value="off">${isSecondary ? "Bottom Sub: Off" : "Top Sub: Off"}</option>`;

    const enCount = activeSubtitles.filter(s => {
      const l = (s.lan || "").toLowerCase();
      const d = s.lan_doc || "";
      return s.transform === "en" || l.includes("en") || d.includes("English") || d.includes("英语") || d.includes("英文");
    }).length;

    if (activeSubtitles.length > 0) {
      activeSubtitles.forEach((s, idx) => {
        const opt = document.createElement("option");
        let shortName = formatSubtitleLabel(s, idx);
        if (shortName === "English (Auto)" && enCount <= 1) {
          shortName = "English";
        }
        opt.value = JSON.stringify({ url: s.url, transform: s.transform || "none", lan: s.lan || "" });
        opt.textContent = trimSubtitleLabel(shortName, 22);
        opt.title = shortName;
        selectEl.appendChild(opt);
      });
    }

    if (rawCustomSrtCues && rawCustomSrtCues.length > 0) {
      const customOpt = document.createElement("option");
      customOpt.value = "custom_srt";
      customOpt.textContent = formatCustomSrtLabel(customSrtDisplayName || customSrtFileName || "SRT", 22);
      customOpt.title = `📁 Custom SRT: ${customSrtDisplayName || customSrtFileName || "SRT"}`;
      selectEl.appendChild(customOpt);
    }

    if (roomSharedSubtitles && roomSharedSubtitles.length > 0) {
      roomSharedSubtitles.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = `shared:${sub.id}`;
        opt.setAttribute("data-shared", "true");
        const trimmedName = trimSubtitleLabel(sub.name, 18);
        opt.textContent = `🌐 ${trimmedName} (Shared)`;
        opt.title = `Shared by ${sub.username || 'Viewer'}: ${sub.name} (${(sub.cues || []).length} cues)`;
        selectEl.appendChild(opt);
      });
    }
  }

  async function loadPrimarySubtitleTrack(val) {
    if (!val || val === "off") {
      primarySubtitleLoadSeq++;
      currentSubtitleCues = [];
      activeSubItem = null;
      try { localStorage.setItem("wp_sub_preference", "off"); } catch (e) {}
      renderLyricsContainer();
      if (player && player.video) renderSubtitlesAtTime(player.video.currentTime);
      updateSrtUIState();
      updateVideoEtaDisplay();
      return;
    }

    let parsed = null;
    if (val === "custom_srt") {
      parsed = { url: "custom_srt", transform: "none", name: customSrtDisplayName || customSrtFileName || "Custom SRT", isCustomSrt: true };
    } else if (val.startsWith("shared:")) {
      const subId = val.slice(7);
      const matched = (roomSharedSubtitles || []).find(s => s.id === subId);
      parsed = { url: val, transform: "none", name: matched ? matched.name : "Shared Subtitles", isShared: true };
    } else {
      try {
        parsed = JSON.parse(val);
      } catch (e) {
        parsed = { url: val, transform: "none" };
      }
      if (activeSubtitles && activeSubtitles.length > 0) {
        const matched = activeSubtitles.find(s => s.url === parsed.url && (s.transform || "none") === (parsed.transform || "none"));
        if (matched) {
          const idx = activeSubtitles.indexOf(matched);
          parsed.name = formatSubtitleLabel(matched, idx >= 0 ? idx : 0);
          parsed.lan = matched.lan;
        }
      }
      if (!parsed.name) parsed.name = "Top Subtitle";
    }

    activeSubItem = parsed;
    try {
      if (parsed.transform && parsed.transform !== "none") {
        localStorage.setItem("wp_sub_preference", parsed.transform);
      } else if (parsed.lan) {
        localStorage.setItem("wp_sub_preference", parsed.lan);
      } else {
        localStorage.setItem("wp_sub_preference", "none");
      }
    } catch (e) {}

    // Immediately clear current cues to avoid displaying stale cues during network fetch
    currentSubtitleCues = [];
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }

    const currentSeq = ++primarySubtitleLoadSeq;
    const cues = await fetchTrackCues(parsed.url, parsed.transform || "none");
    if (currentSeq !== primarySubtitleLoadSeq) return;

    currentSubtitleCues = cues;
    if (currentSubtitleCues.length > 0 && !parsed.isCustomSrt) {
      bilibiliReferenceCues = currentSubtitleCues;
    }

    if (lyricsCard) lyricsCard.classList.remove("hidden");
    renderLyricsContainer();
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
    updateSrtUIState();
    updateVideoEtaDisplay();
  }

  async function loadSecondarySubtitleTrack(val) {
    if (!val || val === "off") {
      secondarySubtitleLoadSeq++;
      secondarySubtitleCues = [];
      activeSecondarySubItem = null;
      try { localStorage.setItem("wp_secondary_sub_preference", "off"); } catch (e) {}
      renderLyricsContainer();
      if (player && player.video) renderSubtitlesAtTime(player.video.currentTime);
      updateSrtUIState();
      return;
    }

    let parsed = null;
    if (val === "custom_srt") {
      parsed = { url: "custom_srt", transform: "none", name: customSrtDisplayName || customSrtFileName || "Custom SRT", isCustomSrt: true };
    } else if (val.startsWith("shared:")) {
      const subId = val.slice(7);
      const matched = (roomSharedSubtitles || []).find(s => s.id === subId);
      parsed = { url: val, transform: "none", name: matched ? matched.name : "Shared Subtitles", isShared: true };
    } else {
      try {
        parsed = JSON.parse(val);
      } catch (e) {
        parsed = { url: val, transform: "none" };
      }
      if (activeSubtitles && activeSubtitles.length > 0) {
        const matched = activeSubtitles.find(s => s.url === parsed.url && (s.transform || "none") === (parsed.transform || "none"));
        if (matched) {
          const idx = activeSubtitles.indexOf(matched);
          parsed.name = formatSubtitleLabel(matched, idx >= 0 ? idx : 0);
          parsed.lan = matched.lan;
        }
      }
      if (!parsed.name) parsed.name = "Bottom Subtitle";
    }

    activeSecondarySubItem = parsed;
    try {
      if (parsed.transform && parsed.transform !== "none") {
        localStorage.setItem("wp_secondary_sub_preference", parsed.transform);
      } else if (parsed.lan) {
        localStorage.setItem("wp_secondary_sub_preference", parsed.lan);
      } else {
        localStorage.setItem("wp_secondary_sub_preference", "none");
      }
    } catch (e) {}

    // Immediately clear secondary cues to avoid displaying stale cues during network fetch
    secondarySubtitleCues = [];
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }

    const currentSeq = ++secondarySubtitleLoadSeq;
    const cues = await fetchTrackCues(parsed.url, parsed.transform || "none");
    if (currentSeq !== secondarySubtitleLoadSeq) return;

    secondarySubtitleCues = cues;

    renderLyricsContainer();
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
    updateSrtUIState();
  }

  async function loadSubtitleTrack(url, transform = "none", name = "Subtitle") {
    if (!url || url === "off") {
      await loadPrimarySubtitleTrack("off");
      return;
    }
    const val = JSON.stringify({ url, transform, name });
    await loadPrimarySubtitleTrack(val);
  }

  async function updateSubtitlesList(subs) {
    activeSubtitles = subs || [];
    subtitleCuesCache.clear();

    populateSubtitleDropdown(elSelectSub, "primary");
    populateSubtitleDropdown(elSelectSecondarySub, "secondary");

    if (activeSubtitles.length === 0 && (!rawCustomSrtCues || rawCustomSrtCues.length === 0) && (!roomSharedSubtitles || roomSharedSubtitles.length === 0)) {
      currentSubtitleCues = [];
      secondarySubtitleCues = [];
      activeSubItem = null;
      activeSecondarySubItem = null;
      if (elSubOverlay) elSubOverlay.classList.add("hidden");
      renderLyricsContainer();
      updateSrtUIState();
      return;
    }

    // 1. Primary (Top) Subtitle Selection:
    const savedPriPref = localStorage.getItem("wp_sub_preference");
    let chosenPriVal = "off";

    if (activeSubItem && activeSubItem.isCustomSrt) {
      chosenPriVal = selectSubtitleOption(elSelectSub, "custom_srt") || "off";
    } else if (activeSubItem && activeSubItem.isShared) {
      chosenPriVal = selectSubtitleOption(elSelectSub, activeSubItem.url) || "off";
    } else if (activeSubItem && activeSubItem.url && activeSubItem.url !== "off") {
      chosenPriVal = selectSubtitleOption(elSelectSub, activeSubItem) || "off";
    } else if (savedPriPref === "off") {
      chosenPriVal = selectSubtitleOption(elSelectSub, "off") || "off";
    } else if (savedPriPref && savedPriPref !== "none") {
      chosenPriVal = selectSubtitleOption(elSelectSub, savedPriPref) || "off";
    }

    if ((chosenPriVal === "off" || !chosenPriVal) && savedPriPref !== "off" && activeSubtitles.length > 0) {
      const firstOpt = elSelectSub && elSelectSub.options.length > 1 ? elSelectSub.options[1].value : "off";
      if (firstOpt !== "off") {
        elSelectSub.value = firstOpt;
        chosenPriVal = firstOpt;
      }
    }

    // 2. Secondary (Bottom) Subtitle Selection:
    const savedSecPref = localStorage.getItem("wp_secondary_sub_preference");
    let chosenSecVal = "off";

    if (activeSecondarySubItem && activeSecondarySubItem.isCustomSrt) {
      chosenSecVal = selectSubtitleOption(elSelectSecondarySub, "custom_srt") || "off";
    } else if (activeSecondarySubItem && activeSecondarySubItem.isShared) {
      chosenSecVal = selectSubtitleOption(elSelectSecondarySub, activeSecondarySubItem.url) || "off";
    } else if (activeSecondarySubItem && activeSecondarySubItem.url && activeSecondarySubItem.url !== "off") {
      chosenSecVal = selectSubtitleOption(elSelectSecondarySub, activeSecondarySubItem) || "off";
    } else if (savedSecPref === "off") {
      chosenSecVal = selectSubtitleOption(elSelectSecondarySub, "off") || "off";
    } else if (savedSecPref && savedSecPref !== "none") {
      chosenSecVal = selectSubtitleOption(elSelectSecondarySub, savedSecPref) || "off";
    } else if (!savedSecPref && activeSubtitles.length > 1) {
      // Default: auto-select English for bottom sub if available!
      chosenSecVal = selectSubtitleOption(elSelectSecondarySub, "en") || "off";
    }

    await Promise.all([
      loadPrimarySubtitleTrack(chosenPriVal),
      loadSecondarySubtitleTrack(chosenSecVal)
    ]);
  }

  // Subs history scrolling state
  let isUserScrolledAway = false;
  let isProgrammaticScroll = false;

  function updateFollowButtonState() {
    if (!btnRecenterLyrics) return;
    const textSpan = btnRecenterLyrics.querySelector("#followLineText");
    if (textSpan) {
      textSpan.textContent = "Follow Line";
    }
    if (isUserScrolledAway) {
      btnRecenterLyrics.classList.add("scrolled-away");
      btnRecenterLyrics.title = "View was manually scrolled. Click to automatically follow current line.";
    } else {
      btnRecenterLyrics.classList.remove("scrolled-away");
      btnRecenterLyrics.title = "Currently following line.";
    }
  }
  const updateRecenterButtonState = updateFollowButtonState;

  if (lyricsContainer) {
    // Only user manual wheel or touch gesture sets isUserScrolledAway
    lyricsContainer.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) > 2 || Math.abs(e.deltaX) > 2) {
        isUserScrolledAway = true;
        updateFollowButtonState();
      }
    }, { passive: true });

    lyricsContainer.addEventListener("touchmove", () => {
      isUserScrolledAway = true;
      updateFollowButtonState();
    }, { passive: true });

    lyricsContainer.addEventListener("pointerdown", (e) => {
      const rect = lyricsContainer.getBoundingClientRect();
      if (e.clientX >= rect.right - 18) {
        isUserScrolledAway = true;
        updateFollowButtonState();
      }
    });
  }

  if (btnRecenterLyrics) {
    btnRecenterLyrics.addEventListener("click", () => {
      isUserScrolledAway = false;
      updateFollowButtonState();
      scrollSubsToCurrent(true);
    });
  }

  function renderLyricsContainer() {
    if (!lyricsContainer) return;
    lyricsContainer.innerHTML = "";
    activeCueIndex = -1;

    const mainCues = (currentSubtitleCues && currentSubtitleCues.length > 0)
      ? currentSubtitleCues
      : (secondarySubtitleCues && secondarySubtitleCues.length > 0 ? secondarySubtitleCues : []);

    const secondCues = (mainCues === currentSubtitleCues && secondarySubtitleCues && secondarySubtitleCues.length > 0)
      ? secondarySubtitleCues
      : [];

    if (!mainCues || mainCues.length === 0) {
      lyricsContainer.innerHTML = '<div class="lyrics-empty">No subtitles active. Select a subtitle track from the Subs menu.</div>';
      return;
    }

    let secIdx = 0;
    mainCues.forEach((cue, idx) => {
      const lineEl = document.createElement("div");
      lineEl.className = "lyrics-line";
      lineEl.id = `lyrics-line-${idx}`;
      lineEl.setAttribute("data-from", cue.from);
      lineEl.setAttribute("data-to", cue.to);

      let secondText = "";
      if (secondCues.length > 0) {
        while (secIdx < secondCues.length && secondCues[secIdx].to <= cue.from) {
          secIdx++;
        }
        for (let s = secIdx; s < secondCues.length && secondCues[s].from < cue.to; s++) {
          const sc = secondCues[s];
          if (Math.max(cue.from, sc.from) < Math.min(cue.to, sc.to)) {
            secondText = sc.content;
            break;
          }
        }
      }

      lineEl.innerHTML = `
        <span class="lyrics-time">${formatTime(cue.from)}</span>
        <div class="lyrics-content">
          <div class="lyrics-line-top">${escapeHtml(cue.content)}</div>
          ${secondText ? `<div class="lyrics-line-bottom">${escapeHtml(secondText)}</div>` : ''}
        </div>
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

  // Subtitle offset / delay state
  let subtitleOffsetSec = 0.0;
  try {
    const savedSubOffset = localStorage.getItem("wp_subtitle_offset");
    if (savedSubOffset !== null && !isNaN(parseFloat(savedSubOffset))) {
      subtitleOffsetSec = parseFloat(savedSubOffset);
    }
  } catch (e) {}

  function updateSubOffsetUI() {
    const pill = document.getElementById("subOffsetDisplay");
    if (pill) {
      const sign = subtitleOffsetSec > 0 ? "+" : "";
      pill.textContent = `${sign}${subtitleOffsetSec.toFixed(1)}s`;
      pill.classList.toggle("shifted", Math.abs(subtitleOffsetSec) > 0.01);
    }
  }

  let subDelayHudTimer = null;
  function showSubDelayHud(text) {
    const hud = document.getElementById("subDelayHud");
    const hudText = document.getElementById("subDelayHudText");
    if (!hud) return;
    if (hudText && text) hudText.textContent = text;
    hud.classList.remove("hidden");
    if (subDelayHudTimer) clearTimeout(subDelayHudTimer);
    subDelayHudTimer = setTimeout(() => {
      hud.classList.add("hidden");
    }, 1400);
  }

  function nudgeSubtitleOffset(delta) {
    subtitleOffsetSec = Math.round((subtitleOffsetSec + delta) * 10) / 10;
    try {
      localStorage.setItem("wp_subtitle_offset", subtitleOffsetSec.toString());
    } catch (e) {}
    updateSubOffsetUI();
    const sign = subtitleOffsetSec > 0 ? "+" : "";
    showSubDelayHud(`⏱️ Sub Delay: ${sign}${subtitleOffsetSec.toFixed(1)}s`);
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
  }

  function resetSubtitleOffset() {
    subtitleOffsetSec = 0.0;
    try {
      localStorage.setItem("wp_subtitle_offset", "0");
    } catch (e) {}
    updateSubOffsetUI();
    showSubDelayHud("⏱️ Sub Delay: 0.0s (Reset)");
    if (player && player.video && !isNaN(player.video.currentTime)) {
      renderSubtitlesAtTime(player.video.currentTime);
    }
  }

  function renderSubtitlesAtTime(currentTime) {
    ensureSubtitleDOMElements();

    const hasTop = currentSubtitleCues && currentSubtitleCues.length > 0 && activeSubItem && activeSubItem.url !== "off";
    const hasBottom = secondarySubtitleCues && secondarySubtitleCues.length > 0 && activeSecondarySubItem && activeSecondarySubItem.url !== "off";

    if (!elSubOverlay || (!hasTop && !hasBottom)) {
      if (elSubOverlay) elSubOverlay.classList.add("hidden");
      if (elSubTop) elSubTop.textContent = "";
      if (elSubBottom) elSubBottom.textContent = "";
      return;
    }

    const effectiveTime = currentTime - subtitleOffsetSec;

    // 1. Search Top cue (active speech right now) and anchor cue
    let topText = "";
    let speakingIdx = -1;
    let anchorIdx = -1;

    if (hasTop) {
      for (let i = 0; i < currentSubtitleCues.length; i++) {
        const c = currentSubtitleCues[i];
        if (effectiveTime >= (c.from - 0.05) && effectiveTime <= (c.to + 0.15)) {
          speakingIdx = i;
          anchorIdx = i;
          topText = c.content;
          break;
        }
        if (c.from <= effectiveTime) {
          anchorIdx = i; // Retain last cue spoken prior to effectiveTime
        } else {
          break;
        }
      }
    }

    // 2. Search Bottom cue (active speech right now)
    let bottomText = "";
    if (hasBottom) {
      for (let i = 0; i < secondarySubtitleCues.length; i++) {
        const c = secondarySubtitleCues[i];
        if (effectiveTime >= (c.from - 0.05) && effectiveTime <= (c.to + 0.15)) {
          bottomText = c.content;
          if (anchorIdx === -1 && !hasTop) {
            anchorIdx = i;
          }
          break;
        }
        if (c.from > effectiveTime + 0.2) {
          break;
        }
      }
    }

    // 3. Update Video Player Overlay
    if (topText || bottomText) {
      elSubOverlay.classList.remove("hidden");
      if (elSubTop) {
        elSubTop.textContent = topText;
        elSubTop.classList.toggle("hidden", !topText);
      }
      if (elSubBottom) {
        elSubBottom.textContent = bottomText;
        elSubBottom.classList.toggle("hidden", !bottomText);
      }
      if (elSubText && (!elSubTop || !elSubBottom)) {
        elSubText.textContent = (topText && bottomText) ? `${topText}\n${bottomText}` : (topText || bottomText);
      }
    } else {
      elSubOverlay.classList.add("hidden");
      if (elSubTop) elSubTop.textContent = "";
      if (elSubBottom) elSubBottom.textContent = "";
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

  // 3. Initialize Player Controller, Minimap & Bookmarks
  const player = new PlayerController("videoPlayer", {
    onStateChange: (state) => {
      sendProgressUpdate(state);
    }
  });

  function bindSubtitleSelectEvents() {
    elSelectSub = elSelectSub || document.getElementById("selectSubtitle");
    if (elSelectSub && !elSelectSub.dataset.subBound) {
      elSelectSub.dataset.subBound = "true";
      elSelectSub.addEventListener("change", (e) => {
        const val = e.target.value;
        const selOpt = e.target.options[e.target.selectedIndex];
        if (val === "off") {
          elSelectSub.title = "Top Sub: Off";
        } else if (val === "custom_srt") {
          const display = customSrtDisplayName || customSrtFileName || "SRT";
          elSelectSub.title = `📁 Custom SRT: ${display}`;
        } else {
          elSelectSub.title = selOpt ? (selOpt.title || selOpt.textContent) : "Select Top Subtitle";
        }
        loadPrimarySubtitleTrack(val);
      });
    }

    elSelectSecondarySub = elSelectSecondarySub || document.getElementById("selectSecondarySubtitle");
    if (elSelectSecondarySub && !elSelectSecondarySub.dataset.subBound) {
      elSelectSecondarySub.dataset.subBound = "true";
      elSelectSecondarySub.addEventListener("change", (e) => {
        const val = e.target.value;
        const selOpt = e.target.options[e.target.selectedIndex];
        if (val === "off") {
          elSelectSecondarySub.title = "Bottom Sub: Off";
        } else if (val === "custom_srt") {
          const display = customSrtDisplayName || customSrtFileName || "SRT";
          elSelectSecondarySub.title = `📁 Custom SRT: ${display}`;
        } else {
          elSelectSecondarySub.title = selOpt ? (selOpt.title || selOpt.textContent) : "Select Bottom Subtitle";
        }
        loadSecondarySubtitleTrack(val);
      });
    }
  }

  function bindCustomSrtEvents() {
    inputCustomSrt = document.getElementById("inputCustomSrt");
    btnUploadSrt = document.getElementById("btnUploadSrt");
    btnUploadSrtViewer = document.getElementById("btnUploadSrtViewer");
    btnRenameCustomSrt = document.getElementById("btnRenameCustomSrt");
    btnDeleteCustomSrt = document.getElementById("btnDeleteCustomSrt");
    btnDeleteCustomSrtViewer = document.getElementById("btnDeleteCustomSrtViewer");
    btnShareCustomSrt = document.getElementById("btnShareCustomSrt");
    selectSrtSyncMode = document.getElementById("selectSrtSyncMode");

    if (btnUploadSrt && !btnUploadSrt.dataset.srtBound) {
      btnUploadSrt.dataset.srtBound = "true";
      btnUploadSrt.addEventListener("click", () => {
        if (inputCustomSrt) inputCustomSrt.click();
      });
    }
    if (btnUploadSrtViewer && !btnUploadSrtViewer.dataset.srtBound) {
      btnUploadSrtViewer.dataset.srtBound = "true";
      btnUploadSrtViewer.addEventListener("click", () => {
        if (inputCustomSrt) inputCustomSrt.click();
      });
    }
    if (btnRenameCustomSrt && !btnRenameCustomSrt.dataset.srtBound) {
      btnRenameCustomSrt.dataset.srtBound = "true";
      btnRenameCustomSrt.addEventListener("click", () => {
        renameCustomSrt();
      });
    }
    if (btnDeleteCustomSrt && !btnDeleteCustomSrt.dataset.srtBound) {
      btnDeleteCustomSrt.dataset.srtBound = "true";
      btnDeleteCustomSrt.addEventListener("click", () => {
        deleteCustomSrt();
      });
    }
    if (btnDeleteCustomSrtViewer && !btnDeleteCustomSrtViewer.dataset.srtBound) {
      btnDeleteCustomSrtViewer.dataset.srtBound = "true";
      btnDeleteCustomSrtViewer.addEventListener("click", () => {
        deleteCustomSrt();
      });
    }
    if (btnShareCustomSrt && !btnShareCustomSrt.dataset.srtBound) {
      btnShareCustomSrt.dataset.srtBound = "true";
      btnShareCustomSrt.addEventListener("click", () => {
        shareCustomSrtWithRoom();
      });
    }
    if (inputCustomSrt && !inputCustomSrt.dataset.srtBound) {
      inputCustomSrt.dataset.srtBound = "true";
      inputCustomSrt.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            loadCustomSrtText(evt.target.result, file.name);
          };
          reader.readAsText(file);
        }
        e.target.value = "";
      });
    }
    if (selectSrtSyncMode && !selectSrtSyncMode.dataset.srtBound) {
      selectSrtSyncMode.dataset.srtBound = "true";
      selectSrtSyncMode.addEventListener("change", (e) => {
        applyCustomSrtSync(e.target.value);
      });
    }
  }

  function initMoreSubSettingsModal() {
    let modal = document.getElementById("moreSubSettingsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "moreSubSettingsModal";
      modal.className = "modal-backdrop hidden";
      modal.innerHTML = `
        <div class="modal-card sub-settings-card">
          <div class="modal-header">
            <h3>⚙️ More Subtitle Settings</h3>
            <button id="btnCloseMoreSubModal" class="btn-close" title="Close">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Subtitle Delay Nudger -->
            <div class="sub-settings-section">
              <div class="sub-settings-section-header">
                <label class="modal-section-label">Subtitle Delay / Offset</label>
                <div class="sub-offset-header-right">
                  <span id="subOffsetDisplay" class="sub-offset-pill" title="Current subtitle delay (keyboard keys: [ and ])">0.0s</span>
                  <button type="button" id="btnSubOffsetReset" class="btn-toolbar sub-offset-btn reset" title="Reset delay to 0.0s (keyboard key: \\)">↺</button>
                </div>
              </div>
              <div class="sub-offset-btn-bar">
                <button type="button" id="btnSubOffsetMinus05" class="btn-toolbar sub-offset-btn" title="Subtitles earlier by -0.5s">-0.5s</button>
                <button type="button" id="btnSubOffsetMinus01" class="btn-toolbar sub-offset-btn" title="Subtitles earlier by -0.1s (Key: [)">-0.1s</button>
                <button type="button" id="btnSubOffsetPlus01" class="btn-toolbar sub-offset-btn" title="Subtitles later by +0.1s (Key: ])">+0.1s</button>
                <button type="button" id="btnSubOffsetPlus05" class="btn-toolbar sub-offset-btn" title="Subtitles later by +0.5s">+0.5s</button>
              </div>
              <span class="sub-settings-hint">Shortcuts: <code>[</code> and <code>]</code> adjust delay &plusmn;0.1s, <code>\\</code> resets to 0.0s.</span>
            </div>

            <!-- Custom SRT Subtitle Upload -->
            <div class="sub-settings-section">
              <label class="modal-section-label">Custom SRT File</label>
              <div class="settings-srt-controls">
                <input type="file" id="inputCustomSrt" accept=".srt,text/plain" class="hidden" style="display: none !important;" />
                <button type="button" id="btnUploadSrt" class="btn-toolbar btn-settings-upload-srt" title="Upload custom .srt subtitle file">
                  <span>📁</span> <span id="labelUploadSrt">Upload .srt</span>
                </button>
                <button type="button" id="btnRenameCustomSrt" class="btn-toolbar btn-settings-rename-srt hidden" title="Rename custom subtitle display name">
                  <span>✏️</span>
                </button>
                <button type="button" id="btnDeleteCustomSrt" class="btn-toolbar btn-settings-delete-srt hidden" title="Delete custom uploaded subtitle">
                  <span>🗑️</span>
                </button>
              </div>

              <!-- Room Share Subtitle Row -->
              <div id="customSrtShareRow" class="sub-settings-row hidden" style="margin-top: 8px;">
                <span class="sub-settings-label">Room Share</span>
                <button type="button" id="btnShareCustomSrt" class="btn-toolbar btn-settings-share-srt" title="Share custom subtitles with everyone in the room">
                  <span id="iconShareSrt">📢</span> <span id="labelShareSrt">Share with Room</span>
                </button>
              </div>

              <!-- Custom SRT Sync Mode Option -->
              <div id="customSrtOptionsRow" class="sub-settings-row hidden" style="margin-top: 8px;">
                <label for="selectSrtSyncMode" class="sub-settings-label">SRT Timing</label>
                <select id="selectSrtSyncMode" class="select-toolbar select-settings" title="Select timing mode for custom SRT">
                  <option value="as-is">As-Is (SRT Timestamps)</option>
                  <option value="bilibili-sync">Auto-Sync (Bilibili 1st &amp; Last Line)</option>
                </select>
              </div>

              <div id="customSrtInfoRow" class="sub-settings-row settings-srt-info hidden" style="margin-top: 6px;">
                <span id="customSrtInfoText" class="settings-srt-info-text"></span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" id="btnDoneMoreSubModal" class="btn-primary">Done</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Bind open button in Settings menu
    const btnOpenMoreSub = document.getElementById("btnOpenMoreSubSettings");
    if (btnOpenMoreSub && !btnOpenMoreSub.dataset.subModalBound) {
      btnOpenMoreSub.dataset.subModalBound = "true";
      btnOpenMoreSub.addEventListener("click", () => {
        const sMenu = toolbarSettingsMenu || document.getElementById("toolbarSettingsMenu");
        const sBtn = btnToolbarSettings || document.getElementById("btnToolbarSettings");
        if (sMenu) sMenu.classList.add("hidden");
        if (sBtn) sBtn.classList.remove("active");
        const m = document.getElementById("moreSubSettingsModal");
        if (m) {
          m.classList.remove("hidden");
          if (typeof updateSubOffsetUI === "function") updateSubOffsetUI();
          if (typeof updateSrtUIState === "function") updateSrtUIState();
        }
      });
    }

    // Bind modal close buttons
    const btnClose = document.getElementById("btnCloseMoreSubModal");
    if (btnClose && !btnClose.dataset.subModalBound) {
      btnClose.dataset.subModalBound = "true";
      btnClose.addEventListener("click", () => {
        const m = document.getElementById("moreSubSettingsModal");
        if (m) m.classList.add("hidden");
      });
    }

    const btnDone = document.getElementById("btnDoneMoreSubModal");
    if (btnDone && !btnDone.dataset.subModalBound) {
      btnDone.dataset.subModalBound = "true";
      btnDone.addEventListener("click", () => {
        const m = document.getElementById("moreSubSettingsModal");
        if (m) m.classList.add("hidden");
      });
    }

    if (modal && !modal.dataset.backdropBound) {
      modal.dataset.backdropBound = "true";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }

    if (typeof initSubOffsetControls === "function") initSubOffsetControls();
    bindCustomSrtEvents();
    if (typeof updateSrtUIState === "function") updateSrtUIState();
  }

  // Ensure Bookmark UI elements exist (even if index.html is cached on GitHub Pages)
  function ensureBookmarkElements() {
    // Ensure Player Toolbar is placed above the Video Player Wrapper (even on cached HTML / GitHub Pages)
    const pWrap = document.querySelector(".player-wrapper");
    const pToolbar = document.querySelector(".player-toolbar");
    const thContainer = document.getElementById("playerTheaterContainer");
    if (pWrap && pToolbar && thContainer) {
      if (pToolbar.nextElementSibling !== pWrap) {
        thContainer.insertBefore(pToolbar, pWrap);
      }
    }

    // Completely remove top navigation bar if present from older cached HTML
    document.querySelectorAll(".top-nav").forEach(el => el.remove());

    // Remove redundant emoji button from chat input form (even on older/cached HTML or GitHub Pages)
    document.querySelectorAll(".btn-emoji-trigger, #btnToggleChatEmoji").forEach(el => el.remove());

    // Ensure Connection Status Dot and User Profile button exist in toolbar-right
    const toolbarRight = document.querySelector(".player-toolbar .toolbar-right");
    if (toolbarRight) {
      let connDot = document.getElementById("connStatus");
      if (!connDot || !toolbarRight.contains(connDot)) {
        if (connDot) connDot.remove();
        connDot = document.createElement("span");
        connDot.id = "connStatus";
        connDot.className = "connection-status-dot connected";
        connDot.title = "Connected";
        toolbarRight.insertBefore(connDot, toolbarRight.firstChild);
      } else {
        connDot.className = "connection-status-dot " + (connDot.classList.contains("disconnected") ? "disconnected" : "connected");
      }

      let editBtn = document.getElementById("btnEditProfile");
      if (!editBtn || !toolbarRight.contains(editBtn)) {
        if (editBtn) editBtn.remove();
        editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.id = "btnEditProfile";
        editBtn.className = "btn-toolbar btn-user-profile-toolbar";
        editBtn.title = "Customize Appearance (Avatar & Color)";
        editBtn.innerHTML = `<span id="userAvatarBadge" class="avatar-badge">👤</span>`;
        if (connDot && connDot.nextSibling) {
          toolbarRight.insertBefore(editBtn, connDot.nextSibling);
        } else {
          toolbarRight.insertBefore(editBtn, toolbarRight.firstChild);
        }
        editBtn.addEventListener("click", () => {
          selectedAvatar = userAvatar;
          selectedColor = userColor;
          updateProfilePreview();
          renderAvatarPicker();
          renderColorPicker();
          if (profileModal) profileModal.classList.remove("hidden");
        });
      }
    }

    if (btnReloadVideo) {
      btnReloadVideo.textContent = "Reload";
    }
    const toolbarLeft = document.querySelector(".player-toolbar .toolbar-left");
    if (toolbarLeft && !document.getElementById("btnAddPersonalBookmark")) {
      const group = document.createElement("div");
      group.className = "toolbar-group bookmark-group";
      group.innerHTML = `
        <button type="button" id="btnAddPersonalBookmark" class="btn-toolbar btn-bookmark-personal" title="Save a personal bookmark at current time (only visible to you)">
          Bookmark (Me)
        </button>
        <button type="button" id="btnAddSharedBookmark" class="btn-toolbar btn-bookmark-shared" title="Create a shared bookmark at current time for everyone in the room">
          Bookmark (Shared)
        </button>
      `;
      toolbarLeft.appendChild(group);
    } else {
      const pBtn = document.getElementById("btnAddPersonalBookmark");
      const sBtn = document.getElementById("btnAddSharedBookmark");
      if (pBtn) pBtn.textContent = "Bookmark (Me)";
      if (sBtn) sBtn.textContent = "Bookmark (Shared)";
    }

    const minimapCard = document.getElementById("videoMinimapCard");
    if (minimapCard && !document.getElementById("bookmarksBar")) {
      const bar = document.createElement("div");
      bar.id = "bookmarksBar";
      bar.className = "bookmarks-bar hidden";
      minimapCard.appendChild(bar);
    }

    if (!document.getElementById("bookmarkContextMenu")) {
      const menu = document.createElement("div");
      menu.id = "bookmarkContextMenu";
      menu.className = "bookmark-context-menu hidden";
      menu.innerHTML = `
        <div id="bookmarkContextHeader" class="bookmark-context-header">Bookmark</div>
        <button type="button" id="btnBookmarkContextJump" class="bookmark-context-item">
          <span>▶</span> <span id="bookmarkContextJumpText">Jump to Time</span>
        </button>
        <button type="button" id="btnBookmarkContextDelete" class="bookmark-context-item danger">
          <span>🗑️</span> <span>Delete Bookmark</span>
        </button>
      `;
      document.body.appendChild(menu);
    }

    // Ensure Danmaku (Beta) overlay & toggle button exist
    const playerWrapper = document.querySelector(".player-wrapper");
    if (playerWrapper && !document.getElementById("danmakuOverlay")) {
      const dmOverlay = document.createElement("div");
      dmOverlay.id = "danmakuOverlay";
      dmOverlay.className = "danmaku-overlay hidden";
      playerWrapper.insertBefore(dmOverlay, playerWrapper.firstChild.nextSibling);
    }

    // Ensure "Top Sub" label and update default option
    const subLabel = document.querySelector('label[for="selectSubtitle"]');
    if (subLabel) {
      subLabel.textContent = "Top Sub";
    }
    if (elSelectSub) {
      const offOpt = elSelectSub.querySelector('option[value="off"]');
      if (offOpt) {
        offOpt.textContent = "Top Sub: Off";
      }
    }

    // Ensure Video Source menu exists on toolbar
    if (toolbarRight && !document.getElementById("btnToolbarVideoSource")) {
      const vsWrapper = document.createElement("div");
      vsWrapper.className = "toolbar-menu-wrapper";
      vsWrapper.innerHTML = `
        <button type="button" id="btnToolbarVideoSource" class="btn-toolbar btn-settings-menu btn-source-menu" title="Change Video Source / Load Bilibili Video">
          <span class="source-icon">🎬</span>
          <span>Video Source</span>
        </button>
        <div id="toolbarVideoSourceMenu" class="toolbar-settings-menu video-source-menu hidden">
          <div class="settings-menu-header">
            <span class="settings-menu-title">Video Source</span>
            <button type="button" id="btnCloseVideoSource" class="btn-close-settings" title="Close">&times;</button>
          </div>
          <div class="settings-menu-body" id="videoSourceMenuBody"></div>
        </div>
      `;
      const settingsWrapper = document.getElementById("btnToolbarSettings")?.parentElement;
      if (settingsWrapper) {
        toolbarRight.insertBefore(vsWrapper, settingsWrapper);
      } else {
        toolbarRight.appendChild(vsWrapper);
      }

      const vsBody = vsWrapper.querySelector("#videoSourceMenuBody");
      const oldControlPanel = document.querySelector(".control-panel-card");
      if (oldControlPanel && vsBody) {
        const inputGroup = oldControlPanel.querySelector(".video-input-group");
        if (inputGroup) {
          inputGroup.className = "source-input-row";
          vsBody.appendChild(inputGroup);
        }
        const epGroup = oldControlPanel.querySelector("#episodeGroup");
        if (epGroup) vsBody.appendChild(epGroup);
        const div = document.createElement("div");
        div.className = "settings-menu-divider";
        vsBody.appendChild(div);
        const hostRow = oldControlPanel.querySelector("#hostControlsRow");
        if (hostRow) {
          hostRow.className = "source-menu-room-controls";
          vsBody.appendChild(hostRow);
        }
        oldControlPanel.remove();
      }
    }

    // Ensure Settings / More menu exists on toolbar
    if (toolbarRight && !document.getElementById("btnToolbarSettings")) {
      const menuWrapper = document.createElement("div");
      menuWrapper.className = "toolbar-menu-wrapper";
      menuWrapper.innerHTML = `
        <button type="button" id="btnToolbarSettings" class="btn-toolbar btn-settings-menu" title="Player Settings & Options">
          <span class="settings-icon">⚙️</span>
          <span>More</span>
        </button>
        <div id="toolbarSettingsMenu" class="toolbar-settings-menu hidden">
          <div class="settings-menu-header">
            <span class="settings-menu-title">Settings</span>
            <button type="button" id="btnCloseToolbarSettings" class="btn-close-settings" title="Close Settings">&times;</button>
          </div>
          <div class="settings-menu-body" id="settingsMenuBody"></div>
        </div>
      `;
      toolbarRight.appendChild(menuWrapper);

      const menuBody = menuWrapper.querySelector("#settingsMenuBody");
      const speedGroup = document.querySelector(".player-toolbar .speed-group") || document.querySelector(".player-toolbar label[for='selectPlaybackSpeed']")?.parentElement;
      if (speedGroup && menuBody) {
        speedGroup.className = "settings-menu-row";
        menuBody.appendChild(speedGroup);
      }
      const qualityGroup = document.querySelector(".player-toolbar .quality-group");
      if (qualityGroup && menuBody) {
        qualityGroup.className = "settings-menu-row";
        menuBody.appendChild(qualityGroup);
      }
      const d1 = document.createElement("div");
      d1.className = "settings-menu-divider";
      menuBody.appendChild(d1);

      const subEl = document.getElementById("selectSubtitle");
      if (subEl && menuBody) {
        const row = document.createElement("div");
        row.className = "settings-menu-row";
        row.innerHTML = `<label for="selectSubtitle" class="settings-row-label">Top Sub</label>`;
        row.appendChild(subEl);
        menuBody.appendChild(row);
      }
      const subSecEl = document.getElementById("selectSecondarySubtitle");
      if (subSecEl && menuBody) {
        const row = document.createElement("div");
        row.className = "settings-menu-row";
        row.innerHTML = `<label for="selectSecondarySubtitle" class="settings-row-label">Bottom Sub</label>`;
        row.appendChild(subSecEl);
        menuBody.appendChild(row);
      }
      const subSizeEl = document.getElementById("selectSubSize");
      if (subSizeEl && menuBody) {
        const row = document.createElement("div");
        row.className = "settings-menu-row";
        row.innerHTML = `<label for="selectSubSize" class="settings-row-label">Sub Size</label>`;
        row.appendChild(subSizeEl);
        menuBody.appendChild(row);
      }

      // More Subtitle Settings row
      const moreSubRow = document.createElement("div");
      moreSubRow.className = "settings-menu-row";
      moreSubRow.innerHTML = `
        <button type="button" id="btnOpenMoreSubSettings" class="btn-settings-more-subs" title="More Subtitle Settings (Sub Delay & Custom SRT)">
          <span>⚙️</span> <span>More Subtitle Settings</span>
        </button>
      `;
      menuBody.appendChild(moreSubRow);

      const d2 = document.createElement("div");
      d2.className = "settings-menu-divider";
      menuBody.appendChild(d2);

      const dmRow = document.createElement("div");
      dmRow.className = "settings-menu-row";
      dmRow.innerHTML = `
        <span class="settings-row-label">Danmaku</span>
        <div class="settings-danmaku-btns">
          <button type="button" id="btnToggleDanmaku" class="btn-toolbar btn-danmaku-toggle active" title="Toggle Bilibili scrolling user comments overlay">
            <span>弹</span><span id="danmakuStateLabel" class="danmaku-state-label">On</span>
          </button>
          <button type="button" id="btnToggleDanmakuTrad" class="btn-toolbar btn-danmaku-trad" title="Toggle Danmaku Traditional Chinese (繁體中文)">
            <span>繁</span>
          </button>
        </div>
      `;
      menuBody.appendChild(dmRow);

      const reloadBtn = document.getElementById("btnReloadVideo");
      if (reloadBtn) {
        const actRow = document.createElement("div");
        actRow.className = "settings-menu-action-row";
        reloadBtn.className = "btn-settings-reload";
        reloadBtn.innerHTML = `<span>🔄</span> <span>Reload Stream</span>`;
        actRow.appendChild(reloadBtn);
        menuBody.appendChild(actRow);
      }
      const oldSubGroup = document.querySelector(".player-toolbar .subtitle-group");
      if (oldSubGroup && oldSubGroup !== menuWrapper) oldSubGroup.remove();
    }

    // Ensure Danmaku buttons always exist inside the settings menu (even on cached DOM)
    const currentSettingsMenu = document.getElementById("toolbarSettingsMenu");

    // Ensure Secondary (Bottom) Subtitle selector exists in Settings menu if missing (e.g. cached HTML / GitHub Pages)
    if (currentSettingsMenu && !document.getElementById("selectSecondarySubtitle")) {
      const menuBody = currentSettingsMenu.querySelector(".settings-menu-body");
      if (menuBody) {
        const secRow = document.createElement("div");
        secRow.className = "settings-menu-row";
        secRow.innerHTML = `
          <label for="selectSecondarySubtitle" class="settings-row-label">Bottom Sub</label>
          <select id="selectSecondarySubtitle" class="select-toolbar select-settings" title="Select Bottom Subtitle Track (e.g. English)">
            <option value="off">Bottom Sub: Off</option>
          </select>
        `;
        const subEl = document.getElementById("selectSubtitle");
        const subRow = subEl ? subEl.closest(".settings-menu-row") : null;
        if (subRow && subRow.nextSibling) {
          menuBody.insertBefore(secRow, subRow.nextSibling);
        } else if (subRow) {
          menuBody.appendChild(secRow);
        } else {
          menuBody.appendChild(secRow);
        }
      }
    }
    if (currentSettingsMenu && !document.getElementById("btnToggleDanmaku")) {
      const menuBody = currentSettingsMenu.querySelector(".settings-menu-body");
      if (menuBody) {
        const dDivider = document.createElement("div");
        dDivider.className = "settings-menu-divider";
        const dmRow = document.createElement("div");
        dmRow.className = "settings-menu-row";
        dmRow.innerHTML = `
          <span class="settings-row-label">Danmaku</span>
          <div class="settings-danmaku-btns">
            <button type="button" id="btnToggleDanmaku" class="btn-toolbar btn-danmaku-toggle active" title="Toggle Bilibili scrolling user comments overlay">
              <span>弹</span><span id="danmakuStateLabel" class="danmaku-state-label">On</span>
            </button>
            <button type="button" id="btnToggleDanmakuTrad" class="btn-toolbar btn-danmaku-trad" title="Toggle Danmaku Traditional Chinese (繁體中文)">
              <span>繁</span>
            </button>
          </div>
        `;
        const actRow = menuBody.querySelector(".settings-menu-action-row");
        if (actRow) {
          menuBody.insertBefore(dDivider, actRow);
          menuBody.insertBefore(dmRow, actRow);
        } else {
          menuBody.appendChild(dDivider);
          menuBody.appendChild(dmRow);
        }
      }
    }

    // Remove Sub Delay and Custom SRT from main Settings menu (moved to More Subtitle Settings popup)
    if (currentSettingsMenu) {
      currentSettingsMenu.querySelectorAll(".settings-sub-delay-col, .settings-srt-row, #customSrtShareRow, #customSrtOptionsRow, #customSrtInfoRow").forEach(el => el.remove());
    }

    // Ensure More Subtitle Settings button exists in Settings menu
    if (currentSettingsMenu && !document.getElementById("btnOpenMoreSubSettings")) {
      const menuBody = currentSettingsMenu.querySelector(".settings-menu-body");
      if (menuBody) {
        const moreRow = document.createElement("div");
        moreRow.className = "settings-menu-row";
        moreRow.innerHTML = `
          <button type="button" id="btnOpenMoreSubSettings" class="btn-settings-more-subs" title="More Subtitle Settings (Sub Delay & Custom SRT)">
            <span>⚙️</span> <span>More Subtitle Settings</span>
          </button>
        `;
        const subSizeRow = menuBody.querySelector("label[for='selectSubSize']")?.parentElement;
        if (subSizeRow && subSizeRow.nextSibling) {
          menuBody.insertBefore(moreRow, subSizeRow.nextSibling);
        } else {
          menuBody.appendChild(moreRow);
        }
      }
    }

    // Initialize More Subtitle Settings modal and event bindings
    initMoreSubSettingsModal();

    // Ensure Room Synchronization Settings button exists in Video Source menu
    const currentVideoSourceMenu = document.getElementById("toolbarVideoSourceMenu");
    if (currentVideoSourceMenu && !document.getElementById("btnOpenSettings")) {
      const vsBody = currentVideoSourceMenu.querySelector(".settings-menu-body");
      if (vsBody) {
        const div = document.createElement("div");
        div.className = "settings-menu-divider";
        const act = document.createElement("div");
        act.className = "source-menu-action-row";
        act.innerHTML = `
          <button type="button" id="btnOpenSettings" class="btn-source-sync-settings" title="Room Synchronization Settings">
            <span>⚙️</span> <span>Room Sync Settings</span>
          </button>
        `;
        vsBody.appendChild(div);
        vsBody.appendChild(act);
        const b = act.querySelector("#btnOpenSettings");
        if (b) {
          b.addEventListener("click", () => {
            const vMenu = toolbarVideoSourceMenu || document.getElementById("toolbarVideoSourceMenu");
            const vBtn = btnToolbarVideoSource || document.getElementById("btnToolbarVideoSource");
            const sModal = settingsModal || document.getElementById("settingsModal");
            if (vMenu) vMenu.classList.add("hidden");
            if (vBtn) vBtn.classList.remove("active");
            if (sModal) sModal.classList.remove("hidden");
          });
        }
      }
    }

    // Ensure Room PIN row exists in Settings / More menu
    if (currentSettingsMenu && !document.getElementById("roomPinDisplay")) {
      const sBody = currentSettingsMenu.querySelector(".settings-menu-body");
      if (sBody) {
        const pinRow = document.createElement("div");
        pinRow.className = "settings-menu-row settings-pin-row";
        pinRow.innerHTML = `
          <span class="settings-row-label">Room PIN</span>
          <div class="settings-pin-box">
            <span id="roomPinDisplay" class="pin-code">${roomPin || pendingPin || "----"}</span>
            <button type="button" id="btnCopyPin" class="btn-toolbar btn-copy-pin" title="Copy room PIN">📋</button>
          </div>
        `;
        const div = document.createElement("div");
        div.className = "settings-menu-divider";
        sBody.insertBefore(div, sBody.firstChild);
        sBody.insertBefore(pinRow, div);
        const cpBtn = pinRow.querySelector("#btnCopyPin");
        if (cpBtn) {
          cpBtn.addEventListener("click", () => {
            const activePin = roomPin || pendingPin;
            if (activePin) {
              navigator.clipboard.writeText(activePin).then(() => {
                const original = cpBtn.textContent;
                cpBtn.textContent = "✅";
                setTimeout(() => cpBtn.textContent = original, 1500);
              });
            }
          });
        }
      }
    }

    // Refresh SRT references
    inputCustomSrt = document.getElementById("inputCustomSrt");
    btnUploadSrt = document.getElementById("btnUploadSrt");
    btnUploadSrtViewer = document.getElementById("btnUploadSrtViewer");
    btnRenameCustomSrt = document.getElementById("btnRenameCustomSrt");
    btnDeleteCustomSrt = document.getElementById("btnDeleteCustomSrt");
    btnDeleteCustomSrtViewer = document.getElementById("btnDeleteCustomSrtViewer");
    customSrtShareRow = document.getElementById("customSrtShareRow");
    btnShareCustomSrt = document.getElementById("btnShareCustomSrt");
    iconShareSrt = document.getElementById("iconShareSrt");
    labelShareSrt = document.getElementById("labelShareSrt");
    customSrtOptionsRow = document.getElementById("customSrtOptionsRow");
    selectSrtSyncMode = document.getElementById("selectSrtSyncMode");
    customSrtInfoRow = document.getElementById("customSrtInfoRow");
    customSrtInfoText = document.getElementById("customSrtInfoText");
    labelUploadSrt = document.getElementById("labelUploadSrt");
    elSelectSub = document.getElementById("selectSubtitle");
    elSelectSecondarySub = document.getElementById("selectSecondarySubtitle");
    bindSubtitleSelectEvents();

    if (activeSubtitles && activeSubtitles.length > 0) {
      if (elSelectSub && elSelectSub.options.length <= 1) {
        populateSubtitleDropdown(elSelectSub, "primary");
        if (activeSubItem) {
          selectSubtitleOption(elSelectSub, activeSubItem);
        }
      }
      if (elSelectSecondarySub && elSelectSecondarySub.options.length <= 1) {
        populateSubtitleDropdown(elSelectSecondarySub, "secondary");
        if (activeSecondarySubItem) {
          selectSubtitleOption(elSelectSecondarySub, activeSecondarySubItem);
        }
      }
    }

    ensureSubtitleDOMElements();

    // Ensure Chat card title is "Chat" (no emoji)
    const chatHeader = document.querySelector(".chat-card .sidebar-card-header h3");
    if (chatHeader) {
      chatHeader.textContent = "Chat";
    }

    // Ensure Follow Line button text
    const recenterBtn = document.getElementById("btnRecenterLyrics");
    if (recenterBtn) {
      const textSpan = recenterBtn.querySelector("#followLineText");
      if (textSpan) {
        textSpan.textContent = "Follow Line";
      } else {
        recenterBtn.innerHTML = `<span class="recenter-icon">🎯</span> <span id="followLineText">Follow Line</span>`;
      }
    }

    // Ensure Subtitles title is "Subtitles" (no emoji)
    const lyricsTitle = document.querySelector(".lyrics-header-left .lyrics-title");
    if (lyricsTitle) {
      lyricsTitle.textContent = "Subtitles";
    }
    const lyricsIcon = document.querySelector(".lyrics-header-left .lyrics-icon");
    if (lyricsIcon) {
      lyricsIcon.remove();
    }

    // Ensure #videoDuration and #videoEta exist in .meta-sub if missing (for cached HTML)
    const metaSub = document.querySelector(".meta-sub");
    if (metaSub) {
      if (!document.getElementById("videoDuration")) {
        const durSpan = document.createElement("span");
        durSpan.id = "videoDuration";
        durSpan.className = "meta-item";
        durSpan.textContent = "Duration: -";
        metaSub.appendChild(durSpan);
      }
      if (!document.getElementById("videoEta")) {
        const etaSpan = document.createElement("span");
        etaSpan.id = "videoEta";
        etaSpan.className = "meta-item meta-eta hidden";
        etaSpan.title = "Estimated time to finish at current speed";
        etaSpan.innerHTML = `🏁 Finishes ~--:--`;
        metaSub.appendChild(etaSpan);
      }
      elVideoEta = document.getElementById("videoEta");
    }

    // Ensure Chat Image Preview container exists
    const chatCard = document.querySelector(".chat-card");
    const chatForm = document.getElementById("chatForm");
    if (chatCard && chatForm && !document.getElementById("chatImageAttachmentPreview")) {
      const previewDiv = document.createElement("div");
      previewDiv.id = "chatImageAttachmentPreview";
      previewDiv.className = "chat-image-preview hidden";
      previewDiv.innerHTML = `
        <div class="chat-image-preview-content">
          <img id="chatPreviewImg" class="chat-preview-thumbnail" src="" alt="Pasted screenshot" />
          <div class="chat-preview-meta">
            <span class="chat-preview-title">Screenshot attached</span>
            <span class="chat-preview-hint">Press Enter or Send to post (add optional caption)</span>
          </div>
          <button type="button" id="btnRemoveChatImage" class="btn-remove-attachment" title="Remove attached screenshot">&times;</button>
        </div>
      `;
      chatCard.insertBefore(previewDiv, chatForm);
    }

    // Ensure Live "is typing..." indicator exists and is placed above the quick emoji bar
    const emojiBar = document.getElementById("chatEmojiBar");
    let ti = document.getElementById("chatTypingIndicator");
    if (!ti && chatCard) {
      ti = document.createElement("div");
      ti.id = "chatTypingIndicator";
      ti.className = "chat-typing-indicator hidden";
      ti.setAttribute("aria-live", "polite");
      ti.innerHTML = `
        <span class="typing-avatar"></span>
        <span class="typing-text"></span>
        <span class="typing-dots"><span></span><span></span><span></span></span>
      `;
      if (emojiBar) {
        chatCard.insertBefore(ti, emojiBar);
      } else {
        chatCard.insertBefore(ti, chatForm);
      }
    } else if (ti && emojiBar && chatCard && ti.nextElementSibling !== emojiBar) {
      chatCard.insertBefore(ti, emojiBar);
    }

    // Ensure Lightbox Modal exists
    if (!document.getElementById("lightboxModal")) {
      const lb = document.createElement("div");
      lb.id = "lightboxModal";
      lb.className = "lightbox-modal hidden";
      lb.innerHTML = `
        <div class="lightbox-wrapper">
          <button id="btnCloseLightbox" class="lightbox-close" title="Close">&times;</button>
          <img id="lightboxImage" class="lightbox-img" src="" alt="Enlarged screenshot" />
        </div>
      `;
      document.body.appendChild(lb);
    }

    // Ensure Floating Reaction Bursts, Sub Delay HUD, and Reaction Toolbar exist
    const playerWrapperEl = document.querySelector(".player-wrapper");
    if (playerWrapperEl) {
      if (!document.getElementById("reactionBurstContainer")) {
        const rbc = document.createElement("div");
        rbc.id = "reactionBurstContainer";
        rbc.className = "reaction-burst-container";
        playerWrapperEl.appendChild(rbc);
      }
      if (!document.getElementById("subDelayHud")) {
        const sdh = document.createElement("div");
        sdh.id = "subDelayHud";
        sdh.className = "sub-delay-hud hidden";
        sdh.innerHTML = `<span id="subDelayHudText">⏱️ Sub Delay: 0.0s</span>`;
        playerWrapperEl.appendChild(sdh);
      }
      // Remove floating reaction toolbar if present from cached HTML
      document.querySelectorAll("#floatingReactionToolbar, .floating-reaction-toolbar").forEach(el => el.remove());
      // Remove obsolete Beta badge from Danmaku button if present from cached HTML
      document.querySelectorAll(".beta-badge").forEach(el => el.remove());
    }

    // Ensure Subtitle Delay row exists in Settings menu
    if (currentSettingsMenu && !document.getElementById("btnSubOffsetReset")) {
      const menuBody = currentSettingsMenu.querySelector(".settings-menu-body");
      if (menuBody) {
        const subSizeRow = menuBody.querySelector("label[for='selectSubSize']")?.parentElement;
        const delayCol = document.createElement("div");
        delayCol.className = "settings-menu-col settings-sub-delay-col";
        delayCol.innerHTML = `
          <div class="settings-sub-delay-header">
            <span class="settings-row-label">Sub Delay</span>
            <div class="sub-offset-header-right">
              <span id="subOffsetDisplay" class="sub-offset-pill" title="Current subtitle delay (keyboard keys: [ and ])">0.0s</span>
              <button type="button" id="btnSubOffsetReset" class="btn-toolbar sub-offset-btn reset" title="Reset delay to 0.0s (keyboard key: \\)">↺</button>
            </div>
          </div>
          <div class="sub-offset-btn-bar">
            <button type="button" id="btnSubOffsetMinus05" class="btn-toolbar sub-offset-btn" title="Subtitles earlier by -0.5s">-0.5s</button>
            <button type="button" id="btnSubOffsetMinus01" class="btn-toolbar sub-offset-btn" title="Subtitles earlier by -0.1s (Key: [)">-0.1s</button>
            <button type="button" id="btnSubOffsetPlus01" class="btn-toolbar sub-offset-btn" title="Subtitles later by +0.1s (Key: ])">+0.1s</button>
            <button type="button" id="btnSubOffsetPlus05" class="btn-toolbar sub-offset-btn" title="Subtitles later by +0.5s">+0.5s</button>
          </div>
        `;
        if (subSizeRow && subSizeRow.nextSibling) {
          menuBody.insertBefore(delayCol, subSizeRow.nextSibling);
        } else {
          menuBody.appendChild(delayCol);
        }
      }
    }

    // Ensure Room Danmaku row exists in Settings menu
    if (currentSettingsMenu && !document.getElementById("btnToggleRoomDanmaku")) {
      const menuBody = currentSettingsMenu.querySelector(".settings-menu-body");
      if (menuBody) {
        const biliRow = currentSettingsMenu.querySelector("#btnToggleDanmaku")?.closest(".settings-menu-row");
        const roomDmRow = document.createElement("div");
        roomDmRow.className = "settings-menu-row";
        roomDmRow.innerHTML = `
          <span class="settings-row-label">Room Danmaku</span>
          <div class="settings-danmaku-btns">
            <button type="button" id="btnToggleRoomDanmaku" class="btn-toolbar btn-danmaku-toggle active" title="Toggle live room chat floating across video">
              <span>💬</span>
              <span id="roomDanmakuStateLabel" class="danmaku-state-label">On</span>
            </button>
          </div>
        `;
        if (biliRow && biliRow.nextSibling) {
          menuBody.insertBefore(roomDmRow, biliRow.nextSibling);
        } else {
          menuBody.appendChild(roomDmRow);
        }
      }
    }

    // Refresh element references
    chatImagePreview = document.getElementById("chatImageAttachmentPreview");
    chatPreviewImg = document.getElementById("chatPreviewImg");
    btnRemoveChatImage = document.getElementById("btnRemoveChatImage");
    lightboxModal = document.getElementById("lightboxModal");
    lightboxImage = document.getElementById("lightboxImage");
    btnCloseLightbox = document.getElementById("btnCloseLightbox");

    if (btnRemoveChatImage) {
      btnRemoveChatImage.onclick = () => setPendingChatImage(null);
    }
    if (btnCloseLightbox) {
      btnCloseLightbox.onclick = () => closeLightbox();
    }
    if (lightboxModal) {
      lightboxModal.onclick = (e) => {
        if (e.target === lightboxModal) closeLightbox();
      };
    }

    // Update references
    btnToolbarVideoSource = document.getElementById("btnToolbarVideoSource");
    toolbarVideoSourceMenu = document.getElementById("toolbarVideoSourceMenu");
    btnCloseVideoSource = document.getElementById("btnCloseVideoSource");
    btnToolbarSettings = document.getElementById("btnToolbarSettings");
    toolbarSettingsMenu = document.getElementById("toolbarSettingsMenu");
    btnCloseToolbarSettings = document.getElementById("btnCloseToolbarSettings");
    btnToggleDanmaku = document.getElementById("btnToggleDanmaku");
    btnToggleDanmakuTrad = document.getElementById("btnToggleDanmakuTrad");
    danmakuStateLabel = document.getElementById("danmakuStateLabel");
    btnToggleRoomDanmaku = document.getElementById("btnToggleRoomDanmaku");
    roomDanmakuStateLabel = document.getElementById("roomDanmakuStateLabel");
    danmakuOverlay = document.getElementById("danmakuOverlay");
    reactionBurstContainer = document.getElementById("reactionBurstContainer");

    if (typeof initSubOffsetControls === "function") initSubOffsetControls();
    if (typeof updateDanmakuToggleUI === "function") updateDanmakuToggleUI();
    if (typeof updateRoomDanmakuToggleUI === "function") updateRoomDanmakuToggleUI();
  }
  ensureBookmarkElements();

  // Formatting helper for finish ETA durations
  function formatRemainingDuration(wallClockSec) {
    if (wallClockSec <= 0) return "0m";
    if (wallClockSec < 60) {
      return `${Math.max(1, Math.round(wallClockSec))}s`;
    }
    const totalRemainMins = Math.round(wallClockSec / 60);
    if (totalRemainMins >= 60) {
      const hrs = Math.floor(totalRemainMins / 60);
      const mins = totalRemainMins % 60;
      return `${hrs}h ${mins}m`;
    }
    return `${totalRemainMins}m`;
  }

  // Smarter algorithm for Time-To-Finish:
  // If slowed down to 1.0x because another viewer is lagging behind, calculates how long until
  // they catch up, accounts for speed reverting to defaultSpeed (e.g. 1.25x), and accurately projects finish time.
  function calculateSmartTimeToFinish(remainingVideoSec, curTime, dur, isSubBased) {
    if (remainingVideoSec <= 0) {
      return {
        wallClockSec: 0,
        displaySpeedStr: "",
        detailsNote: "Finished"
      };
    }

    const defaultSpeed = (player && player.defaultSpeed) || currentRoomConfig.default_speed || 1.25;
    const currentSpeed = (player && player.video && player.video.playbackRate && player.video.playbackRate > 0)
      ? player.video.playbackRate
      : defaultSpeed;

    // 1. Manual speed override: user explicitly chose a fixed speed override
    if (player && player.speedOverride !== "auto" && !isNaN(Number(player.speedOverride)) && Number(player.speedOverride) > 0) {
      const fixedSpeed = Number(player.speedOverride);
      const wallSec = remainingVideoSec / fixedSpeed;
      return {
        wallClockSec: wallSec,
        displaySpeedStr: `${Number(fixedSpeed.toFixed(2))}x`,
        detailsNote: `fixed speed override at ${Number(fixedSpeed.toFixed(2))}x`
      };
    }

    // 2. Room sync with peer markers
    const markers = (lastMinimapData && Array.isArray(lastMinimapData.markers)) ? lastMinimapData.markers : [];
    if (markers.length < 2) {
      const wallSec = remainingVideoSec / currentSpeed;
      return {
        wallClockSec: wallSec,
        displaySpeedStr: `${Number(currentSpeed.toFixed(2))}x`,
        detailsNote: `playing solo at ${Number(currentSpeed.toFixed(2))}x`
      };
    }

    const selfMarker = markers.find(m => m.user_id === userId);
    const otherMarkers = markers.filter(m => m.user_id !== userId);

    const times = markers.map(m => Number(m.current_time) || 0);
    const tMax = Math.max(...times);
    const lagThreshold = currentRoomConfig.lag_threshold || 2.0;
    const heavyLagThreshold = currentRoomConfig.heavy_lag_threshold || 120.0;
    const heavyLagSpeed = currentRoomConfig.heavy_lag_speed || 1.4;
    const lagSpeed = currentRoomConfig.lag_speed || 1.25;

    // Scenario A: Current user is ahead and slowed/throttled to 1.0x because another viewer is behind
    const laggingViewers = otherMarkers.filter(m => (curTime - (Number(m.current_time) || 0)) > lagThreshold);

    if (laggingViewers.length > 0 && (currentSpeed <= 1.05 || (selfMarker && selfMarker.target_speed <= 1.05) || curTime >= tMax - 0.5)) {
      let slowestViewer = laggingViewers[0];
      let minLaggingTime = Number(slowestViewer.current_time) || 0;
      for (const lv of laggingViewers) {
        const lvTime = Number(lv.current_time) || 0;
        if (lvTime < minLaggingTime) {
          minLaggingTime = lvTime;
          slowestViewer = lv;
        }
      }

      const maxLag = curTime - minLaggingTime;
      const netLag = Math.max(0, maxLag - lagThreshold);

      let tCatchup = 0;
      if (maxLag > heavyLagThreshold) {
        const heavyGap = maxLag - heavyLagThreshold;
        const vRelHeavy = Math.max(0.1, heavyLagSpeed - 1.0);
        const t1 = heavyGap / vRelHeavy;

        const modGap = heavyLagThreshold - lagThreshold;
        const vRelMod = Math.max(0.1, lagSpeed - 1.0);
        const t2 = modGap / vRelMod;

        tCatchup = t1 + t2;
      } else {
        const vRel = Math.max(0.1, lagSpeed - 1.0);
        tCatchup = netLag / vRel;
      }

      const slowestName = slowestViewer.avatar || slowestViewer.username || "lagging viewer";
      const catchupDurStr = formatRemainingDuration(tCatchup);

      // During catch-up, user plays at 1.0x: 1 sec wall time advances 1 sec video
      if (remainingVideoSec <= tCatchup) {
        const totalWallSec = remainingVideoSec / 1.0;
        return {
          wallClockSec: totalWallSec,
          displaySpeedStr: "1.0x",
          detailsNote: `throttled to 1.0x (movie finishes before ${slowestName} catches up in ~${catchupDurStr})`
        };
      } else {
        const remainingAfter = remainingVideoSec - tCatchup;
        const tAfter = remainingAfter / defaultSpeed;
        const totalWallSec = tCatchup + tAfter;
        return {
          wallClockSec: totalWallSec,
          displaySpeedStr: `1.0x ➔ ${Number(defaultSpeed.toFixed(2))}x`,
          detailsNote: `1.0x for ~${catchupDurStr} until ${slowestName} catches up, then reverts to ${Number(defaultSpeed.toFixed(2))}x`
        };
      }
    }

    // Scenario B: Current user is lagging behind the leader and catching up
    const userLag = tMax - curTime;
    if (userLag > lagThreshold) {
      const netUserLag = Math.max(0, userLag - lagThreshold);
      const myCatchupSpeed = currentSpeed > 1.05 ? currentSpeed : (userLag > heavyLagThreshold ? heavyLagSpeed : lagSpeed);
      const vRel = Math.max(0.1, myCatchupSpeed - 1.0);
      const tCatchup = netUserLag / vRel;
      const videoAdvanceDuringCatchup = tCatchup * myCatchupSpeed;
      const catchupDurStr = formatRemainingDuration(tCatchup);

      if (remainingVideoSec <= videoAdvanceDuringCatchup) {
        const totalWallSec = remainingVideoSec / myCatchupSpeed;
        return {
          wallClockSec: totalWallSec,
          displaySpeedStr: `${Number(myCatchupSpeed.toFixed(2))}x`,
          detailsNote: `catching up at ${Number(myCatchupSpeed.toFixed(2))}x until end of movie`
        };
      } else {
        const remainingAfter = remainingVideoSec - videoAdvanceDuringCatchup;
        const tAfter = remainingAfter / defaultSpeed;
        const totalWallSec = tCatchup + tAfter;
        return {
          wallClockSec: totalWallSec,
          displaySpeedStr: `${Number(myCatchupSpeed.toFixed(2))}x ➔ ${Number(defaultSpeed.toFixed(2))}x`,
          detailsNote: `catching up at ${Number(myCatchupSpeed.toFixed(2))}x for ~${catchupDurStr}, then reverts to ${Number(defaultSpeed.toFixed(2))}x`
        };
      }
    }

    // Scenario C: Room is synchronized within tolerance
    const wallSec = remainingVideoSec / defaultSpeed;
    return {
      wallClockSec: wallSec,
      displaySpeedStr: `${Number(defaultSpeed.toFixed(2))}x`,
      detailsNote: `synchronized at ${Number(defaultSpeed.toFixed(2))}x`
    };
  }

  // Estimated Video Finish Time (ETA) calculation
  function updateVideoEtaDisplay() {
    const etaEl = elVideoEta || document.getElementById("videoEta");
    if (!etaEl) return;
    const dur = (player && player.video && !isNaN(player.video.duration) && player.video.duration > 0)
      ? player.video.duration
      : (activeVideoMetadata?.duration || 0);

    if (dur <= 0) {
      etaEl.classList.add("hidden");
      return;
    }

    const curTime = (player && player.video) ? (player.video.currentTime || 0) : 0;
    let endSec = dur;
    let isSubBased = false;

    if (currentSubtitleCues && currentSubtitleCues.length > 0) {
      const lastCue = currentSubtitleCues[currentSubtitleCues.length - 1];
      if (lastCue && lastCue.to > 0) {
        endSec = lastCue.to;
        isSubBased = true;
      }
    }

    const remainingVideoSec = Math.max(0, endSec - curTime);
    if (remainingVideoSec <= 0) {
      etaEl.classList.remove("hidden");
      etaEl.innerHTML = `🏁 <span class="eta-clock">Finished</span>`;
      etaEl.title = isSubBased ? `Reached end of subtitles (${formatTime(endSec)})` : `Reached end of video (${formatTime(dur)})`;
      return;
    }

    const smartResult = calculateSmartTimeToFinish(remainingVideoSec, curTime, dur, isSubBased);
    const wallClockSec = smartResult.wallClockSec;
    const finishDate = new Date(Date.now() + wallClockSec * 1000);
    const clockStr = finishDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const remainStr = formatRemainingDuration(wallClockSec);
    const speedStr = smartResult.displaySpeedStr;
    const basisLabel = isSubBased ? `subtitles end (${formatTime(endSec)})` : `video duration (${formatTime(dur)})`;

    etaEl.classList.remove("hidden");
    etaEl.innerHTML = `🏁 Finishes <span class="eta-clock">~${clockStr}</span> <span class="eta-sub">(${remainStr} left at ${speedStr})</span>`;
    etaEl.title = `Estimated finish: ~${clockStr} (${remainStr} remaining: ${smartResult.detailsNote}, based on ${basisLabel})`;
  }

  let wasPlayingBeforeLightbox = false;

  function openLightbox(src) {
    if (!lightboxModal) lightboxModal = document.getElementById("lightboxModal");
    if (!lightboxImage) lightboxImage = document.getElementById("lightboxImage");
    if (lightboxModal && lightboxImage) {
      if (player && player.video && !player.video.paused) {
        wasPlayingBeforeLightbox = true;
        player.video.pause();
      } else {
        wasPlayingBeforeLightbox = false;
      }
      lightboxImage.src = src;
      lightboxModal.classList.remove("hidden");
    }
  }

  function closeLightbox() {
    if (!lightboxModal) lightboxModal = document.getElementById("lightboxModal");
    if (lightboxModal && !lightboxModal.classList.contains("hidden")) {
      lightboxModal.classList.add("hidden");
      if (lightboxImage) lightboxImage.src = "";
      if (wasPlayingBeforeLightbox) {
        wasPlayingBeforeLightbox = false;
        if (player && player.video) {
          player.video.play().catch(() => {});
        }
      }
    }
  }

  function setPendingChatImage(dataUrl) {
    pendingChatImage = dataUrl;
    if (!chatImagePreview) chatImagePreview = document.getElementById("chatImageAttachmentPreview");
    if (!chatPreviewImg) chatPreviewImg = document.getElementById("chatPreviewImg");
    if (chatImagePreview && chatPreviewImg) {
      if (dataUrl) {
        chatPreviewImg.src = dataUrl;
        chatImagePreview.classList.remove("hidden");
        if (elChatInput) {
          elChatInput.placeholder = "Add a caption, or hit Enter to send screenshot...";
        }
      } else {
        chatPreviewImg.src = "";
        chatImagePreview.classList.add("hidden");
        if (elChatInput) {
          elChatInput.placeholder = "Send a message (or paste screenshot)...";
        }
      }
    }
  }

  function compressImage(dataUrl, maxW, maxH, quality, callback) {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxW || h > maxH) {
        if (w / maxW > h / maxH) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        } else {
          w = Math.round((w * maxH) / h);
          h = maxH;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  }

  function handleImageFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      compressImage(rawDataUrl, 1920, 1080, 0.88, (compressed) => {
        setPendingChatImage(compressed);
        if (elChatInput) elChatInput.focus();
      });
    };
    reader.readAsDataURL(file);
  }

  function handlePasteEvent(e) {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          break;
        }
      }
    }
  }

  const btnAddPersonalBookmark = document.getElementById("btnAddPersonalBookmark");
  const btnAddSharedBookmark = document.getElementById("btnAddSharedBookmark");
  const bookmarksBar = document.getElementById("bookmarksBar");
  const bookmarkContextMenu = document.getElementById("bookmarkContextMenu");
  const bookmarkContextHeader = document.getElementById("bookmarkContextHeader");
  const btnBookmarkContextJump = document.getElementById("btnBookmarkContextJump");
  const bookmarkContextJumpText = document.getElementById("bookmarkContextJumpText");
  const btnBookmarkContextDelete = document.getElementById("btnBookmarkContextDelete");

  let personalBookmarks = [];
  let sharedBookmarks = [];
  let activeContextBookmark = null;

  try {
    const savedPersonal = localStorage.getItem(`wp_personal_bookmarks_${roomId}`);
    if (savedPersonal) {
      personalBookmarks = JSON.parse(savedPersonal) || [];
    }
  } catch (e) {
    personalBookmarks = [];
  }

  function savePersonalBookmarks() {
    try {
      localStorage.setItem(`wp_personal_bookmarks_${roomId}`, JSON.stringify(personalBookmarks));
    } catch (e) {}
  }

  function openBookmarkContextMenu(bm, x, y) {
    if (!bookmarkContextMenu || !bm) return;
    activeContextBookmark = bm;
    const isPersonal = bm.scope === "personal";
    const timeStr = bm.formatted_time || formatTime(bm.time);
    if (bookmarkContextHeader) {
      bookmarkContextHeader.textContent = isPersonal
        ? `📌 My Bookmark (${timeStr})`
        : `📍 Shared Bookmark (${bm.avatar || '👤'} • ${timeStr})`;
    }
    if (bookmarkContextJumpText) {
      bookmarkContextJumpText.textContent = `Jump to ${timeStr}`;
    }

    bookmarkContextMenu.classList.remove("hidden");
    const menuW = 200;
    const menuH = 110;
    const left = Math.max(8, Math.min(x, window.innerWidth - menuW - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - menuH - 8));
    bookmarkContextMenu.style.left = `${left}px`;
    bookmarkContextMenu.style.top = `${top}px`;
  }

  function closeBookmarkContextMenu() {
    if (!bookmarkContextMenu) return;
    bookmarkContextMenu.classList.add("hidden");
    activeContextBookmark = null;
  }

  function deleteBookmark(bm) {
    if (!bm) return;
    if (bm.scope === "personal") {
      personalBookmarks = personalBookmarks.filter((item) => item.id !== bm.id);
      savePersonalBookmarks();
      syncBookmarksUI();
    } else {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "bookmark_delete",
          bookmark_id: bm.id,
          user_id: userId
        }));
      }
    }
  }

  if (btnBookmarkContextJump) {
    btnBookmarkContextJump.addEventListener("click", () => {
      if (activeContextBookmark) {
        player.seek(activeContextBookmark.time);
      }
      closeBookmarkContextMenu();
    });
  }

  if (btnBookmarkContextDelete) {
    btnBookmarkContextDelete.addEventListener("click", () => {
      if (activeContextBookmark) {
        deleteBookmark(activeContextBookmark);
      }
      closeBookmarkContextMenu();
    });
  }

  document.addEventListener("click", (e) => {
    if (bookmarkContextMenu && !bookmarkContextMenu.classList.contains("hidden")) {
      if (!bookmarkContextMenu.contains(e.target)) {
        closeBookmarkContextMenu();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeBookmarkContextMenu();
    }
  });

  const minimap = new Minimap("minimapContainer", {
    onSeek: (percent) => {
      const dur = player.video.duration || 0;
      if (dur > 0) {
        const targetSec = dur * percent;
        player.seek(targetSec);
      }
    },
    onSeekTime: (targetSec) => {
      player.seek(targetSec);
    },
    onBookmarkContextMenu: (bm, x, y) => {
      openBookmarkContextMenu(bm, x, y);
    }
  });

  let lastBookmarksBarSig = "";

  function syncBookmarksUI() {
    minimap.setBookmarks(personalBookmarks, sharedBookmarks);
    if (!bookmarksBar) return;

    const allItems = [
      ...personalBookmarks.map((b) => Object.assign({}, b, { scope: "personal" })),
      ...sharedBookmarks.map((b) => Object.assign({}, b, { scope: "shared" }))
    ].sort((a, b) => a.time - b.time);

    const barSig = allItems.map((b) => `${b.scope}_${b.id}_${b.time}_${b.color || ""}_${b.avatar || ""}`).join("|");
    if (barSig === lastBookmarksBarSig) {
      return;
    }
    lastBookmarksBarSig = barSig;

    if (allItems.length === 0) {
      bookmarksBar.classList.add("hidden");
      bookmarksBar.innerHTML = "";
      return;
    }

    bookmarksBar.classList.remove("hidden");
    bookmarksBar.innerHTML = `<span class="bookmarks-bar-label">Bookmarks:</span>`;

    allItems.forEach((bm) => {
      const isPersonal = bm.scope === "personal";
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `bookmark-chip ${isPersonal ? 'personal' : 'shared'}`;
      if (!isPersonal && bm.color) {
        chip.style.setProperty("--bm-color", bm.color);
      }
      const timeStr = bm.formatted_time || formatTime(bm.time);
      chip.title = isPersonal
        ? `📌 My Bookmark at ${timeStr} (Click to jump • Right-click to delete)`
        : `📍 Shared Bookmark (${bm.avatar || '👤'}) at ${timeStr} (Click to jump • Right-click to delete)`;

      chip.innerHTML = isPersonal
        ? `<span class="bm-chip-icon">📌</span><span class="bm-chip-time">${timeStr}</span><span class="bm-chip-tag">My Bookmark</span>`
        : `<span class="bm-chip-icon">📍</span><span class="bm-chip-avatar">${bm.avatar || '👤'}</span><span class="bm-chip-time">${timeStr}</span><span class="bm-chip-tag shared">Shared</span>`;

      chip.addEventListener("click", () => {
        player.seek(bm.time);
      });

      chip.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openBookmarkContextMenu(bm, e.clientX, e.clientY);
      });

      bookmarksBar.appendChild(chip);
    });
  }

  if (btnAddPersonalBookmark) {
    btnAddPersonalBookmark.addEventListener("click", () => {
      const curTime = (player && player.video) ? (player.video.currentTime || 0) : 0;
      const bm = {
        id: "pbm_" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        avatar: userAvatar,
        color: userColor,
        time: Math.round(curTime * 100) / 100,
        formatted_time: formatTime(curTime),
        scope: "personal",
        created_at: Date.now()
      };
      personalBookmarks.push(bm);
      personalBookmarks.sort((a, b) => a.time - b.time);
      savePersonalBookmarks();
      syncBookmarksUI();
    });
  }

  if (btnAddSharedBookmark) {
    btnAddSharedBookmark.addEventListener("click", () => {
      const curTime = (player && player.video) ? (player.video.currentTime || 0) : 0;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "bookmark_add",
          user_id: userId,
          time: curTime
        }));
      }
    });
  }

  // Ensure local user's progress lane is immediately visible on DOM load
  minimap.ensureLocalUserLane(userId, username, userColor, userAvatar, isHost);
  syncBookmarksUI();

  // =========================================
  // Bilibili Danmaku Scrolling Comments (Beta - Off by default)
  // =========================================
  danmakuOverlay = danmakuOverlay || document.getElementById("danmakuOverlay");
  btnToggleDanmaku = btnToggleDanmaku || document.getElementById("btnToggleDanmaku");
  btnToggleDanmakuTrad = btnToggleDanmakuTrad || document.getElementById("btnToggleDanmakuTrad");
  danmakuStateLabel = danmakuStateLabel || document.getElementById("danmakuStateLabel");

  function updateDanmakuTradUI() {
    const btn = btnToggleDanmakuTrad || document.getElementById("btnToggleDanmakuTrad");
    if (btn) {
      btn.classList.toggle("active", danmakuTrad);
      btn.title = danmakuTrad
        ? "Danmaku: Traditional Chinese (繁) - Click for Simplified (简)"
        : "Danmaku: Simplified Chinese (简) - Click for Traditional (繁)";
    }
  }

  function handleToggleDanmakuTrad() {
    danmakuTrad = !danmakuTrad;
    try {
      localStorage.setItem("wp_danmaku_trad", danmakuTrad ? "true" : "false");
    } catch (e) {}
    updateDanmakuTradUI();

    if (danmakuOverlay) {
      const items = danmakuOverlay.querySelectorAll(".danmaku-item");
      items.forEach(el => {
        const orig = el.getAttribute("data-orig-text");
        const trad = el.getAttribute("data-trad-text");
        if (orig && trad) {
          el.textContent = danmakuTrad ? trad : orig;
        } else if (orig) {
          el.textContent = convertDanmakuText(orig);
        }
      });
    }
  }

  const tradBtnInit = btnToggleDanmakuTrad || document.getElementById("btnToggleDanmakuTrad");
  if (tradBtnInit) {
    tradBtnInit.addEventListener("click", handleToggleDanmakuTrad);
  }
  updateDanmakuTradUI();

  function clearDanmakuScreen() {
    if (danmakuOverlay) {
      danmakuOverlay.innerHTML = "";
    }
    for (let i = 0; i < DANMAKU_TRACKS; i++) {
      danmakuTrackFreeAt[i] = 0;
    }
  }

  async function loadDanmakuForCurrentVideo() {
    const cid = activeVideoMetadata && activeVideoMetadata.cid ? Number(activeVideoMetadata.cid) : null;
    if (!cid) {
      danmakuComments = [];
      loadedDanmakuCid = null;
      return;
    }
    if (loadedDanmakuCid === cid && danmakuComments.length > 0) {
      updateDanmakuToggleUI();
      return;
    }
    loadedDanmakuCid = cid;
    try {
      const resp = await apiFetch(`/api/room/${roomId}/danmaku?cid=${encodeURIComponent(cid)}`);
      if (resp.ok) {
        const data = await resp.json();
        danmakuComments = Array.isArray(data.danmaku) ? data.danmaku : [];
      } else {
        danmakuComments = [];
      }
    } catch (e) {
      console.warn("Could not load Bilibili danmaku:", e);
      danmakuComments = [];
    }
    updateDanmakuToggleUI();
  }

  function spawnInitialDanmakuNear(curTime) {
    if (!danmakuEnabled || !danmakuComments || danmakuComments.length === 0) return;
    // Find up to 4 comments near the current playback position (or the closest upcoming ones)
    let nearby = danmakuComments.filter((c) => c.time >= curTime - 10 && c.time <= curTime + 5);
    if (nearby.length === 0) {
      nearby = danmakuComments.filter((c) => c.time >= curTime).slice(0, 3);
    }
    if (nearby.length === 0) {
      nearby = danmakuComments.slice(-3);
    }
    nearby.slice(0, 4).forEach((c, idx) => {
      setTimeout(() => {
        if (danmakuEnabled) spawnDanmakuItem(c);
      }, idx * 350);
    });
  }

  function spawnDanmakuItem(item) {
    if (!danmakuOverlay || !danmakuEnabled) return;
    const now = Date.now();
    let chosenTrack = -1;
    for (let i = 0; i < DANMAKU_TRACKS; i++) {
      if (now >= danmakuTrackFreeAt[i]) {
        chosenTrack = i;
        break;
      }
    }
    if (chosenTrack === -1) {
      chosenTrack = Math.floor(Math.random() * DANMAKU_TRACKS);
    }

    // Reserve track for ~1.6s so consecutive comments on the same row don't collide
    danmakuTrackFreeAt[chosenTrack] = now + 1600;

    const el = document.createElement("div");
    el.className = "danmaku-item";
    const origText = item.text || "";
    const tradText = item.text_trad || item.text || "";
    el.setAttribute("data-orig-text", origText);
    el.setAttribute("data-trad-text", tradText);
    el.textContent = danmakuTrad ? tradText : origText;
    el.style.top = `${4 + chosenTrack * 8.5}%`;
    if (item.color && item.color.toLowerCase() !== "#ffffff") {
      el.style.color = item.color;
    }
    // Slight duration variation based on text length (8.5s - 10.5s)
    const durationSec = Math.max(8.0, Math.min(11.0, 9.5 - Math.min(20, (item.text || "").length) * 0.04));
    el.style.animationDuration = `${durationSec}s`;

    el.addEventListener("animationend", () => {
      el.remove();
    });

    danmakuOverlay.appendChild(el);
  }

  function tickDanmaku(curTime, isPaused) {
    if (!danmakuOverlay) return;
    danmakuOverlay.classList.toggle("paused", !!isPaused);
    if (!danmakuEnabled) return;

    if (isPaused) {
      lastDanmakuTime = curTime;
      return;
    }

    if (lastDanmakuTime < 0 || curTime < lastDanmakuTime || (curTime - lastDanmakuTime) > 2.5) {
      lastDanmakuTime = curTime;
      return;
    }

    if (danmakuComments.length > 0 && curTime > lastDanmakuTime) {
      let spawned = 0;
      for (let i = 0; i < danmakuComments.length; i++) {
        const c = danmakuComments[i];
        if (c.time > lastDanmakuTime && c.time <= curTime) {
          spawnDanmakuItem(c);
          spawned++;
          if (spawned >= 6) break;
        } else if (c.time > curTime) {
          break;
        }
      }
    }
    lastDanmakuTime = curTime;
  }

  btnToggleRoomDanmaku = btnToggleRoomDanmaku || document.getElementById("btnToggleRoomDanmaku");
  roomDanmakuStateLabel = roomDanmakuStateLabel || document.getElementById("roomDanmakuStateLabel");

  function updateDanmakuOverlayVisibility() {
    if (danmakuOverlay) {
      const anyDanmakuOn = danmakuEnabled || roomDanmakuEnabled;
      danmakuOverlay.classList.toggle("hidden", !anyDanmakuOn);
    }
  }

  function updateDanmakuToggleUI() {
    if (btnToggleDanmaku) {
      btnToggleDanmaku.classList.toggle("active", danmakuEnabled);
      btnToggleDanmaku.title = danmakuComments.length > 0
        ? `Toggle Bilibili Danmaku (${danmakuComments.length} comments)`
        : "Toggle Bilibili scrolling comments overlay";
    }
    if (danmakuStateLabel) {
      danmakuStateLabel.textContent = danmakuEnabled ? "On" : "Off";
    }
    updateDanmakuOverlayVisibility();
  }

  function updateRoomDanmakuToggleUI() {
    const btn = btnToggleRoomDanmaku || document.getElementById("btnToggleRoomDanmaku");
    const label = roomDanmakuStateLabel || document.getElementById("roomDanmakuStateLabel");
    if (btn) {
      btn.classList.toggle("active", roomDanmakuEnabled);
      btn.title = "Toggle live room chat floating across video";
    }
    if (label) {
      label.textContent = roomDanmakuEnabled ? "On" : "Off";
    }
    updateDanmakuOverlayVisibility();
  }

  async function handleToggleDanmaku() {
    danmakuEnabled = !danmakuEnabled;
    try {
      localStorage.setItem("wp_danmaku_enabled", danmakuEnabled ? "true" : "false");
    } catch (e) {}
    updateDanmakuToggleUI();
    if (danmakuEnabled) {
      const curTime = (player && player.video) ? (player.video.currentTime || 0) : 0;
      lastDanmakuTime = curTime;
      await loadDanmakuForCurrentVideo();
      spawnInitialDanmakuNear(curTime);
    } else {
      if (danmakuOverlay) {
        danmakuOverlay.querySelectorAll(".danmaku-item:not(.room-danmaku)").forEach(el => el.remove());
      }
    }
  }

  function handleToggleRoomDanmaku() {
    roomDanmakuEnabled = !roomDanmakuEnabled;
    try {
      localStorage.setItem("wp_room_danmaku_enabled", roomDanmakuEnabled ? "true" : "false");
    } catch (e) {}
    updateRoomDanmakuToggleUI();
    if (!roomDanmakuEnabled && danmakuOverlay) {
      danmakuOverlay.querySelectorAll(".danmaku-item.room-danmaku").forEach(el => el.remove());
    }
  }

  function spawnRoomDanmakuItem(msg) {
    if (!danmakuOverlay || !roomDanmakuEnabled || !msg || msg.is_system) return;
    const text = (msg.text || "").trim();
    if (!text) return;

    // If a user only types emojis in the chat, show each as a floating reaction
    const isEmojiOnly = /^[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\uFE0F\u200D\s]+$/u.test(text);
    if (isEmojiOnly) {
      triggerFloatingReactionBurst({
        emoji: text,
        count: 1
      });
      return;
    }

    danmakuOverlay.classList.remove("hidden");
    const now = Date.now();
    let chosenTrack = Math.floor(Math.random() * DANMAKU_TRACKS);
    for (let i = 0; i < DANMAKU_TRACKS; i++) {
      if (now >= danmakuTrackFreeAt[i]) {
        chosenTrack = i;
        break;
      }
    }
    danmakuTrackFreeAt[chosenTrack] = now + 1800;

    const el = document.createElement("div");
    el.className = "danmaku-item room-danmaku";
    const color = msg.color || userColor || "#00aeec";
    el.style.setProperty("--room-dm-color", color);
    el.style.setProperty("--room-dm-glow", `${color}55`);
    el.style.top = `${6 + chosenTrack * 8.5}%`;

    const avatar = escapeHtml(msg.avatar || "👤");
    const content = escapeHtml(text);

    // Don't show the viewer name, just use the avatar and the message
    el.innerHTML = `
      <span class="room-dm-avatar">${avatar}</span>
      <span class="room-dm-text">${content}</span>
    `;

    const dur = Math.max(9.0, Math.min(13.0, 10.5 - Math.min(25, text.length) * 0.05));
    el.style.animationDuration = `${dur}s`;

    el.addEventListener("animationend", () => el.remove());
    danmakuOverlay.appendChild(el);
  }

  const dmBtnInit = btnToggleDanmaku || document.getElementById("btnToggleDanmaku");
  if (dmBtnInit) {
    dmBtnInit.addEventListener("click", handleToggleDanmaku);
  }
  const roomDmBtnInit = btnToggleRoomDanmaku || document.getElementById("btnToggleRoomDanmaku");
  if (roomDmBtnInit) {
    roomDmBtnInit.addEventListener("click", handleToggleRoomDanmaku);
  }
  updateDanmakuToggleUI();
  updateRoomDanmakuToggleUI();

  // =========================================
  // Floating Reaction Bursts (Emoji-only messages)
  // =========================================
  reactionBurstContainer = reactionBurstContainer || document.getElementById("reactionBurstContainer");

  function extractEmojis(text) {
    if (!text) return [];
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Modern Intl.Segmenter correctly handles grapheme clusters, modifier sequences, and flags
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
        const list = [...segmenter.segment(trimmed)]
          .map(s => s.segment.trim())
          .filter(Boolean);
        if (list.length > 0) return list;
      } catch (e) {
        // Fall back to regex
      }
    }

    const matches = trimmed.match(/\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier}|\uFE0F)*|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3/gu);
    if (matches && matches.length > 0) return matches;

    return [...trimmed].filter(c => c.trim().length > 0);
  }

  function spawnReactionBubble(singleEmoji, delayMs = 0) {
    const container = reactionBurstContainer || document.getElementById("reactionBurstContainer");
    if (!container || !singleEmoji) return;

    const doSpawn = () => {
      const bubble = document.createElement("div");
      bubble.className = "reaction-bubble";
      bubble.textContent = singleEmoji;

      // Randomize position near bottom right: right: 25px - 90px
      const rightOffset = 25 + Math.floor(Math.random() * 65);
      bubble.style.right = `${rightOffset}px`;

      // Size
      const size = 30 + Math.floor(Math.random() * 8);
      bubble.style.fontSize = `${size}px`;

      // Target height: -240px to -360px
      const targetY = -(240 + Math.floor(Math.random() * 120));
      bubble.style.setProperty("--target-y", `${targetY}px`);

      const rotMid = (Math.random() * 20 - 10).toFixed(1) + "deg";
      const rotEnd = (Math.random() * 30 - 15).toFixed(1) + "deg";
      bubble.style.setProperty("--rot-mid", rotMid);
      bubble.style.setProperty("--rot-end", rotEnd);

      const duration = (2.2 + Math.random() * 0.5).toFixed(2);
      bubble.style.animationDuration = `${duration}s`;

      bubble.addEventListener("animationend", () => bubble.remove());
      container.appendChild(bubble);
    };

    if (delayMs > 0) {
      setTimeout(doSpawn, delayMs);
    } else {
      doSpawn();
    }
  }

  function triggerFloatingReactionBurst(reaction) {
    const rawEmoji = (reaction.emoji || "❤️").trim();
    if (!rawEmoji) return;

    // When multiple emojis are sent (e.g. "❤️❤️❤️" or "🔥👍🎉"), separate each into its own floating animation
    const emojis = extractEmojis(rawEmoji);
    const emojiList = emojis.length > 0 ? emojis : [rawEmoji];

    const count = Math.max(1, parseInt(reaction.count, 10) || 1);
    const itemsToSpawn = [];
    for (let c = 0; c < count; c++) {
      itemsToSpawn.push(...emojiList);
    }

    // Cap at 25 floating emojis per burst to preserve smooth performance
    const capped = itemsToSpawn.slice(0, 25);
    const staggerStep = capped.length > 8 ? 60 : (capped.length > 4 ? 90 : 120);

    capped.forEach((singleEmoji, index) => {
      const delay = capped.length > 1 ? index * staggerStep : 0;
      spawnReactionBubble(singleEmoji, delay);
    });
  }

  // Wire up Subtitle Offset Controls in Settings menu
  function initSubOffsetControls() {
    updateSubOffsetUI();
    const btnM05 = document.getElementById("btnSubOffsetMinus05");
    const btnM01 = document.getElementById("btnSubOffsetMinus01");
    const btnP01 = document.getElementById("btnSubOffsetPlus01");
    const btnP05 = document.getElementById("btnSubOffsetPlus05");
    const btnRst = document.getElementById("btnSubOffsetReset");

    if (btnM05) btnM05.onclick = () => nudgeSubtitleOffset(-0.5);
    if (btnM01) btnM01.onclick = () => nudgeSubtitleOffset(-0.1);
    if (btnP01) btnP01.onclick = () => nudgeSubtitleOffset(0.1);
    if (btnP05) btnP05.onclick = () => nudgeSubtitleOffset(0.5);
    if (btnRst) btnRst.onclick = () => resetSubtitleOffset();
  }
  initSubOffsetControls();

  // Subtitle offset keyboard shortcuts: [ for -0.1s, ] for +0.1s, \ for reset
  document.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
      return;
    }
    if (e.key === "[") {
      e.preventDefault();
      nudgeSubtitleOffset(-0.1);
    } else if (e.key === "]") {
      e.preventDefault();
      nudgeSubtitleOffset(0.1);
    } else if (e.key === "\\") {
      e.preventDefault();
      resetSubtitleOffset();
    }
  });

  // Local progress ticker for smooth local scrubber bar, subtitles & danmaku
  if (player && player.video) {
    player.video.addEventListener("timeupdate", () => {
      renderSubtitlesAtTime(player.video.currentTime || 0);
    });
    player.video.addEventListener("seeked", () => {
      const t = player.video.currentTime || 0;
      renderSubtitlesAtTime(t);
      clearDanmakuScreen();
      lastDanmakuTime = t;
      updateVideoEtaDisplay();
    });
    player.video.addEventListener("ratechange", () => {
      updateVideoEtaDisplay();
    });
    player.video.addEventListener("durationchange", () => {
      updateVideoEtaDisplay();
    });
    player.video.addEventListener("loadedmetadata", () => {
      updateVideoEtaDisplay();
    });
  }

  let lastEtaUpdateSecond = -1;
  setInterval(() => {
    if (player.video) {
      const curTime = player.video.currentTime || 0;
      if (!player.video.paused) {
        const buffered = (player.video.buffered && player.video.buffered.length > 0) ? player.video.buffered.end(player.video.buffered.length - 1) : 0;
        minimap.updateLocalProgress(curTime, player.video.duration, buffered);
        updateSelfViewerCardTime(curTime);
      }
      renderSubtitlesAtTime(curTime);
      tickDanmaku(curTime, player.video.paused);

      const currentSecFloor = Math.floor(curTime);
      if (currentSecFloor !== lastEtaUpdateSecond) {
        lastEtaUpdateSecond = currentSecFloor;
        updateVideoEtaDisplay();
      }
    }
  }, 100);

  // 4. Player Toolbar Event Listeners
  btnToolbarVideoSource = btnToolbarVideoSource || document.getElementById("btnToolbarVideoSource");
  toolbarVideoSourceMenu = toolbarVideoSourceMenu || document.getElementById("toolbarVideoSourceMenu");
  btnCloseVideoSource = btnCloseVideoSource || document.getElementById("btnCloseVideoSource");

  btnToolbarSettings = btnToolbarSettings || document.getElementById("btnToolbarSettings");
  toolbarSettingsMenu = toolbarSettingsMenu || document.getElementById("toolbarSettingsMenu");
  btnCloseToolbarSettings = btnCloseToolbarSettings || document.getElementById("btnCloseToolbarSettings");

  function toggleVideoSourceMenu(forceOpen) {
    const menu = toolbarVideoSourceMenu || document.getElementById("toolbarVideoSourceMenu");
    const btn = btnToolbarVideoSource || document.getElementById("btnToolbarVideoSource");
    if (!menu) return;
    const shouldOpen = (typeof forceOpen === "boolean") ? forceOpen : menu.classList.contains("hidden");
    if (shouldOpen) {
      toggleSettingsMenu(false);
      menu.classList.remove("hidden");
      if (btn) btn.classList.add("active");
      const input = document.getElementById("inputVideoQuery");
      if (input) setTimeout(() => input.focus(), 60);
    } else {
      menu.classList.add("hidden");
      if (btn) btn.classList.remove("active");
    }
  }

  function toggleSettingsMenu(forceOpen) {
    const menu = toolbarSettingsMenu || document.getElementById("toolbarSettingsMenu");
    const btn = btnToolbarSettings || document.getElementById("btnToolbarSettings");
    if (!menu) return;
    const shouldOpen = (typeof forceOpen === "boolean") ? forceOpen : menu.classList.contains("hidden");
    if (shouldOpen) {
      ensureBookmarkElements();
      toggleVideoSourceMenu(false);
      menu.classList.remove("hidden");
      if (btn) btn.classList.add("active");
    } else {
      menu.classList.add("hidden");
      if (btn) btn.classList.remove("active");
    }
  }

  if (btnToolbarVideoSource) {
    btnToolbarVideoSource.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleVideoSourceMenu();
    });
  }

  if (btnCloseVideoSource) {
    btnCloseVideoSource.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleVideoSourceMenu(false);
    });
  }

  if (btnToolbarSettings) {
    btnToolbarSettings.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSettingsMenu();
    });
  }

  if (btnCloseToolbarSettings) {
    btnCloseToolbarSettings.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSettingsMenu(false);
    });
  }

  // Dismiss either menu when clicking outside
  document.addEventListener("click", (e) => {
    const sMenu = toolbarSettingsMenu || document.getElementById("toolbarSettingsMenu");
    const sBtn = btnToolbarSettings || document.getElementById("btnToolbarSettings");
    if (sMenu && !sMenu.classList.contains("hidden")) {
      if (!sMenu.contains(e.target) && (!sBtn || !sBtn.contains(e.target))) {
        toggleSettingsMenu(false);
      }
    }
    const vMenu = toolbarVideoSourceMenu || document.getElementById("toolbarVideoSourceMenu");
    const vBtn = btnToolbarVideoSource || document.getElementById("btnToolbarVideoSource");
    if (vMenu && !vMenu.classList.contains("hidden")) {
      if (!vMenu.contains(e.target) && (!vBtn || !vBtn.contains(e.target))) {
        toggleVideoSourceMenu(false);
      }
    }
  });

  if (btnReloadVideo) {
    btnReloadVideo.addEventListener("click", () => {
      player.reload();
      toggleSettingsMenu(false);
    });
  }

  if (elSelectSpeed) {
    elSelectSpeed.addEventListener("change", (e) => {
      player.setSpeedOverride(e.target.value);
      setTimeout(updateVideoEtaDisplay, 50);
    });
  }

  bindSubtitleSelectEvents();

  bindCustomSrtEvents();

  // Drag-and-drop .srt files onto window
  window.addEventListener("dragover", (e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
    }
  });

  window.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".srt")) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = (evt) => {
          loadCustomSrtText(evt.target.result, file.name);
        };
        reader.readAsText(file);
      }
    }
  });

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
      if (!pinVal) {
        if (pinErrorMsg) {
          pinErrorMsg.textContent = "Please enter the 4-digit room PIN.";
          pinErrorMsg.classList.remove("hidden");
        }
        if (inputJoinPin) inputJoinPin.focus({ preventScroll: true });
        return;
      }
      pendingPin = pinVal;
      safeSet(sessionStorage, `wp_pin_${roomId}`, pendingPin);
      if (pinErrorMsg) pinErrorMsg.classList.add("hidden");
      btnSubmitPin.textContent = "Joining...";
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "join",
          user_id: userId,
          username: username,
          color: userColor,
          avatar: userAvatar,
          is_host: false,
          pin: pendingPin
        }));
      } else {
        connectWebSocket();
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
      const activePin = roomPin || pendingPin;
      if (activePin) {
        navigator.clipboard.writeText(activePin).then(() => {
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
      if (pendingPin) {
        // Join Room with Security PIN
        socket.send(JSON.stringify({
          type: "join",
          user_id: userId,
          username: username,
          color: userColor,
          avatar: userAvatar,
          is_host: false,
          pin: pendingPin
        }));
      } else if (pinModal) {
        pinModal.classList.remove("hidden");
        if (inputJoinPin) inputJoinPin.focus({ preventScroll: true });
      }

      // Start periodic progress reporting loop (only sends once joined with valid roomPin)
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        if (roomPin) {
          sendProgressUpdate(player.getState());
        }
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
      if (typeof activeTypingUsers !== "undefined") {
        activeTypingUsers.forEach(u => { if (u.timeoutId) clearTimeout(u.timeoutId); });
        activeTypingUsers.clear();
        if (typeof renderTypingIndicator === "function") renderTypingIndicator();
      }
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
          if (btnSubmitPin) btnSubmitPin.textContent = "Join Room";
          const hadAttemptedPin = !!pendingPin;
          pendingPin = "";
          roomPin = "";
          try {
            sessionStorage.removeItem(`wp_pin_${roomId}`);
            localStorage.removeItem(`wp_pin_${roomId}`);
          } catch (e) {}
          if (pinModal) {
            pinModal.classList.remove("hidden");
            if (pinErrorMsg) {
              if (hadAttemptedPin) {
                pinErrorMsg.textContent = "❌ Incorrect PIN. Please enter the PIN shown in the server terminal.";
                pinErrorMsg.classList.remove("hidden");
              } else {
                pinErrorMsg.classList.add("hidden");
              }
            }
            if (inputJoinPin) {
              inputJoinPin.value = "";
              inputJoinPin.focus({ preventScroll: true });
            }
          }
        }
        break;

      case "room_state":
        if (btnSubmitPin) btnSubmitPin.textContent = "Join Room";
        updateUserBadge();
        if (data.pin) {
          roomPin = data.pin;
          pendingPin = data.pin;
          safeSet(sessionStorage, `wp_pin_${roomId}`, roomPin);
          if (elRoomPinDisplay) elRoomPinDisplay.textContent = roomPin;
          document.querySelectorAll("#roomPinDisplay, .pin-code").forEach(el => el.textContent = roomPin);
        }
        if (pinModal) pinModal.classList.add("hidden");
        if (data.video) {
          applyVideoMetadata(data.video);
        }
        if (data.bookmarks) {
          sharedBookmarks = data.bookmarks;
          syncBookmarksUI();
        }
        if (data.watchlist) {
          sharedWatchlist = data.watchlist;
          renderWatchlistUI();
        }
        if (data.minimap) {
          processMinimapUpdate(data.minimap);
        }
        if (data.chat_messages) {
          elChatMessages.innerHTML = "";
          activeActivityCluster = null;
          if (activityCollapseTimer) {
            clearTimeout(activityCollapseTimer);
            activityCollapseTimer = null;
          }
          data.chat_messages.forEach(addChatMessage);
          collapseActiveActivityCluster();
        }
        if (data.config) {
          applyConfigValues(data.config);
        }
        if (data.shared_subtitles) {
          updateSharedSubtitlesList(data.shared_subtitles);
        }
        // Guarantee page remains at the very top on initial load
        window.scrollTo(0, 0);
        requestAnimationFrame(() => window.scrollTo(0, 0));
        break;

      case "shared_subtitles_updated":
        if (data.shared_subtitles) {
          updateSharedSubtitlesList(data.shared_subtitles);
        }
        if (data.deleted_sub_id) {
          const delId = String(data.deleted_sub_id).replace(/^shared:/, "");
          if (activeSubItem && (activeSubItem.url === `shared:${delId}` || activeSubItem.url === delId)) {
            activeSubItem = null;
            currentSubtitleCues = [];
            revertToDefaultOrOffSubtitle();
          }
          if (activeSecondarySubItem && (activeSecondarySubItem.url === `shared:${delId}` || activeSecondarySubItem.url === delId)) {
            activeSecondarySubItem = null;
            secondarySubtitleCues = [];
            if (elSelectSecondarySub) elSelectSecondarySub.value = "off";
            try { localStorage.setItem("wp_secondary_sub_preference", "off"); } catch (e) {}
          }
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
        peerMaxTimes.clear();
        if (data.video) {
          applyVideoMetadata(data.video);
          const streamUrl = apiUrl(data.video.proxy_stream_url);
          if (player.currentStreamUrl !== streamUrl) {
            player.loadSource(streamUrl, data.video);
          }
        }
        if (data.shared_subtitles !== undefined) {
          updateSharedSubtitlesList(data.shared_subtitles);
        } else {
          updateSharedSubtitlesList([]);
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
          if (!data.message.is_system) {
            spawnRoomDanmakuItem(data.message);
          }
          if (data.message.user_id && typeof activeTypingUsers !== "undefined" && activeTypingUsers.has(data.message.user_id)) {
            const existing = activeTypingUsers.get(data.message.user_id);
            if (existing && existing.timeoutId) clearTimeout(existing.timeoutId);
            activeTypingUsers.delete(data.message.user_id);
            if (typeof renderTypingIndicator === "function") renderTypingIndicator();
          }
        }
        break;

      case "user_typing":
        if (typeof handleUserTyping === "function") {
          handleUserTyping(data);
        }
        break;

      case "chat_message_edited":
        if (data.message) {
          handleChatMessageEdited(data.message);
        }
        break;

      case "chat_message_deleted":
        if (data.message_id) {
          handleChatMessageDeleted(data.message_id);
        }
        break;

      case "chat_reaction_update":
        if (data.message_id && data.reactions) {
          renderMessageReactions(data.message_id, data.reactions);
        }
        break;

      case "live_reaction":
        triggerFloatingReactionBurst(data);
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

      case "bookmarks_updated":
        if (data.bookmarks) {
          sharedBookmarks = data.bookmarks;
          syncBookmarksUI();
        }
        if (data.minimap) {
          processMinimapUpdate(data.minimap);
        }
        break;

      case "watchlist_updated":
        if (data.watchlist) {
          sharedWatchlist = data.watchlist;
          renderWatchlistUI();
        }
        break;
    }
  }

  function processMinimapUpdate(minimapData) {
    lastMinimapData = minimapData;
    if (minimapData.bookmarks) {
      sharedBookmarks = minimapData.bookmarks;
    }
    // 1. Render minimap scrubber
    minimap.render(minimapData, userId);
    syncBookmarksUI();

    // 2. Find self in markers to check dynamic target speed assigned by server
    const markers = minimapData.markers || [];
    const selfMarker = markers.find(m => m.user_id === userId);

    if (selfMarker) {
      if (!player.video.paused) {
        player.applySpeed(selfMarker.target_speed, selfMarker.effective_status);
      }
    }

    // 3. Update viewers list in sidebar
    renderViewersList(markers);

    // 4. Update ETA display with real-time speed/catch-up changes
    updateVideoEtaDisplay();
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

  const peerMaxTimes = new Map(); // userId -> last monotonic playback time

  function updateSelfViewerCardTime(curTime) {
    if (!elViewersList) return;
    const selfCard = elViewersList.querySelector(".viewer-card.is-self");
    if (selfCard) {
      const timeSub = selfCard.querySelector(".viewer-time-sub");
      if (timeSub) {
        const leadText = timeSub.getAttribute("data-lead") || "";
        timeSub.textContent = `${formatTime(curTime)} ${leadText}`.trim();
      }
    }
  }

  function renderViewersList(markers) {
    if (!elViewersList) return;
    if (elViewerCount) elViewerCount.textContent = markers.length;
    elViewersList.innerHTML = "";

    const leadStatuses = calculateViewerLeadStatus(markers);

    // Stable deterministic order: Self ALWAYS pinned to top, peers sorted alphabetically by name
    // This prevents viewer cards from jumping/swapping order when timestamps cross by a few milliseconds.
    const sortedMarkers = [...markers].sort((a, b) => {
      if (a.user_id === userId) return -1;
      if (b.user_id === userId) return 1;
      return (a.username || "").localeCompare(b.username || "");
    });

    sortedMarkers.forEach(m => {
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

      // Self card tracks live local video time directly; peer cards clamp backward micro-jitter (< 1.5s)
      let timeStr = "";
      if (isSelf) {
        const selfTime = (player && player.video && !isNaN(player.video.currentTime))
          ? player.video.currentTime
          : (Number(m.current_time) || 0);
        timeStr = formatTime(selfTime);
      } else {
        let pTime = Number(m.current_time) || 0;
        if (!m.is_paused) {
          const prevTime = peerMaxTimes.get(m.user_id);
          if (prevTime !== undefined) {
            const diff = prevTime - pTime;
            if (diff > 0 && diff < 1.5) {
              pTime = prevTime; // Ignore backward micro-jitter from A/V clock drift or packet jitter
            } else {
              peerMaxTimes.set(m.user_id, pTime);
            }
          } else {
            peerMaxTimes.set(m.user_id, pTime);
          }
        } else {
          peerMaxTimes.set(m.user_id, pTime);
        }
        timeStr = formatTime(pTime);
      }

      card.innerHTML = `
        <div class="viewer-card-left">
          <div class="viewer-avatar">${m.avatar || '👤'}</div>
          <div class="viewer-info-col">
            <div class="viewer-name-row">
              <span class="viewer-name">${escapeHtml(m.username)} ${isSelf ? '(You)' : ''}</span>
            </div>
            <span class="viewer-time-sub" data-lead="${escapeHtml(leadLabel)}">${timeStr} ${leadLabel}</span>
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
      sel.title = "Change Room Video Quality";
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

    // Clear subtitles when a new video that doesn't match the current one is loaded
    const isDifferentVideo = activeVideoMetadata && !isSameVideo(activeVideoMetadata, video);
    if (isDifferentVideo) {
      clearSubtitles(true);
    }

    activeVideoMetadata = video;
    bilibiliReferenceCues = [];
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

    // Refresh Bilibili Danmaku if Beta toggle is active
    if (video.cid && Number(video.cid) !== loadedDanmakuCid) {
      clearDanmakuScreen();
      if (danmakuEnabled) {
        loadDanmakuForCurrentVideo();
      }
    }

    updateVideoEtaDisplay();
  }

  // =========================================
  // Chat Emoji Bar, Picker Context Menu & Message Reactions
  // =========================================
  const QUICK_CHAT_EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "👏", "😱", "🍿", "😮", "😭"];

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

  let activeActivityCluster = null;
  let activityCollapseTimer = null;

  function collapseActiveActivityCluster() {
    if (activityCollapseTimer) {
      clearTimeout(activityCollapseTimer);
      activityCollapseTimer = null;
    }
    if (!activeActivityCluster) return;

    const cluster = activeActivityCluster;
    activeActivityCluster = null;

    const itemsWrap = cluster.querySelector(".activity-cluster-items");
    if (!itemsWrap) return;
    const items = Array.from(itemsWrap.children);
    const count = items.length;

    // Single activity item is not a chain - unwrap it so it appears normally
    if (count <= 1) {
      if (items[0] && cluster.parentNode) {
        cluster.parentNode.insertBefore(items[0], cluster);
        cluster.remove();
      } else if (count === 0) {
        cluster.remove();
      }
      return;
    }

    // 2 or more items: collapse into a combined summary toggle
    cluster.classList.remove("open");
    cluster.classList.add("collapsed");

    const latestText = items[items.length - 1].textContent || "Activity";
    const otherCount = count - 1;
    const summaryText = `${latestText} (+${otherCount} more)`;

    let toggleBtn = cluster.querySelector(".btn-activity-cluster-toggle");
    if (!toggleBtn) {
      toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "btn-activity-cluster-toggle";
      cluster.insertBefore(toggleBtn, itemsWrap);

      toggleBtn.addEventListener("click", () => {
        const isCollapsed = cluster.classList.contains("collapsed");
        if (isCollapsed) {
          cluster.classList.remove("collapsed");
          cluster.classList.add("expanded");
          toggleBtn.innerHTML = `
            <span class="cluster-summary-text">${count} activities</span>
            <span class="cluster-toggle-icon">▴</span>
          `;
          toggleBtn.title = "Click to collapse activities";
        } else {
          cluster.classList.remove("expanded");
          cluster.classList.add("collapsed");
          toggleBtn.innerHTML = `
            <span class="cluster-summary-text">${escapeHtml(summaryText)}</span>
            <span class="cluster-toggle-icon">▾</span>
          `;
          toggleBtn.title = `Click to view all ${count} activities`;
        }
      });
    }

    toggleBtn.innerHTML = `
      <span class="cluster-summary-text">${escapeHtml(summaryText)}</span>
      <span class="cluster-toggle-icon">▾</span>
    `;
    toggleBtn.title = `Click to view all ${count} activities`;

    if (elChatMessages) {
      const wasNearBottom = (elChatMessages.scrollHeight - elChatMessages.scrollTop - elChatMessages.clientHeight) < 80;
      if (wasNearBottom) {
        elChatMessages.scrollTop = elChatMessages.scrollHeight;
      }
    }
  }

  function addChatMessage(msg) {
    if (msg.is_system) {
      if (!activeActivityCluster) {
        activeActivityCluster = document.createElement("div");
        activeActivityCluster.className = "chat-activity-cluster open";
        const itemsWrap = document.createElement("div");
        itemsWrap.className = "activity-cluster-items";
        activeActivityCluster.appendChild(itemsWrap);
        elChatMessages.appendChild(activeActivityCluster);
      }

      const item = document.createElement("div");
      item.className = "chat-activity-log";
      const cleanText = (msg.text || "").replace(/^(?:[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200D\uFE0F]+\s+)(?=[\p{Extended_Pictographic}\p{Emoji_Presentation}])/u, "");
      item.textContent = cleanText;

      const itemsWrap = activeActivityCluster.querySelector(".activity-cluster-items");
      if (itemsWrap) {
        itemsWrap.appendChild(item);
      } else {
        activeActivityCluster.appendChild(item);
      }

      // Reset 30s inactivity timer to collapse
      if (activityCollapseTimer) clearTimeout(activityCollapseTimer);
      activityCollapseTimer = setTimeout(() => {
        collapseActiveActivityCluster();
      }, 30000);
    } else {
      // Whenever a regular chat message arrives, collapse any ongoing activity chain immediately
      collapseActiveActivityCluster();

      const isSelf = (msg.user_id === userId);
      const msgColor = msg.color || "#3b82f6";
      const row = document.createElement("div");
      row.className = `chat-bubble-row ${isSelf ? 'self' : 'other'}`;
      row.id = `chat-msg-${msg.id}`;
      row.setAttribute("data-msg-id", msg.id);
      row.style.setProperty("--msg-color", msgColor);

      const clockStr = formatTimeOfDay(msg.timestamp);
      const videoSec = (msg.video_time !== undefined && msg.video_time !== null) ? Number(msg.video_time) : 0;
      const videoStr = formatTime(videoSec);
      const combinedTimeStr = clockStr ? `${clockStr} • 🎬 ${videoStr}` : `🎬 ${videoStr}`;

      if (msg.is_deleted) {
        row.innerHTML = `
          <div class="chat-bubble-meta">
            <span class="chat-bubble-time" title="Clock time: ${clockStr || '-'} | Video time: ${videoStr}">${combinedTimeStr}</span>
          </div>
          <div class="chat-bubble-main-row">
            ${!isSelf ? `
            <span class="chat-bubble-avatar" style="border-color: rgba(255, 255, 255, 0.2); opacity: 0.6;" title="${msg.avatar || '👤'}">
              ${msg.avatar || '👤'}
            </span>
            ` : ''}
            <div class="chat-bubble-body-col">
              <div class="chat-bubble-content-wrap">
                <div class="chat-bubble ${isSelf ? 'self' : 'other'} chat-bubble-deleted">
                  <span class="chat-deleted-text">Message deleted</span>
                </div>
              </div>
            </div>
          </div>
        `;
        elChatMessages.appendChild(row);
        elChatMessages.scrollTop = elChatMessages.scrollHeight;
        return;
      }

      const hasImage = !!msg.image_url;
      const hasText = !!(msg.text && msg.text.trim());
      const imageOnlyClass = (hasImage && !hasText) ? 'image-only' : '';
      const resolvedImgUrl = hasImage ? apiUrl(msg.image_url) : '';

      row.innerHTML = `
        <div class="chat-bubble-meta">
          <span class="chat-bubble-time" title="Clock time: ${clockStr || '-'} | Video time: ${videoStr}">${combinedTimeStr}</span>
        </div>
        <div class="chat-bubble-main-row">
          ${!isSelf ? `
          <span class="chat-bubble-avatar" style="border-color: ${msgColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.6), 0 0 6px ${msgColor}55;" title="${msg.avatar || '👤'}">
            ${msg.avatar || '👤'}
          </span>
          ` : ''}
          <div class="chat-bubble-body-col">
            <div class="chat-bubble-content-wrap">
              <div class="chat-bubble ${isSelf ? 'self' : 'other'} ${imageOnlyClass}" style="--msg-color: ${msgColor}; background: linear-gradient(135deg, ${msgColor}48, ${msgColor}28); border: 1.5px solid ${msgColor}aa;">
                ${hasImage ? `
                <div class="chat-bubble-image-wrap" title="Click to view full image">
                  <img src="${resolvedImgUrl}" class="chat-bubble-image" alt="Pasted screenshot" loading="lazy" />
                </div>
                ` : ''}
                ${hasText ? `<span class="chat-bubble-text">${escapeHtml(msg.text)}</span>` : ''}
                ${msg.is_edited ? `<span class="chat-edited-tag" title="Edited message">(edited)</span>` : ''}
              </div>
              <div class="chat-reaction-actions">
                <button type="button" class="btn-quick-react" data-emoji="👍" title="Thumbs up">👍</button>
                <button type="button" class="btn-quick-react" data-emoji="❤️" title="Heart">❤️</button>
                <button type="button" class="btn-quick-react" data-emoji="😂" title="Laugh">😂</button>
                <button type="button" class="btn-quick-react" data-emoji="🔥" title="Fire">🔥</button>
                <button type="button" class="btn-open-react-menu" title="All emojis...">➕</button>
                ${isSelf && !msg.is_system ? `
                  <span class="chat-action-divider"></span>
                  <button type="button" class="btn-chat-action btn-edit-msg" title="Edit message">✏️</button>
                  <button type="button" class="btn-chat-action btn-delete-msg danger" title="Delete message">🗑️</button>
                ` : ''}
              </div>
            </div>
            <div class="chat-reactions-row" id="reactions-${msg.id}"></div>
          </div>
        </div>
      `;

      if (hasImage) {
        const imgEl = row.querySelector(".chat-bubble-image");
        if (imgEl) {
          imgEl.addEventListener("click", () => openLightbox(resolvedImgUrl));
        }
      }

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

      // Edit message button click
      const btnEdit = row.querySelector(".btn-edit-msg");
      if (btnEdit) {
        btnEdit.addEventListener("click", (e) => {
          e.stopPropagation();
          const currentText = row.querySelector(".chat-bubble-text")?.textContent || "";
          startEditingMessage(msg.id, currentText);
        });
      }

      // Delete message button click
      const btnDelete = row.querySelector(".btn-delete-msg");
      if (btnDelete) {
        btnDelete.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteMessage(msg.id);
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

  function startEditingMessage(msgId, currentText) {
    const row = document.getElementById(`chat-msg-${msgId}`);
    if (!row) return;
    const bubbleEl = row.querySelector(".chat-bubble");
    if (!bubbleEl) return;
    if (bubbleEl.querySelector(".chat-inline-editor")) return;

    const textEl = bubbleEl.querySelector(".chat-bubble-text");
    if (textEl) textEl.style.display = "none";

    const editorDiv = document.createElement("div");
    editorDiv.className = "chat-inline-editor";
    editorDiv.innerHTML = `
      <textarea class="chat-edit-input" rows="2">${escapeHtml(currentText || "")}</textarea>
      <div class="chat-edit-actions">
        <button type="button" class="btn-edit-cancel">Cancel (Esc)</button>
        <button type="button" class="btn-edit-save">Save (Enter)</button>
      </div>
    `;

    const textarea = editorDiv.querySelector(".chat-edit-input");
    const btnCancel = editorDiv.querySelector(".btn-edit-cancel");
    const btnSave = editorDiv.querySelector(".btn-edit-save");

    const cancelEdit = () => {
      editorDiv.remove();
      if (textEl) textEl.style.display = "";
    };

    const saveEdit = () => {
      const newText = textarea.value.trim();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "chat_edit",
          message_id: msgId,
          text: newText,
          user_id: userId
        }));
      }
      cancelEdit();
    };

    btnCancel.addEventListener("click", cancelEdit);
    btnSave.addEventListener("click", saveEdit);

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    });

    bubbleEl.appendChild(editorDiv);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, 50);
  }

  function deleteMessage(msgId) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "chat_delete",
        message_id: msgId,
        user_id: userId
      }));
    }
  }

  function handleChatMessageEdited(message) {
    const row = document.getElementById(`chat-msg-${message.id}`);
    if (!row) return;
    const bubbleEl = row.querySelector(".chat-bubble");
    if (!bubbleEl) return;

    // Remove inline editor if active
    const editor = bubbleEl.querySelector(".chat-inline-editor");
    if (editor) editor.remove();

    let textEl = bubbleEl.querySelector(".chat-bubble-text");
    if (textEl) {
      textEl.textContent = message.text;
      textEl.style.display = "";
    } else if (message.text) {
      textEl = document.createElement("span");
      textEl.className = "chat-bubble-text";
      textEl.textContent = message.text;
      bubbleEl.appendChild(textEl);
    }

    // Add or ensure (edited) tag is displayed
    let editedTag = bubbleEl.querySelector(".chat-edited-tag");
    if (!editedTag) {
      editedTag = document.createElement("span");
      editedTag.className = "chat-edited-tag";
      editedTag.title = "Edited message";
      editedTag.textContent = "(edited)";
      bubbleEl.appendChild(editedTag);
    }
  }

  function handleChatMessageDeleted(messageId) {
    const row = document.getElementById(`chat-msg-${messageId}`);
    if (row) {
      const bubbleEl = row.querySelector(".chat-bubble");
      if (bubbleEl) {
        bubbleEl.className = "chat-bubble chat-bubble-deleted";
        bubbleEl.removeAttribute("style");
        bubbleEl.innerHTML = `<span class="chat-deleted-text">Message deleted</span>`;
      }
      const actionsEl = row.querySelector(".chat-reaction-actions");
      if (actionsEl) actionsEl.remove();
      const reactionsRow = row.querySelector(".chat-reactions-row");
      if (reactionsRow) reactionsRow.innerHTML = "";
    }
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
      toggleVideoSourceMenu(false);
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
    elChatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = elChatInput ? elChatInput.value.trim() : "";
      const hasImage = !!pendingChatImage;
      if (!text && !hasImage) return;
      collapseActiveActivityCluster();

      let uploadedImageUrl = null;
      if (hasImage) {
        const btnSend = elChatForm.querySelector(".btn-send");
        const originalText = btnSend ? btnSend.textContent : "Send";
        if (btnSend) {
          btnSend.disabled = true;
          btnSend.textContent = "⏳...";
        }

        try {
          const resp = await apiFetch(`/api/room/${roomId}/upload-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_data: pendingChatImage })
          });
          if (resp.ok) {
            const data = await resp.json();
            uploadedImageUrl = data.url;
          } else {
            console.warn("Upload failed, falling back to data URL");
            uploadedImageUrl = pendingChatImage;
          }
        } catch (err) {
          console.warn("Upload error, using fallback:", err);
          uploadedImageUrl = pendingChatImage;
        } finally {
          if (btnSend) {
            btnSend.disabled = false;
            btnSend.textContent = originalText;
          }
        }
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        const curVideoTime = (player && player.video && !isNaN(player.video.currentTime)) ? player.video.currentTime : 0;
        socket.send(JSON.stringify({
          type: "chat",
          user_id: userId,
          text: text,
          image_url: uploadedImageUrl,
          video_time: curVideoTime
        }));
        if (elChatInput) elChatInput.value = "";
        setPendingChatImage(null);
        if (myTypingTimeout) clearTimeout(myTypingTimeout);
        sendTypingStatus(false);
      }
    });

    // Handle paste event directly on chat form
    elChatForm.addEventListener("paste", handlePasteEvent);
  }

  // Live "is typing..." Indicator State & Handlers
  const activeTypingUsers = new Map(); // userId -> { username, avatar, timeoutId }
  let myTypingState = false;
  let myTypingTimeout = null;

  function sendTypingStatus(isTyping) {
    if (myTypingState === isTyping) return;
    myTypingState = isTyping;
    if (socket && socket.readyState === WebSocket.OPEN && roomPin) {
      socket.send(JSON.stringify({
        type: "typing",
        user_id: userId,
        username: username,
        avatar: userAvatar,
        is_typing: isTyping
      }));
    }
  }

  function handleUserTyping(data) {
    if (!data || !data.user_id || data.user_id === userId) return;

    if (data.is_typing) {
      const existing = activeTypingUsers.get(data.user_id);
      if (existing && existing.timeoutId) clearTimeout(existing.timeoutId);

      const timeoutId = setTimeout(() => {
        activeTypingUsers.delete(data.user_id);
        renderTypingIndicator();
      }, 3500);

      activeTypingUsers.set(data.user_id, {
        username: data.username || "Viewer",
        avatar: data.avatar || "👤",
        timeoutId
      });
    } else {
      const existing = activeTypingUsers.get(data.user_id);
      if (existing && existing.timeoutId) clearTimeout(existing.timeoutId);
      activeTypingUsers.delete(data.user_id);
    }

    renderTypingIndicator();
  }

  function renderTypingIndicator() {
    const indicator = document.getElementById("chatTypingIndicator");
    if (!indicator) return;

    const typers = Array.from(activeTypingUsers.values());
    const wasHidden = indicator.classList.contains("hidden");
    if (typers.length === 0) {
      indicator.classList.add("hidden");
      return;
    }

    const avatarEl = indicator.querySelector(".typing-avatar");
    const textEl = indicator.querySelector(".typing-text");

    const avatars = typers.map(t => t.avatar).join(" ");
    if (avatarEl) avatarEl.textContent = avatars;
    if (textEl) {
      textEl.textContent = typers.length === 1 ? "is typing" : "are typing";
    }
    indicator.title = typers.map(t => `${t.avatar} ${t.username}`).join(", ") + (typers.length === 1 ? " is typing..." : " are typing...");

    indicator.classList.remove("hidden");
    if (wasHidden && elChatMessages) {
      const isNearBottom = (elChatMessages.scrollHeight - elChatMessages.scrollTop - elChatMessages.clientHeight) < 60;
      if (isNearBottom) {
        requestAnimationFrame(() => {
          elChatMessages.scrollTop = elChatMessages.scrollHeight;
        });
      }
    }
  }

  if (elChatInput) {
    elChatInput.addEventListener("input", () => {
      const hasText = elChatInput.value.trim().length > 0;
      if (hasText) {
        sendTypingStatus(true);
        if (myTypingTimeout) clearTimeout(myTypingTimeout);
        myTypingTimeout = setTimeout(() => {
          sendTypingStatus(false);
        }, 2500);
      } else {
        if (myTypingTimeout) clearTimeout(myTypingTimeout);
        sendTypingStatus(false);
      }
    });

    elChatInput.addEventListener("blur", () => {
      if (myTypingTimeout) clearTimeout(myTypingTimeout);
      sendTypingStatus(false);
    });

    elChatInput.addEventListener("paste", handlePasteEvent);
  }

  const chatCardEl = document.querySelector(".chat-card");
  if (chatCardEl) {
    chatCardEl.addEventListener("paste", handlePasteEvent);
    chatCardEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      chatCardEl.classList.add("dragover");
    });
    chatCardEl.addEventListener("dragleave", () => {
      chatCardEl.classList.remove("dragover");
    });
    chatCardEl.addEventListener("drop", (e) => {
      e.preventDefault();
      chatCardEl.classList.remove("dragover");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file && file.type && file.type.startsWith("image/")) {
          handleImageFile(file);
        }
      }
    });
  }

  // Also handle global Escape to close lightbox or modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      const m = document.getElementById("moreSubSettingsModal");
      if (m && !m.classList.contains("hidden")) {
        m.classList.add("hidden");
      }
    }
  });

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
  const btnEditProfile = document.getElementById("btnEditProfile");
  const btnCloseProfile = document.getElementById("btnCloseProfileModal");
  const btnSaveProfile = document.getElementById("btnSaveProfile");
  const avatarPickerGrid = document.getElementById("avatarPickerGrid");
  const colorPickerGrid = document.getElementById("colorPickerGrid");
  const profilePreviewAvatar = document.getElementById("profilePreviewAvatar");

  selectedAvatar = userAvatar;
  selectedColor = userColor;

  function updateProfilePreview() {
    if (profilePreviewAvatar) {
      profilePreviewAvatar.textContent = selectedAvatar;
      profilePreviewAvatar.style.borderColor = selectedColor;
      profilePreviewAvatar.style.backgroundColor = `${selectedColor}22`;
      profilePreviewAvatar.style.boxShadow = "none";
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
          is_host: false,
          pin: roomPin || pendingPin
        }));
      }
    });
  }

  // 11. Settings Modal (Thresholds)
  const btnOpenSettings = document.getElementById("btnOpenSettings");
  const btnCloseSettings = document.getElementById("btnCloseSettingsModal");
  const btnSaveSettings = document.getElementById("btnSaveSettings");

  if (btnOpenSettings && settingsModal) {
    btnOpenSettings.addEventListener("click", () => {
      const vMenu = toolbarVideoSourceMenu || document.getElementById("toolbarVideoSourceMenu");
      const vBtn = btnToolbarVideoSource || document.getElementById("btnToolbarVideoSource");
      if (vMenu) vMenu.classList.add("hidden");
      if (vBtn) vBtn.classList.remove("active");
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
    Object.assign(currentRoomConfig, cfg);
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
    updateVideoEtaDisplay();
  }

  // Helpers
  function updateUserBadge() {
    const avatarEl = elUserAvatar || document.getElementById("userAvatarBadge");
    if (avatarEl) {
      avatarEl.textContent = userAvatar;
      avatarEl.style.backgroundColor = `${userColor}25`;
      avatarEl.style.border = `2px solid ${userColor}`;
      avatarEl.style.boxShadow = "none";
    }
    if (elUserName) elUserName.textContent = username;
    if (elUserRole) {
      elUserRole.textContent = "Viewer";
      elUserRole.className = "role-badge";
    }
    if (elHostControls) {
      elHostControls.style.display = "flex";
    }
  }

  function setConnectionStatus(connected) {
    const statusEl = elConnStatus || document.getElementById("connStatus");
    if (!statusEl) return;
    const isDot = statusEl.classList.contains("connection-status-dot");
    const textEl = statusEl.querySelector(".status-text");
    if (connected) {
      statusEl.className = isDot ? "connection-status-dot connected" : "status-pill connected";
      statusEl.title = "Connected";
      if (textEl) textEl.textContent = "Connected";
    } else {
      statusEl.className = isDot ? "connection-status-dot disconnected" : "status-pill disconnected";
      statusEl.title = "Disconnected / Reconnecting...";
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

  // ==========================================
  // Movie Watch List (Persisted Checklist Pop-up)
  // ==========================================
  let sharedWatchlist = [];
  let currentWatchlistTab = "planned"; // "planned", "watched", "all"
  let currentWatchlistSearch = "";
  let activeTagFilter = null;

  const btnOpenWatchlist = document.getElementById("btnOpenWatchlist");
  const btnOpenWatchlistSidebar = document.getElementById("btnOpenWatchlistSidebar");
  const watchlistCountBadge = document.getElementById("watchlistCountBadge");
  const watchlistSidebarCountBadge = document.getElementById("watchlistSidebarCountBadge");
  const watchlistModal = document.getElementById("watchlistModal");
  const btnCloseWatchlistModal = document.getElementById("btnCloseWatchlistModal");
  const btnCloseWatchlistFooter = document.getElementById("btnCloseWatchlistFooter");
  const watchlistStats = document.getElementById("watchlistStats");
  const watchlistAddForm = document.getElementById("watchlistAddForm");
  const watchlistInputTitle = document.getElementById("watchlistInputTitle");
  const watchlistInputTags = document.getElementById("watchlistInputTags");
  const watchlistInputNotes = document.getElementById("watchlistInputNotes");
  const watchlistSearchInput = document.getElementById("watchlistSearchInput");
  const btnClearWatchlistSearch = document.getElementById("btnClearWatchlistSearch");
  const watchlistTagChips = document.getElementById("watchlistTagChips");
  const watchlistItemsList = document.getElementById("watchlistItemsList");
  const tabWatchlistPlanned = document.getElementById("tabWatchlistPlanned");
  const tabWatchlistWatched = document.getElementById("tabWatchlistWatched");
  const tabWatchlistAll = document.getElementById("tabWatchlistAll");
  const countPlanned = document.getElementById("countPlanned");
  const countWatched = document.getElementById("countWatched");
  const countAll = document.getElementById("countAll");

  // Watchlist Edit Modal elements
  const watchlistEditModal = document.getElementById("watchlistEditModal");
  const btnCloseWatchlistEditModal = document.getElementById("btnCloseWatchlistEditModal");
  const watchlistEditForm = document.getElementById("watchlistEditForm");
  const editWatchlistItemId = document.getElementById("editWatchlistItemId");
  const editWatchlistTitle = document.getElementById("editWatchlistTitle");
  const editWatchlistTags = document.getElementById("editWatchlistTags");
  const editWatchlistNotes = document.getElementById("editWatchlistNotes");
  const btnCancelWatchlistEdit = document.getElementById("btnCancelWatchlistEdit");

  function parseTagsInput(rawInput) {
    if (!rawInput) return [];
    return rawInput
      .split(/[,，\s]+/)
      .map(t => t.trim().replace(/^#+/, ""))
      .filter(t => t.length > 0);
  }

  function renderWatchlistUI() {
    const list = Array.isArray(sharedWatchlist) ? sharedWatchlist : [];
    const plannedCount = list.filter(item => !item.watched).length;
    const watchedCount = list.filter(item => item.watched).length;
    const totalCount = list.length;

    // 1. Update toolbar badge
    [watchlistCountBadge, watchlistSidebarCountBadge].forEach(badge => {
      if (badge) {
        if (plannedCount > 0) {
          badge.textContent = plannedCount;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }
    });

    // 2. Update tab counts & stats text
    if (countPlanned) countPlanned.textContent = plannedCount;
    if (countWatched) countWatched.textContent = watchedCount;
    if (countAll) countAll.textContent = totalCount;
    if (watchlistStats) {
      watchlistStats.innerHTML = `${plannedCount} planned &bull; ${watchedCount} watched`;
    }

    // 3. Collect unique tags across all items for tag filter chips
    const allTags = new Set();
    list.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(t => {
          if (t && t.trim()) allTags.add(t.trim());
        });
      }
    });

    if (watchlistTagChips) {
      if (allTags.size > 0) {
        watchlistTagChips.classList.remove("hidden");
        let chipsHtml = "";
        allTags.forEach(tag => {
          const isActive = activeTagFilter === tag;
          chipsHtml += `<button type="button" class="watchlist-tag-chip ${isActive ? 'active' : ''}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`;
        });
        watchlistTagChips.innerHTML = chipsHtml;

        watchlistTagChips.querySelectorAll(".watchlist-tag-chip").forEach(chip => {
          chip.addEventListener("click", () => {
            const clickedTag = chip.dataset.tag;
            activeTagFilter = (activeTagFilter === clickedTag) ? null : clickedTag;
            renderWatchlistUI();
          });
        });
      } else {
        watchlistTagChips.innerHTML = "";
        watchlistTagChips.classList.add("hidden");
        activeTagFilter = null;
      }
    }

    // 4. Filter items based on active tab, search query, and active tag filter
    const query = (currentWatchlistSearch || "").trim().toLowerCase();
    const filtered = list.filter(item => {
      // Tab filter
      if (currentWatchlistTab === "planned" && item.watched) return false;
      if (currentWatchlistTab === "watched" && !item.watched) return false;

      // Tag chip filter
      if (activeTagFilter) {
        if (!Array.isArray(item.tags) || !item.tags.includes(activeTagFilter)) {
          return false;
        }
      }

      // Search query filter (matches title, tags, notes, added_by_name)
      if (query) {
        const titleMatch = (item.title || "").toLowerCase().includes(query);
        const notesMatch = (item.notes || "").toLowerCase().includes(query);
        const authorMatch = (item.added_by_name || "").toLowerCase().includes(query);
        const tagsMatch = Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(query));
        if (!titleMatch && !notesMatch && !tagsMatch && !authorMatch) {
          return false;
        }
      }

      return true;
    });

    // 5. Render checklist items
    if (!watchlistItemsList) return;
    watchlistItemsList.innerHTML = "";

    if (filtered.length === 0) {
      const emptyMsg = list.length === 0
        ? "No movies in the watch list yet. Add one above!"
        : (currentWatchlistTab === "watched"
          ? "No watched movies yet. Check off a movie from Planned to mark it as watched!"
          : "No movies matching the current filter.");
      watchlistItemsList.innerHTML = `<div class="watchlist-empty-hint">${emptyMsg}</div>`;
      return;
    }

    // Sort: newest first within each section
    const sorted = [...filtered].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    sorted.forEach(item => {
      const isWatched = !!item.watched;
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const tagsHtml = tags.map(t => `<span class="watchlist-item-tag" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</span>`).join("");
      const notesHtml = item.notes ? `<div class="watchlist-item-notes">${escapeHtml(item.notes)}</div>` : "";
      const addedBy = item.added_by_name ? `Added by ${item.added_by_avatar || '👤'} ${item.added_by_name}` : "";

      const card = document.createElement("div");
      card.className = `watchlist-item-card ${isWatched ? 'watched' : ''}`;
      card.dataset.id = item.id;

      const checkboxCol = document.createElement("div");
      checkboxCol.className = "watchlist-checkbox-col";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "watchlist-checkbox";
      cb.dataset.id = item.id;
      cb.checked = isWatched;
      cb.title = isWatched ? "Mark as planned" : "Mark as watched";
      checkboxCol.appendChild(cb);
      card.appendChild(checkboxCol);

      const contentDiv = document.createElement("div");
      contentDiv.className = "watchlist-item-content";
      contentDiv.innerHTML = `
        <div class="watchlist-item-top">
          <span class="watchlist-item-title">${escapeHtml(item.title)}</span>
          <span class="watchlist-item-added-by">${escapeHtml(addedBy)}</span>
        </div>
        ${notesHtml}
        ${tags.length > 0 ? `<div class="watchlist-item-tags">${tagsHtml}</div>` : ''}
      `;
      card.appendChild(contentDiv);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "watchlist-item-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-watchlist-action btn-edit-watchlist";
      editBtn.dataset.id = item.id;
      editBtn.title = "Edit movie details";
      editBtn.textContent = "✏️";
      actionsDiv.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-watchlist-action danger btn-delete-watchlist";
      delBtn.dataset.id = item.id;
      delBtn.title = "Delete movie from list";
      delBtn.textContent = "🗑️";
      actionsDiv.appendChild(delBtn);
      card.appendChild(actionsDiv);

      // Checkbox event
      cb.addEventListener("change", (e) => {
        const itemId = item.id;
        const newWatched = (e && e.target) ? e.target.checked : cb.checked;
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "watchlist_toggle",
            item_id: itemId,
            watched: newWatched
          }));
        }
      });

      // Edit button event
      editBtn.addEventListener("click", () => {
        openWatchlistEditModal(item.id);
      });

      // Delete button event
      delBtn.addEventListener("click", () => {
        const title = item.title || "this movie";
        if (confirm(`Remove "${title}" from the watch list?`)) {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: "watchlist_delete",
              item_id: item.id
            }));
          }
        }
      });

      // Tag chip click event
      card.querySelectorAll(".watchlist-item-tag").forEach(tagEl => {
        tagEl.addEventListener("click", () => {
          const clickedTag = tagEl.dataset.tag;
          activeTagFilter = (activeTagFilter === clickedTag) ? null : clickedTag;
          renderWatchlistUI();
        });
      });

      watchlistItemsList.appendChild(card);
    });
  }

  function openWatchlistEditModal(itemId) {
    const item = sharedWatchlist.find(i => i.id === itemId);
    if (!item || !watchlistEditModal) return;

    if (editWatchlistItemId) editWatchlistItemId.value = item.id;
    if (editWatchlistTitle) editWatchlistTitle.value = item.title || "";
    if (editWatchlistTags) editWatchlistTags.value = Array.isArray(item.tags) ? item.tags.join(", ") : "";
    if (editWatchlistNotes) editWatchlistNotes.value = item.notes || "";

    watchlistEditModal.classList.remove("hidden");
    if (editWatchlistTitle) editWatchlistTitle.focus();
  }

  function closeWatchlistEditModal() {
    if (watchlistEditModal) watchlistEditModal.classList.add("hidden");
  }

  // Open / Close Watchlist Modal
  const openWatchlistHandler = () => {
    if (watchlistModal) {
      watchlistModal.classList.remove("hidden");
      renderWatchlistUI();
      if (watchlistInputTitle) watchlistInputTitle.focus();
    }
  };

  if (btnOpenWatchlist) {
    btnOpenWatchlist.addEventListener("click", openWatchlistHandler);
  }
  if (btnOpenWatchlistSidebar) {
    btnOpenWatchlistSidebar.addEventListener("click", openWatchlistHandler);
  }

  if (btnCloseWatchlistModal) {
    btnCloseWatchlistModal.addEventListener("click", () => {
      if (watchlistModal) watchlistModal.classList.add("hidden");
    });
  }

  if (btnCloseWatchlistFooter) {
    btnCloseWatchlistFooter.addEventListener("click", () => {
      if (watchlistModal) watchlistModal.classList.add("hidden");
    });
  }

  if (watchlistModal) {
    watchlistModal.addEventListener("click", (e) => {
      if (e.target === watchlistModal) {
        watchlistModal.classList.add("hidden");
      }
    });
  }

  // Watchlist tabs
  [tabWatchlistPlanned, tabWatchlistWatched, tabWatchlistAll].forEach(tabBtn => {
    if (tabBtn) {
      tabBtn.addEventListener("click", () => {
        [tabWatchlistPlanned, tabWatchlistWatched, tabWatchlistAll].forEach(b => {
          if (b) b.classList.remove("active");
        });
        tabBtn.classList.add("active");
        currentWatchlistTab = tabBtn.dataset.tab;
        renderWatchlistUI();
      });
    }
  });

  // Watchlist search
  if (watchlistSearchInput) {
    watchlistSearchInput.addEventListener("input", () => {
      currentWatchlistSearch = watchlistSearchInput.value.trim();
      if (btnClearWatchlistSearch) {
        btnClearWatchlistSearch.classList.toggle("hidden", currentWatchlistSearch.length === 0);
      }
      renderWatchlistUI();
    });
  }

  if (btnClearWatchlistSearch) {
    btnClearWatchlistSearch.addEventListener("click", () => {
      if (watchlistSearchInput) watchlistSearchInput.value = "";
      currentWatchlistSearch = "";
      btnClearWatchlistSearch.classList.add("hidden");
      renderWatchlistUI();
    });
  }

  // Add movie form submit
  if (watchlistAddForm) {
    watchlistAddForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = (watchlistInputTitle.value || "").trim();
      if (!title) return;

      const rawTags = (watchlistInputTags ? watchlistInputTags.value : "") || "";
      const tags = parseTagsInput(rawTags);
      const notes = (watchlistInputNotes ? watchlistInputNotes.value : "").trim();

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "watchlist_add",
          user_id: userId,
          title: title,
          tags: tags,
          notes: notes
        }));
      }

      // Reset add form
      watchlistInputTitle.value = "";
      if (watchlistInputTags) watchlistInputTags.value = "";
      if (watchlistInputNotes) watchlistInputNotes.value = "";
      watchlistInputTitle.focus();
    });
  }

  // Edit movie form submit
  if (watchlistEditForm) {
    watchlistEditForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const itemId = editWatchlistItemId.value;
      const title = (editWatchlistTitle.value || "").trim();
      if (!itemId || !title) return;

      const tags = parseTagsInput(editWatchlistTags.value || "");
      const notes = (editWatchlistNotes.value || "").trim();

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "watchlist_update",
          item_id: itemId,
          title: title,
          tags: tags,
          notes: notes
        }));
      }

      closeWatchlistEditModal();
    });
  }

  if (btnCloseWatchlistEditModal) {
    btnCloseWatchlistEditModal.addEventListener("click", closeWatchlistEditModal);
  }

  if (btnCancelWatchlistEdit) {
    btnCancelWatchlistEdit.addEventListener("click", closeWatchlistEditModal);
  }

  if (watchlistEditModal) {
    watchlistEditModal.addEventListener("click", (e) => {
      if (e.target === watchlistEditModal) {
        closeWatchlistEditModal();
      }
    });
  }

  // Start connection
  connectWebSocket();
})();
