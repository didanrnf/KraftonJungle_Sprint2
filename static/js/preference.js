$(document).ready(function () {
    const genres = {
        "Pop": ["Taylor Swift", "Ariana Grande", "Ed Sheeran"],
        "K-pop": ["BTS", "BLACKPINK", "aespa"],
        "Rock": ["Coldplay", "Queen", "Nirvana"],
        "Rap_Hip Hop": ["Drake", "Kendrick Lamar", "Changmo"],
        "Dance": ["Calvin Harris", "David Guetta", "Zedd"],
        "R&B": ["The Weeknd", "Usher", "Alicia Keys"],
        "Alternative": ["Radiohead", "딘", "Lucy"],
        "Electro": ["Daft Punk", "Deadmau5", "Skrillex"],
        "J-pop": ["Yonezu Kenshi", "Yorushika", "Vaundy"], //I love Yorushika
        "Jazz": ["Miles Davis", "John Coltrane", "Louis Armstrong"],
        "Asian Music": ["싸이", "G-Dragon", "아이유"],
        "Folk": ["Bob Dylan", "Joan Baez", "Simon & Garfunkel"],
        "Metal": ["Metallica", "Iron Maiden", "Slipknot"],
        "Soul & Funk": ["Aretha Franklin", "Stevie Wonder", "Marvin Gaye"],
        "Blues": ["B.B. King", "Muddy Waters", "Eric Clapton"],
        "Reggae": ["Bob Marley", "Peter Tosh", "Jimmy Cliff"],
        "Latin": ["Shakira", "Ricky Martin", "Enrique Iglesias"],
        "Country": ["Johnny Cash", "Dolly Parton", "Luke Bryan"]
    };

    const genreContainer = $("#genre-container");
    const artistContainer = $("#artist-container");

    const createCard = (type, name, imageUrl) => {
        return `
            <label class="relative rounded-lg cursor-pointer overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-300 aspect-square">
                <img src="${imageUrl}" alt="${name}" 
                     class="absolute w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                     onerror="this.parentElement.style.backgroundColor='#2d3748'; this.style.display='none';"> 
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                
                <div class="relative p-3 h-full flex flex-col justify-end">
                    <input type="checkbox" class="${type}-checkbox hidden peer" value="${name}">
                    <span class="text-white font-bold text-sm tracking-wide">${name}</span>
                    
                    <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center opacity-0 peer-checked:opacity-100 peer-checked:bg-indigo-500 peer-checked:border-indigo-400 transition-all duration-300">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                </div>
            </label>
        `;
    };

    // 장르 카드 생성
    Object.keys(genres).forEach(genre => {
        // 경로: /static/deezer_images/{장르명}/genre_image.jpg <-- 이 부분을 수정했습니다!
        const imageUrl = `/static/deezer_images/${encodeURIComponent(genre)}/genre_image.jpg`;
        genreContainer.append(createCard('genre', genre, imageUrl));
    });

    // 아티스트 카드 생성 (이 부분은 변경 없음)
    Object.keys(genres).forEach(genre => {
        const artists = genres[genre];
        artists.forEach(artist => {
            const imageUrl = `/static/deezer_images/${encodeURIComponent(genre)}/${encodeURIComponent(artist)}.jpg`;
            artistContainer.append(createCard('artist', artist, imageUrl));
        });
    });

    // 선택 제한 (장르 5개)
    $(document).on("change", ".genre-checkbox", function () {
        if ($(".genre-checkbox:checked").length > 5) {
            alert("장르는 최대 5개까지 선택 가능합니다.");
            this.checked = false;
        }
    });

    // 선택 제한 (아티스트 7개)
    $(document).on("change", ".artist-checkbox", function () {
        if ($(".artist-checkbox:checked").length > 7) {
            alert("아티스트는 최대 7명까지 선택 가능합니다.");
            this.checked = false;
        }
    });

    // 저장 버튼 클릭
    $("#save-preference").on("click", function () {
        const username = $(this).data("user");
        const selectedGenres = $(".genre-checkbox:checked").map(function () { return $(this).val(); }).get();
        const selectedArtists = $(".artist-checkbox:checked").map(function () { return $(this).val(); }).get();

        if (selectedGenres.length === 0 || selectedArtists.length === 0) {
            alert("장르와 아티스트를 최소 1개 이상 선택해주세요.");
            return;
        }

        $.ajax({
            url: "/api/preference",
            method: "POST",
            data: {
                username: username,
                "genres[]": selectedGenres,
                "artists[]": selectedArtists
            },
            traditional: true,
            success: function (res) {
                alert("취향이 성공적으로 저장되었습니다!");
                window.location.href = "/recommend";
            },
            error: function (error) {
                console.error("Error saving preferences:", error);
                alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        });
    });
});