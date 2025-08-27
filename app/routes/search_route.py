# routes/search_route.py (최종 수정본)

from flask import Blueprint, request, render_template, jsonify

# import asyncio # 더 이상 필요 없으므로 삭제
import requests

# from app.services.search_service import search_tracks_autocomplete # 더 이상 필요 없으므로 삭제

search_bp = Blueprint("search", __name__)


# 검색 페이지를 렌더링하는 함수 (유지)
@search_bp.route("/search")
def search_page():
    track_id = request.args.get("track_id")
    return render_template("search.html", track_id=track_id)


# Deezer API를 이용하는 올바른 음악 검색 API 함수만 남김
@search_bp.route("/api/search-music")
def search_music_api():
    query = request.args.get("q", "")
    if not query:
        return jsonify({"success": False, "message": "검색어가 없습니다."}), 400

    try:
        url = f"https://api.deezer.com/search?q={query}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json().get("data", [])

        results = []
        for track in data:
            results.append(
                {
                    "id": track.get("id"),
                    "title": track.get("title_short"),
                    "artist": track.get("artist", {}).get("name"),
                    "album_cover": track.get("album", {}).get("cover_medium"),
                    "preview_url": track.get("preview"),
                }
            )

        return jsonify({"success": True, "data": results})
    except requests.exceptions.RequestException as e:
        return (
            jsonify({"success": False, "message": "API 요청 실패", "error": str(e)}),
            500,
        )


@search_bp.route("/api/track/<track_id>")
def get_track(track_id):
    try:
        url = f"https://api.deezer.com/track/{track_id}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if "error" in data:
            return (
                jsonify({"success": False, "message": "트랙을 찾을 수 없습니다."}),
                404,
            )

        track_info = {
            "id": data.get("id"),
            "title": data.get("title_short"),
            "artist": data.get("artist", {}).get("name"),
            "album_cover": data.get("album", {}).get("cover_medium"),
            "preview_url": data.get("preview"),
        }

        return jsonify({"success": True, "data": track_info})
    except requests.exceptions.RequestException as e:
        return (
            jsonify({"success": False, "message": "API 요청 실패", "error": str(e)}),
            500,
        )
