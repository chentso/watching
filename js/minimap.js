/**
 * Minimap Component: Renders a dedicated progress bar for each active viewer
 * using the viewer's chosen color, with their avatar icon at the front of the bar.
 * The container box automatically autosizes based on the number of viewers.
 */
class Minimap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onSeek = options.onSeek || (() => {});
    this.currentUserId = null;
    this.lanesMap = new Map(); // userId -> { laneEl, fillEl, headEl, timeEl, speedBadge, nameEl, bufferedEl }
    this.duration = 0;

    this.initEvents();
  }

  initEvents() {
    if (!this.container) return;

    this.container.addEventListener("click", (e) => {
      // Find the track element clicked, or calculate relative to the full track area
      const track = e.target.closest(".viewer-lane-track");
      if (track) {
        const rect = track.getBoundingClientRect();
        if (rect.width > 0) {
          const clickX = e.clientX - rect.left;
          const percent = Math.max(0, Math.min(1, clickX / rect.width));
          this.onSeek(percent);
          return;
        }
      }

      // Fallback: calculate from container bounds
      const rect = this.container.getBoundingClientRect();
      if (rect.width > 0) {
        // Account for horizontal padding (16px left and right)
        const pad = 16;
        const availableW = Math.max(1, rect.width - pad * 2);
        const clickX = e.clientX - rect.left - pad;
        const percent = Math.max(0, Math.min(1, clickX / availableW));
        this.onSeek(percent);
      }
    });
  }

  updateLocalProgress(currentTime, duration, bufferedEnd = 0) {
    this.duration = duration || 0;
    if (!this.currentUserId || !duration || duration <= 0) return;

    const lane = this.lanesMap.get(this.currentUserId);
    if (!lane) return;

    const pct = Math.min(100, Math.max(0, (currentTime / duration) * 100));
    lane.fillEl.style.width = `${pct}%`;
    lane.headEl.style.left = `${pct}%`;
    lane.timeEl.textContent = this.formatSeconds(currentTime);

    if (lane.bufferedEl && bufferedEnd > 0) {
      const bufPct = Math.min(100, Math.max(0, (bufferedEnd / duration) * 100));
      lane.bufferedEl.style.width = `${bufPct}%`;
    }
  }

  ensureLocalUserLane(userId, username, color, avatar, isHost, duration = 0) {
    if (!this.container || !userId) return;
    this.currentUserId = userId;
    if (duration > 0) this.duration = duration;

    let lane = this.lanesMap.get(userId);
    const mockMarker = {
      user_id: userId,
      username: username || "Viewer",
      color: color || "#3b82f6",
      avatar: avatar || "👤",
      is_host: Boolean(isHost),
      progress_percent: 0,
      current_time: 0,
      formatted_time: "00:00",
      target_speed: 1.25,
      is_paused: true
    };

    if (!lane) {
      lane = this.createLaneElement(mockMarker, true);
      this.container.appendChild(lane.laneEl);
      this.lanesMap.set(userId, lane);
    }
    this.updateLaneElement(lane, mockMarker, true);
  }

  render(minimapData, currentUserId) {
    if (!this.container || !minimapData) return;
    this.currentUserId = currentUserId;

    if (minimapData.duration) {
      this.duration = minimapData.duration;
    }

    const markers = minimapData.markers || [];
    const activeUserIds = new Set();

    markers.forEach((m) => {
      activeUserIds.add(m.user_id);
      const isSelf = (m.user_id === currentUserId);
      let lane = this.lanesMap.get(m.user_id);

      if (!lane) {
        lane = this.createLaneElement(m, isSelf);
        this.container.appendChild(lane.laneEl);
        this.lanesMap.set(m.user_id, lane);
      }

      this.updateLaneElement(lane, m, isSelf);
    });

    // Remove lanes for disconnected users so box autosizes down,
    // but retain local user's lane
    for (const [userId, lane] of this.lanesMap.entries()) {
      if (!activeUserIds.has(userId) && userId !== this.currentUserId) {
        lane.laneEl.remove();
        this.lanesMap.delete(userId);
      }
    }
  }

  createLaneElement(m, isSelf) {
    const laneEl = document.createElement("div");
    laneEl.className = `viewer-lane ${isSelf ? 'is-self' : ''}`;
    laneEl.setAttribute("data-user-id", m.user_id);

    const userColor = m.color || "#3b82f6";

    laneEl.innerHTML = `
      <div class="viewer-lane-header">
        <div class="viewer-lane-identity">
          <span class="viewer-lane-tag" style="background: ${userColor}25; color: ${userColor}; border: 1px solid ${userColor}55">
            <span class="viewer-lane-avatar">${m.avatar || '👤'}</span>
            ${isSelf ? '<span class="you-indicator">You</span>' : ''}
            ${m.is_host ? '<span class="host-indicator">👑</span>' : ''}
          </span>
        </div>
        <div class="viewer-lane-meta-right">
          <span class="viewer-lane-time">${m.formatted_time || '00:00'}</span>
          <span class="viewer-lane-speed-badge">${m.target_speed}x</span>
        </div>
      </div>
      <div class="viewer-lane-track" title="Click anywhere to jump to position">
        ${isSelf ? '<div class="viewer-lane-buffered"></div>' : ''}
        <div class="viewer-lane-fill" style="background-color: ${userColor}"></div>
        <div class="viewer-lane-head" style="background-color: ${userColor}; box-shadow: 0 0 10px ${userColor}aa;" title="${m.avatar || '👤'}${isSelf ? ' (You)' : ''}${m.is_host ? ' 👑' : ''}">
          <span class="viewer-lane-head-icon">${m.avatar || '👤'}</span>
        </div>
      </div>
    `;

    return {
      laneEl,
      fillEl: laneEl.querySelector(".viewer-lane-fill"),
      headEl: laneEl.querySelector(".viewer-lane-head"),
      headIconEl: laneEl.querySelector(".viewer-lane-head-icon"),
      timeEl: laneEl.querySelector(".viewer-lane-time"),
      speedBadge: laneEl.querySelector(".viewer-lane-speed-badge"),
      avatarEl: laneEl.querySelector(".viewer-lane-avatar"),
      tagEl: laneEl.querySelector(".viewer-lane-tag"),
      bufferedEl: laneEl.querySelector(".viewer-lane-buffered")
    };
  }

  updateLaneElement(lane, m, isSelf) {
    const pct = Math.max(0, Math.min(100, m.progress_percent || 0));
    const userColor = m.color || "#3b82f6";

    lane.fillEl.style.width = `${pct}%`;
    lane.fillEl.style.backgroundColor = userColor;

    lane.headEl.style.left = `${pct}%`;
    lane.headEl.style.backgroundColor = userColor;
    lane.headEl.style.boxShadow = `0 0 10px ${userColor}99`;
    lane.headEl.title = `${m.avatar || '👤'}${isSelf ? ' (You)' : ''}${m.is_host ? ' 👑' : ''}`;

    if (lane.headIconEl) {
      lane.headIconEl.textContent = m.avatar || "👤";
    }

    if (lane.avatarEl) {
      lane.avatarEl.textContent = m.avatar || "👤";
    }

    if (lane.tagEl) {
      lane.tagEl.style.background = `${userColor}25`;
      lane.tagEl.style.color = userColor;
      lane.tagEl.style.borderColor = `${userColor}55`;

      let hostInd = lane.tagEl.querySelector(".host-indicator");
      if (m.is_host && !hostInd) {
        const span = document.createElement("span");
        span.className = "host-indicator";
        span.textContent = "👑";
        lane.tagEl.appendChild(span);
      } else if (!m.is_host && hostInd) {
        hostInd.remove();
      }
    }

    if (lane.timeEl) {
      lane.timeEl.textContent = m.formatted_time || this.formatSeconds(m.current_time);
    }

    if (lane.speedBadge) {
      if (m.waiting_for_slowest) {
        lane.speedBadge.textContent = "⏳ Wait";
        lane.speedBadge.className = "viewer-lane-speed-badge waiting";
      } else if (m.is_paused) {
        lane.speedBadge.textContent = "⏸ Paused";
        lane.speedBadge.className = "viewer-lane-speed-badge paused";
      } else if (m.target_speed > (this.defaultSpeed || 1.25)) {
        lane.speedBadge.textContent = `🚀 ${m.target_speed}x`;
        lane.speedBadge.className = "viewer-lane-speed-badge boost";
      } else if (m.target_speed === 1.0) {
        lane.speedBadge.textContent = "🐢 1.0x";
        lane.speedBadge.className = "viewer-lane-speed-badge throttle";
      } else {
        lane.speedBadge.textContent = `⚡ ${m.target_speed}x`;
        lane.speedBadge.className = "viewer-lane-speed-badge normal";
      }
    }
  }

  formatSeconds(seconds) {
    const s = Math.floor(Math.max(0, seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

window.Minimap = Minimap;
