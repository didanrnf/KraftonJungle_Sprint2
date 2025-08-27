// 오디오 플레이어 인스턴스 및 상태 변수 추가
let audioPlayer = new Audio();
let currentlyPlayingButton = null;

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
  if (audioPlayer.src !== previewUrl || audioPlayer.paused) {
    if (currentlyPlayingButton && currentlyPlayingButton !== button) {
      setButtonState(currentlyPlayingButton, 'play');
    }

    audioPlayer.src = previewUrl;
    audioPlayer.play();
    setButtonState(button, 'pause');
    currentlyPlayingButton = button;
  } else {
    audioPlayer.pause();
    setButtonState(button, 'play');
  }
}

function loadRecommendations() {
  $("#loading-message").removeClass("hidden");
  $("#loading-message svg").removeClass("hidden");
  $("#loading-text").text("🎵 추천 곡을 불러오는 중...");
  $("#tracks-container").empty();
  $("#surprise-container").empty();

  $.ajax({
    url: "/api/recommend",
    method: "GET",
    success: function (data) {
      console.log("추천 API 응답:", data);

      const list = $("#tracks-container");

      // 메인 추천곡
      if (data.main_tracks && data.main_tracks.length > 0) {
        data.main_tracks.forEach(track => {
          const audioControlHTML = track.preview ? `
            <button class="preview-play-btn w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 focus:outline-none flex-shrink-0 ml-4">
                <svg class="play-icon w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                <svg class="pause-icon w-8 h-8 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 4.5a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25A.75.75 0 005.75 4.5zm8.5 0a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25a.75.75 0 00-.75-.75z"></path></svg>
            </button>
          ` : '<div class="w-16 h-16 flex-shrink-0 ml-4"></div>';

          list.append(`
            <div class="flex items-center p-6 bg-white rounded-xl shadow hover:shadow-md transition"
                 data-track-id="${track.track_id}"
                 data-title="${track.title}"
                 data-artist="${track.artist}"
                 data-album-cover="${track.album_cover}"
                 data-preview="${track.preview || ''}">
              
              <img src="${track.album_cover}" 
                   alt="Album cover" 
                   class="w-28 h-28 object-cover rounded-lg flex-shrink-0">

              <div class="flex-1 flex flex-col ml-4">
                <div>
                  <h3 class="text-lg font-semibold text-slate-800">${track.title}</h3>
                  <p class="text-slate-600">${track.artist}</p>
                </div>
                
                <div class="mt-3 flex items-center gap-3">
                  <button class="like-btn text-pink-500 w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-100" title="좋아요">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  </button>
                  <button class="share-btn text-gray-500 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200" title="글쓰기 페이지로 공유">
                      <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                  </button>
                </div>
              </div>
              
              ${audioControlHTML}
            </div>
          `);
        });
      }

      // 깜짝 추천곡 (이전 코드와 동일)
      if (data.surprise_track) {
        const st = data.surprise_track;
        const audioControlHTML = st.preview ? `
            <button class="preview-play-btn w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 focus:outline-none flex-shrink-0 ml-4">
                <svg class="play-icon w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                <svg class="pause-icon w-8 h-8 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 4.5a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25A.75.75 0 005.75 4.5zm8.5 0a.75.75 0 00-.75.75v10.5a.75.75 0 001.5 0V5.25a.75.75 0 00-.75-.75z"></path></svg>
            </button>
        ` : '<div class="w-16 h-16 flex-shrink-0 ml-4"></div>';

        $("#surprise-container").html(`
          <h3 class="text-xl font-bold text-indigo-800 mb-3">🎁 깜짝 추천곡 (${st.surprise_genre})</h3>
          <div class="flex items-center p-6 bg-white rounded-xl shadow"
               data-track-id="${st.track_id}"
               data-title="${st.title}"
               data-artist="${st.artist}"
               data-album-cover="${st.album_cover}"
               data-preview="${st.preview || ''}">
            
            <img src="${st.album_cover}" 
                 alt="Album cover" 
                 class="w-28 h-28 object-cover rounded-lg flex-shrink-0">

            <div class="flex-1 flex flex-col ml-4">
              <div>
                <p class="text-slate-700 font-semibold">${st.title}</p>
                <p class="text-slate-600">${st.artist}</p>
              </div>
              <div class="mt-3 flex items-center gap-3">
                  <button class="like-btn text-pink-500 w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-100" title="좋아요">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  </button>
                  <button class="share-btn text-gray-500 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200" title="글쓰기 페이지로 공유">
                      <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                  </button>
              </div>
            </div>
            ${audioControlHTML}
          </div>
        `);
      }

      $("#loading-message").addClass("hidden");
    },
    error: function (xhr, status, error) {
      console.error("추천 불러오기 실패:", error);
      $("#loading-message svg").addClass("hidden");
      $("#loading-text").text("추천 곡을 불러오지 못했습니다.");
    }
  });
}


$(document).ready(function () {
  loadRecommendations();
  $("#refresh-btn").on("click", loadRecommendations);

  $(document).on("click", ".like-btn", function () {
    const likeButton = $(this);
    const trackDiv = likeButton.closest('[data-track-id]');
    const songData = {
      track_id: trackDiv.data("track-id"),
      title: trackDiv.data("title"),
      artist: trackDiv.data("artist"),
      album_cover: trackDiv.data("album-cover"),
      preview: trackDiv.data("preview")
    };


    $.ajax({
      url: "/profile/like-song",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(songData),
      success: function (response) {
        likeButton.html('<svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>');
        likeButton.prop('disabled', true);
      },
      error: function (xhr) {
        const errorMsg = xhr.responseJSON ? xhr.responseJSON.message : "요청에 실패했습니다.";
        alert(errorMsg);
        if (xhr.status === 409) {
          likeButton.html('<svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>');
          likeButton.prop('disabled', true);
        }
      }
    });
  });

  $(document).on('click', '.preview-play-btn', function () {
    const button = this;
    const trackDiv = $(button).closest('[data-track-id]');
    const previewUrl = trackDiv.data('preview');
    if (previewUrl) {
      togglePlayback(previewUrl, button);
    }
  });

  audioPlayer.addEventListener('ended', () => {
    if (currentlyPlayingButton) {
      setButtonState(currentlyPlayingButton, 'play');
      currentlyPlayingButton = null;
    }
  });
});

$(document).on("click", ".share-btn", function () {
  const trackDiv = $(this).closest('[data-track-id]');
  const trackId = trackDiv.data("track-id"); // 트랙 ID 추가
  const title = encodeURIComponent(trackDiv.data("title"));
  const artist = encodeURIComponent(trackDiv.data("artist"));
  const album = encodeURIComponent(trackDiv.data("album-cover"));

  // URL에 trackId 파라미터 추가
  window.location.href = `/write?trackId=${trackId}&title=${title}&artist=${artist}&album=${album}`;
});
