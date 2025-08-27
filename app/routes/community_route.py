from flask import (
    Blueprint,
    render_template,
    request,
    session,
    redirect,
    url_for,
    flash,
    json,
    jsonify,
)
from app.services.community_service import (
    create_post,
    get_posts_paginated,
    get_post_by_id,
    get_posts_by_similar_taste,
)
import asyncio
from app.services.search_service import deezer_check_music
from app.services.community_service import call_post, increment_like, insert_comment

community_bp = Blueprint("community", __name__)


@community_bp.route("/community", methods=["GET", "POST"])
def community_page():
    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
            username = session.get("user_id")
            title = data.get("title")
            content = data.get("content")
            music_data = data.get("music", {})
            song_title = (music_data.get("title") or "").strip()
            artist_name = (music_data.get("artist") or "").strip()

            # Try Deezer search first
            song_info = asyncio.run(deezer_check_music(song_title, artist_name))

            # Fallback to client-provided data if Deezer returns nothing
            if not song_info:
                song_info = {
                    "title": song_title,
                    "artist": artist_name,
                    "album_cover": music_data.get("album_cover", ""),
                    "preview": music_data.get("preview", ""),
                    "track_id": music_data.get("track_id"),
                }

            response, status_code = create_post(username, title, song_info, content)
            return response, status_code
        return redirect(url_for("community.community_page"))

    # GET flow unchanged (placeholder — keep your existing code below)
    page = request.args.get("page", 1, type=int)
    sort_by = request.args.get("sort", "latest")
    user_id = session.get("user_id")
    if sort_by == "similar":
        if not user_id:
            return render_template("community.html", status="need_login")
        response, status_code = get_posts_by_similar_taste(user_id, page)
    else:
        response, status_code = get_posts_paginated(page)
    if status_code == 200:
        community_data = json.loads(response.data).get("data")
        return render_template("community.html", data=community_data, sort_by=sort_by)
    else:
        error_message = json.loads(response.data).get(
            "message", "게시글을 불러오는 중 오류가 발생했습니다."
        )
        flash(error_message)
        return render_template("community.html", data=None, sort_by=sort_by)


# (이하 기존 코드는 그대로 유지)
@community_bp.route("/post/<post_id>")
def post_detail(post_id):
    response, status_code = get_post_by_id(post_id)
    if status_code == 200:
        post_data = json.loads(response.data)
        return render_template("post.html", post=post_data)
    else:
        flash(json.loads(response.data).get("message"))
        return redirect(url_for("community.community_page"))


@community_bp.route("/api/post/<post_id>")
def api_post_detail(post_id):
    try:
        return call_post(post_id)
    except Exception as e:
        return (
            jsonify({"success": False, "message": "서버 오류 발생", "error": str(e)}),
            500,
        )


@community_bp.route("/api/post/<post_id>/like", methods=["POST"])
def like_post(post_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "로그인이 필요합니다."}), 401
    _, response_json, status = increment_like(post_id, user_id)
    return jsonify(response_json), status


@community_bp.route("/api/post/<post_id>/comment", methods=["POST"])
def add_comment(post_id):
    # ▼▼▼ [수정] 세션에서 'user_id'를 사용하여 username 가져오기 ▼▼▼
    username = session.get("user_id")
    # ▲▲▲ [수정] ▲▲▲
    data = request.get_json()
    comment_text = data.get("comment")
    if not comment_text:
        return jsonify({"success": False, "message": "댓글 내용이 없습니다."}), 400
    success, response_json, status = insert_comment(username, post_id, comment_text)
    return jsonify(response_json), status
