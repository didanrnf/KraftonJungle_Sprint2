document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("musicSearch");
    const suggestionsList = document.getElementById("suggestions");
    const musicDetailsWrapper = document.getElementById("musicDetailsWrapper");
    const musicDetailsContainer = document.getElementById("musicDetails");

    let audioPlayer = new Audio();
    let currentlyPlayingButton = null;

    // --- (debounce, fetchSuggestions, togglePlayback 함수 등은 이전과 동일) ---

    // 선택된 곡의 상세 정보를 화면에 표시하는 함수
    function displayMusicDetails(track) {
        musicDetailsWrapper.classList.remove('hidden');

        // 재생/일시정지 버튼 HTML
        const audioControlHTML = track.preview_url ? `
            <button id="preview-play-btn" class="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 focus:outline-none">
                <svg class="play-icon w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                <svg class="pause-icon w-8 h-8 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 4.5a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25A.75.75 0 005.75 4.5zm8.5 0a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25a.75.75 0 00-.75-.75z"></path></svg>
            </button>
        ` : '';

        musicDetailsContainer.innerHTML = `
            <img src="${track.album_cover || 'https://via.placeholder.com/150'}" alt="Album Cover" class="w-40 h-40 rounded-lg shadow-lg mb-4 md:mb-0 md:mr-6">
            <div class="text-center md:text-left flex-grow">
                <h3 class="text-3xl font-bold">${track.title}</h3>
                <p class="text-xl text-gray-600 mt-1">${track.artist}</p>
                <div class="mt-4 flex items-center justify-center md:justify-start gap-4">
                    <button id="like-btn" class="text-pink-500 w-12 h-12 flex items-center justify-center rounded-full hover:bg-pink-100" title="좋아요">
                        <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    </button>
                    <button id="share-btn" class="text-gray-500 w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-200" title="글쓰기 페이지로 공유">
                        <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                    </button>
                </div>
            </div>
            ${audioControlHTML}
        `;

        // 새로 추가된 버튼들에 이벤트 리스너 할당
        const playButton = document.getElementById('preview-play-btn');
        if (playButton) {
            playButton.addEventListener('click', () => {
                togglePlayback(track.preview_url, playButton);
            });
        }

        document.getElementById('like-btn').addEventListener('click', () => handleLikeClick(track));
        document.getElementById('share-btn').addEventListener('click', () => handleShareClick(track));
    }

    // 좋아요 버튼 클릭 처리
    async function handleLikeClick(track) {
        const likeButton = document.getElementById('like-btn');
        const payload = {
            track_id: track.id,
            title: track.title,
            artist: track.artist,
            album_cover: track.album_cover,
            preview: track.preview_url
        };

        try {
            const response = await fetch('/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.success) {
                // 성공 시 하트 아이콘을 채움
                likeButton.innerHTML = '<svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>';
                likeButton.disabled = true;
            } else {
                alert(result.message); // 예: "이미 좋아요를 누른 노래입니다."
                if (response.status === 409) { // 409 Conflict (중복)
                    likeButton.innerHTML = '<svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>';
                    likeButton.disabled = true;
                }
            }
        } catch (error) {
            console.error('Like Error:', error);
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    }

    // 공유 버튼 클릭 처리
    function handleShareClick(track) {
        const title = encodeURIComponent(track.title || "");
        const artist = encodeURIComponent(track.artist || track.artist_name || "");
        const album = encodeURIComponent(track.album_cover || track.album?.cover || "");
        const preview = encodeURIComponent(track.preview || track.preview_url || "");
        const trackId = encodeURIComponent(track.id || track.track_id || "");

        let url = `/write?title=${title}&artist=${artist}&album=${album}`;
        if (preview) url += `&preview=${preview}`;
        if (trackId) url += `&trackId=${trackId}`;
        window.location.href = url;
    }


    // 아이콘 모양을 바꾸는 함수
    function setButtonState(button, state) {
        const playIcon = button.querySelector('.play-icon');
        const pauseIcon = button.querySelector('.pause-icon');
        if (state === 'play') {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        } else { // 'pause'
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        }
    }

    // 오디오 재생/일시정지를 제어하는 함수
    function togglePlayback(previewUrl, button) {
        // 다른 곡을 재생하려고 하거나, 현재 곡이 멈춰있을 때
        if (audioPlayer.src !== previewUrl || audioPlayer.paused) {
            // 이전에 재생되던 버튼이 있다면 '재생' 상태로 되돌림
            if (currentlyPlayingButton && currentlyPlayingButton !== button) {
                setButtonState(currentlyPlayingButton, 'play');
            }

            audioPlayer.src = previewUrl;
            audioPlayer.play();
            setButtonState(button, 'pause'); // 현재 버튼을 '일시정지' 아이콘으로 변경
            currentlyPlayingButton = button;
        } else { // 현재 재생 중인 곡을 다시 눌렀을 때
            audioPlayer.pause();
            setButtonState(button, 'play'); // '재생' 아이콘으로 변경
        }
    }

    // 오디오 재생이 끝나면 버튼 상태 초기화
    audioPlayer.addEventListener('ended', () => {
        if (currentlyPlayingButton) {
            setButtonState(currentlyPlayingButton, 'play');
            currentlyPlayingButton = null;
        }
    });

    // --- (나머지 코드는 이전과 동일) ---
    function debounce(func, delay = 300) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), delay); }; }
    const fetchSuggestions = debounce((query) => { if (query.length < 2) { suggestionsList.innerHTML = ''; suggestionsList.classList.add('hidden'); return; } fetch(`/api/search-music?q=${encodeURIComponent(query)}`).then(res => res.json()).then(response => { if (!response.success) { suggestionsList.innerHTML = '<li>검색 중 오류가 발생했습니다.</li>'; return; } suggestionsList.innerHTML = ''; if (response.data.length === 0) { suggestionsList.innerHTML = '<li class="px-4 py-2 text-gray-500">검색 결과가 없습니다.</li>'; } else { response.data.slice(0, 10).forEach(track => { const li = document.createElement("li"); li.textContent = `${track.title} - ${track.artist}`; li.className = "px-4 py-2 hover:bg-gray-100 cursor-pointer"; li.addEventListener("click", () => { displayMusicDetails(track); suggestionsList.innerHTML = ''; suggestionsList.classList.add('hidden'); searchInput.value = ''; }); suggestionsList.appendChild(li); }); } suggestionsList.classList.remove('hidden'); }); });
    searchInput.addEventListener("input", (e) => { fetchSuggestions(e.target.value); });
    document.addEventListener('click', function (event) { if (!searchInput.contains(event.target)) { suggestionsList.classList.add('hidden'); } });

    // URL 파라미터에서 track_id 읽기 → 있으면 자동 표시
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get("track_id");
    if (trackId) {
        fetch(`/api/track/${trackId}`)
            .then(res => res.json())
            .then(response => {
                if (response.success && response.data) {
                    displayMusicDetails(response.data);
                }
            })
            .catch(err => console.error("Track fetch error:", err));
    }
});