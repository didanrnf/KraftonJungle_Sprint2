const searchInput = document.getElementById("musicSearch");
const suggestions = document.getElementById("suggestions");
const musicDetails = document.getElementById("musicDetails");
const musicDetailsWrapper = document.getElementById("musicDetailsWrapper");
const toggleInputModeBtn = document.getElementById("toggleInputModeBtn");
const searchSection = document.getElementById("searchSection");
const manualInputSection = document.getElementById("manualInputSection");

let currentMode = "search";

// 글자 수 카운팅
document.getElementById("content").addEventListener("input", (e) => {
    document.getElementById("charCount").textContent = `${e.target.value.length}/100`;
});

// 입력 모드 토글
function toggleInputMode() {
    if (currentMode === "search") {
        currentMode = "manual";
        toggleInputModeBtn.textContent = "음악 검색하기";
        searchSection.classList.add("hidden");
        manualInputSection.classList.remove("hidden");
        musicDetails.textContent = "직접 입력 대기 중";
        musicDetailsWrapper.classList.remove("hidden");
    } else {
        currentMode = "search";
        toggleInputModeBtn.textContent = "직접 입력하기";
        searchSection.classList.remove("hidden");
        manualInputSection.classList.add("hidden");
        musicDetails.textContent = "아직 선택되지 않음";
        musicDetailsWrapper.classList.remove("hidden");
    }
}

// 검색 API 호출 (디바운스 적용)
function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

const fetchSuggestions = debounce((query) => {
    if (query.length < 2 || currentMode !== "search") {
        suggestions.innerHTML = '';
        return;
    }

    fetch(`/api/search-music?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(response => {
            if (!response.success) return;

            suggestions.innerHTML = '';
            response.data.slice(0, 10).forEach(track => {
                const li = document.createElement("li");
                li.textContent = `${track.title} - ${track.artist}`;
                li.classList.add("px-4", "py-2", "hover:bg-gray-100", "cursor-pointer");
                li.addEventListener("click", () => {
                    musicDetails.textContent = `${track.title} - ${track.artist}`;
                    musicDetailsWrapper.classList.remove("hidden");
                    suggestions.innerHTML = '';
                    searchInput.value = `${track.title} - ${track.artist}`;
                });
                suggestions.appendChild(li);
            });
        });
}, 300);

searchInput?.addEventListener("input", (e) => {
    fetchSuggestions(e.target.value);
});

// 게시 요청
function submitPost() {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = "등록 중...";
    }

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!title) {
        alert("제목을 입력해야 글을 게시할 수 있습니다.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "게시하기"; }
        return;
    }
    if (!content) {
        alert("내용을 입력해야 글을 게시할 수 있습니다.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "게시하기"; }
        return;
    }

    // 🎵 음악 정보 결정 로직
    let music = { title: "", artist: "", album_cover: "", preview: "" };

    const sharedTitleEl = document.getElementById("sharedTitle");
    const sharedArtistEl = document.getElementById("sharedArtist");
    const sharedTitle = sharedTitleEl ? sharedTitleEl.textContent.trim() : "";
    const sharedArtist = sharedArtistEl ? sharedArtistEl.textContent.trim() : "";
    const sharedCover = document.getElementById("sharedAlbumCover")?.src || "";

    const urlParams = new URLSearchParams(window.location.search);
    const sharedPreview = urlParams.get("preview") ? decodeURIComponent(urlParams.get("preview")) : "";
    const trackIdParam = urlParams.get("trackId");
    if (trackIdParam) music.track_id = decodeURIComponent(trackIdParam);

    const manualTitle = document.getElementById("manualTitle")?.value.trim();
    const manualArtist = document.getElementById("manualArtist")?.value.trim();

    const musicDetails = document.getElementById("musicDetails");
    const searchText = musicDetails ? musicDetails.textContent.trim() : "";

    if (sharedTitle && sharedArtist) {
        music.title = sharedTitle;
        music.artist = sharedArtist;
        music.album_cover = sharedCover;
        music.preview = sharedPreview;
    } else if (window.currentMode === "manual" && manualTitle && manualArtist) {
        music.title = manualTitle;
        music.artist = manualArtist;
    } else if (searchText.includes(" - ")) {
        const parts = searchText.split(" - ");
        music.title = (parts[0] || "").trim();
        music.artist = (parts[1] || "").trim();
    }

    if (!music.title || !music.artist) {
        alert("음악을 선택하거나 입력해야 글을 게시할 수 있습니다.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "게시하기"; }
        return;
    }

    fetch("/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, music })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message || "게시 완료");
            location.href = "/community";
        })
        .catch(err => {
            console.error(err);
            alert("게시 중 오류 발생");
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "게시하기"; }
        });
}


document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title");
    const artist = params.get("artist");
    const album = params.get("album");

    if (title || artist) {
        document.getElementById("musicInputSection")?.classList.add("hidden");
        document.getElementById("sharedMusicSection")?.classList.remove("hidden");
        document.getElementById("sharedTitle").textContent = decodeURIComponent(title || "");
        document.getElementById("sharedArtist").textContent = decodeURIComponent(artist || "");
        if (album) {
            const cover = document.getElementById("sharedAlbumCover");
            cover.src = decodeURIComponent(album);
            cover.classList.remove("hidden");
        }
    } else {
        document.getElementById("manualInputSection").classList.add("hidden");
        musicDetailsWrapper.classList.remove("hidden");
    }

    // 직접입력 시 엔터로 음악정보 표시
    function updateMusicDetailsFromManualInput(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            const titleVal = document.getElementById("manualTitle").value.trim();
            const artistVal = document.getElementById("manualArtist").value.trim();
            const details = titleVal && artistVal ? `${titleVal} - ${artistVal}` : "(입력된 정보가 없습니다)";
            musicDetails.textContent = details;
            musicDetailsWrapper.classList.remove("hidden");
        }
    }

    document.getElementById("manualTitle")?.addEventListener("keydown", updateMusicDetailsFromManualInput);
    document.getElementById("manualArtist")?.addEventListener("keydown", updateMusicDetailsFromManualInput);
});