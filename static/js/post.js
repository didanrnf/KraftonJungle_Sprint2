let postId = null; // 전역 postId
let isPlaying = false; // 재생 상태 추적
let currentPlayPromise = null; // 현재 재생 Promise 추적

document.addEventListener("DOMContentLoaded", function () {
    const pathSegments = window.location.pathname.split("/");
    postId = pathSegments[pathSegments.length - 1];

    fetch(`/api/post/${postId}`)
        .then((res) => res.json())
        .then(async (data) => {
            if (!data.success) {
                alert("게시글을 불러오는 데 실패했습니다.");
                return;
            }

            const post = data.data;
            document.getElementById("post-title").textContent = post.title;
            document.getElementById("post-info").textContent = `${post.nickname} • ${post.created_at}`;
            document.getElementById("post-content").innerText = post.content;
            document.getElementById("like-count").textContent = `${post.likes}개`;
            document.getElementById("comment-count").textContent = `${post.comment_count}개`;

            // 기본(백업) 데이터 세팅
            const albumEl = document.getElementById("album-cover");
            const titleEl = document.getElementById("song-title");
            const artistEl = document.getElementById("artist");
            const previewAudio = document.getElementById("preview-audio");
            const previewBtn = document.getElementById("preview-btn");
            const previewIcon = document.getElementById("preview-icon");
            const deezerLink = document.getElementById("deezer-link");

            titleEl.textContent = post.song_title || "";
            artistEl.textContent = post.artist || "";
            albumEl.src = post.album_cover_url || "https://placehold.co/150x150?text=No+Image";

            // 재생 준비(우선 DB 값으로)
            if (post.preview_url) {
                previewAudio.src = post.preview_url;
            }

            // ★ track_id가 있으면 서버 라우트 /api/track/<id>로 Deezer에서 최신 preview/커버 재조회
            if (post.track_id) {
                try {
                    const tRes = await fetch(`/api/track/${post.track_id}`);
                    const tJson = await tRes.json();
                    if (tJson.success && tJson.data) {
                        const t = tJson.data;
                        // Deezer 최신 데이터로 덮어쓰기 (있을 때만)
                        titleEl.textContent = t.title || titleEl.textContent;
                        artistEl.textContent = t.artist || artistEl.textContent;
                        if (t.album_cover) albumEl.src = t.album_cover;
                        if (t.preview_url) previewAudio.src = t.preview_url;

                        // Deezer 트랙 페이지 링크
                        if (deezerLink) {
                            deezerLink.href = `https://www.deezer.com/track/${post.track_id}`;
                            deezerLink.classList.remove("hidden");
                        }
                    } else {
                        // Deezer에서 못 가져오면 링크만 숨김
                        deezerLink && deezerLink.classList.add("hidden");
                    }
                } catch (e) {
                    console.error("Deezer 재조회 실패:", e);
                    deezerLink && deezerLink.classList.add("hidden");
                }
            } else {
                // track_id 없으면 Deezer 링크 숨김
                deezerLink && deezerLink.classList.add("hidden");
            }

            // 미리듣기 버튼 세팅
            if (previewBtn && previewAudio) {
                setupAudioPlayer(previewBtn, previewAudio, previewIcon);
            }

            // 곡 좋아요 버튼 연결
            const musicLikeBtn = document.getElementById("music-like-btn");
            if (musicLikeBtn) {
                musicLikeBtn.addEventListener("click", () => {
                    handleMusicLike({
                        id: post.track_id, // Deezer 트랙 id
                        title: titleEl.textContent.trim(),
                        artist: artistEl.textContent.trim(),
                        album_cover: albumEl.getAttribute("src"),
                        preview: previewAudio.src || "",
                    });
                });
            }

            // 게시글 좋아요/댓글
            renderComments(post.comments || []);
            setupLikeButton();
            setupCommentSubmit();
        })
        .catch((err) => {
            console.error("오류 발생:", err);
            alert("서버 통신 중 오류가 발생했습니다.");
        });
});

/* -----------------------------
   오디오 플레이어 설정
-------------------------------- */
function setupAudioPlayer(previewBtn, previewAudio, previewIcon) {
    // 버튼 클릭 → 토글
    previewBtn.addEventListener("click", async () => {
        await toggleAudio(previewAudio, previewIcon, previewBtn);
    });

    // 상태 이벤트들
    previewAudio.addEventListener("play", () => {
        isPlaying = true;
        setPlayIcon(previewIcon, true);
    });

    previewAudio.addEventListener("pause", () => {
        isPlaying = false;
        setPlayIcon(previewIcon, false);
    });

    previewAudio.addEventListener("ended", () => {
        isPlaying = false;
        setPlayIcon(previewIcon, false);
        currentPlayPromise = null;
    });

    previewAudio.addEventListener("error", (e) => {
        console.error("오디오 재생 오류:", e);
        isPlaying = false;
        setPlayIcon(previewIcon, false);
        currentPlayPromise = null;
        alert("음악을 재생할 수 없습니다. 네트워크 연결 또는 미리듣기 만료를 확인해주세요.");
    });
}

