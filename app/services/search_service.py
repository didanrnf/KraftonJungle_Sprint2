from flask import jsonify
import aiohttp

API_BASE_URL = "https://api.deezer.com/"


async def search_tracks_autocomplete(query):
    """
    Deezer API의 검색 기능을 사용하여 트랙 목록을 반환합니다.
    """

    if not query:
        return jsonify({"success": True, "data": []}), 200

    try:
        async with aiohttp.ClientSession() as session:
            url = f"{API_BASE_URL}search?q={query}"
            async with session.get(url) as response:
                response.raise_for_status()
                results = await response.json()

                print("Deezer 응답:", results)

                # ✅ 여기 수정됨
                tracks = results.get("data", [])

                formatted_tracks = [
                    {
                        "track_id": track.get("id"),
                        "title": track.get("title"),
                        "artist": track.get("artist", {}).get("name"),
                        "album_cover": track.get("album", {}).get("cover_medium"),
                    }
                    for track in tracks
                ]

                return jsonify({"success": True, "data": formatted_tracks}), 200

    except Exception as e:
        return (
            jsonify(
                {"success": False, "message": "음악 검색 중 오류 발생", "error": str(e)}
            ),
            500,
        )


# 사용자가 게시글을 올릴때 노래와 가수를 deezer api로 검색하고 앨범커버와 프리뷰 url을 가져옵니다.
async def deezer_check_music(title, artist):
    query = f"{title} {artist}"
    url = f"https://api.deezer.com/search?q={query}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.json()
            tracks = data.get("data", [])

            for track in tracks:
                if (
                    track["title"].lower() == title.lower()
                    and track["artist"]["name"].lower() == artist.lower()
                ):
                    return {
                        "title": track["title"],
                        "artist": track["artist"]["name"],
                        "album_cover": track["album"]["cover_medium"],
                        "preview": track["preview"],
                        "track_id": track["id"],
                    }
            return None


async def deezer_get_music_by_id(track_id):
    """
    Deezer API에서 트랙 ID로 곡 정보를 가져와 song_info 형식으로 반환합니다.
    """
    endpoint = f"track/{track_id}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(API_BASE_URL + endpoint) as response:
                response.raise_for_status()
                track_data = await response.json()

        if "error" in track_data or not track_data.get("title"):
            return None

        return {
            "track_id": track_data.get("id"),
            "title": track_data.get("title"),
            "artist": track_data.get("artist", {}).get("name"),
            "album_cover": track_data.get("album", {}).get("cover_medium"),
            "preview": track_data.get("preview"),
        }
    except aiohttp.ClientError as e:
        print(f"API 요청 오류: {endpoint} - {e}")
        return None