function setupAudioPlayer() {
    const previewBtn = document.getElementById("preview-btn");
    const audio = document.getElementById("preview-audio");
    const playIcon = previewBtn.querySelector(".play-icon");
    const pauseIcon = previewBtn.querySelector(".pause-icon");

    if (!previewBtn || !audio) return;

    let isPlaying = false;

    previewBtn.addEventListener("click", () => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    });

    // 오디오 재생 시
    audio.addEventListener("play", () => {
        isPlaying = true;
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
    });

    // 오디오 일시정지 시
    audio.addEventListener("pause", () => {
        isPlaying = false;
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
    });

    // 오디오 끝났을 때도 play 아이콘으로 복구
    audio.addEventListener("ended", () => {
        isPlaying = false;
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
    });
}
// ▶️/⏸ 아이콘 토글 (SVG 교체)
function setPlayIcon(previewIcon, playing) {
    if (playing) {
        previewIcon.outerHTML = `
      <svg id="preview-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
           viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h4v16H6zM14 4h4v16h-4z"/>
      </svg>
    `;
    } else {
        previewIcon.outerHTML = `
      <svg id="preview-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
           viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75z"/>
      </svg>
    `;
    }
}
/* -----------------------------
   곡 좋아요
-------------------------------- */
async function handleMusicLike(track) {
    const musicLikeBtn = document.getElementById("music-like-btn");
    const payload = {
        track_id: track.id,
        title: track.title,
        artist: track.artist,
        album_cover: track.album_cover,
        preview: track.preview,
    };

    try {
        const response = await fetch("/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (result.success) {
            musicLikeBtn.innerHTML = `
        <svg class="w-7 h-7 text-pink-500" xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343
                   l1.172-1.171a4 4 0 115.656 5.656L10 17.657
                   l-6.828-6.829a4 4 0 010-5.656z"
                clip-rule="evenodd" />
        </svg>`;
            musicLikeBtn.disabled = true;
        } else {
            alert(result.message || "좋아요 처리 실패");
            if (response.status === 409) {
                musicLikeBtn.innerHTML = `
          <svg class="w-7 h-7 text-pink-500" xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343
                     l1.172-1.171a4 4 0 115.656 5.656L10 17.657
                     l-6.828-6.829a4 4 0 010-5.656z"
                  clip-rule="evenodd" />
          </svg>`;
                musicLikeBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error("곡 좋아요 오류:", error);
        alert("좋아요 처리 중 오류가 발생했습니다.");
    }
}

// -----------------------------
// 댓글 렌더링
// -----------------------------
function renderComments(comments) {
    const commentList = document.getElementById("comment-list");
    commentList.innerHTML = "";
    comments.forEach(comment => {
        const div = document.createElement("div");
        div.className = "bg-gray-100 rounded p-3 mb-2";
        const formattedDate = comment.created_at.slice(0, 16);
        div.innerHTML = `
            <p class="text-sm text-gray-900">${comment.content}</p>
            <p class="text-xs text-gray-500">${comment.nickname} • ${formattedDate}</p>
        `;
        commentList.appendChild(div);
    });
}

// -----------------------------
// 게시글 좋아요 버튼
// -----------------------------
function setupLikeButton() {
    const likeBtn = document.getElementById("like-btn");
    if (!likeBtn || likeBtn.dataset.bound === "true") return;

    likeBtn.addEventListener("click", function () {
        fetch(`/api/post/${postId}/like`, { method: "POST" })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById("like-count").textContent = `${data.likes}개`;
                    likeBtn.disabled = true;
                } else {
                    if (data.message === "로그인이 필요합니다.") {
                        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
                        window.location.href = "/login";
                    } else {
                        alert("좋아요 처리 실패: " + data.message);
                    }
                }
            })
            .catch(err => {
                console.error("좋아요 오류:", err);
                alert("좋아요 요청 중 오류 발생");
            });
    });

    likeBtn.dataset.bound = "true";
}

// -----------------------------
// 댓글 등록
// -----------------------------
function setupCommentSubmit() {
    const submitBtn = document.getElementById("submit-comment");
    const input = document.getElementById("comment-input");

    if (!submitBtn || !input || submitBtn.dataset.bound === "true") return;

    submitBtn.addEventListener("click", function (e) {
        e.preventDefault();

        const commentContent = input.value.trim();
        if (!commentContent) return alert("댓글 내용을 입력해주세요.");

        const data = { comment: commentContent };

        fetch(`/api/post/${postId}/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const comment = data.comment;
                    const commentList = document.getElementById("comment-list");

                    // 댓글 DOM 추가
                    const div = document.createElement("div");
                    div.className = "bg-gray-100 rounded p-3 mb-2";
                    const formattedDate = comment.created_at.slice(0, 16);
                    div.innerHTML = `
                        <p class="text-sm text-gray-900">${comment.content}</p>
                        <p class="text-xs text-gray-500">${comment.nickname} • ${formattedDate}</p>
                    `;
                    commentList.prepend(div);

                    // 입력창 초기화
                    input.value = "";

                    // ✅ 댓글 개수 갱신
                    const countEl = document.getElementById("comment-count");
                    if (countEl) {
                        // API가 comment_count를 내려주면 그 값 사용
                        if (data.comment_count !== undefined) {
                            countEl.textContent = data.comment_count;
                        } else {
                            // 없으면 DOM에서 직접 +1
                            countEl.textContent = parseInt(countEl.textContent) + 1;
                        }
                    }
                } else {
                    if (data.message === "로그인이 필요합니다.") {
                        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
                        window.location.href = "/login";
                    } else {
                        alert("댓글 등록 실패: " + data.message);
                    }
                }
            })
            .catch(err => {
                console.error("댓글 등록 오류:", err);
                alert("댓글 등록 중 오류 발생");
            });
    });

    submitBtn.dataset.bound = "true";
}