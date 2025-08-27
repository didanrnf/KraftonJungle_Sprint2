from flask import (
    Blueprint,
    render_template,
    session,
    redirect,
    url_for,
    flash,
    json,
    jsonify,
    request,
)
from app.services.profile_service import (
    get_user_profile,
    add_liked_song,
    remove_liked_song,
    db_change_name,
    db_change_birth,
    db_change_nickname,
)
from datetime import datetime

profile_bp = Blueprint("profile", __name__)


# 기본 프로필 정보
@profile_bp.route("/profile")
def profile():
    """
    프로필 페이지를 렌더링합니다.
    """
    user_id = session.get("user_id")
    if not user_id:
        return render_template("profile.html", status="need_login")

    current_username = session["user_id"]
    response, status_code = get_user_profile(current_username)

    if status_code == 200:
        profile_data = json.loads(response.data).get("data")
        profile_data["posts"] = profile_data.get("authoredPosts", [])
        profile_data["total_pages"] = 0
        profile_data["current_page"] = 1
        return render_template("profile.html", data=profile_data)
    else:
        error_message = json.loads(response.data).get(
            "message", "알 수 없는 오류가 발생했습니다."
        )
        flash(error_message)
        return redirect(url_for("main.home"))


# 추천에서 좋아요
@profile_bp.route("/profile/like-song", methods=["POST"])
def like_song():
    """
    사용자가 '좋아요'를 누른 노래를 DB에 추가합니다.
    """
    if "user_id" not in session:
        return jsonify({"success": False, "message": "로그인이 필요합니다."}), 401

    username = session["user_id"]
    song_data = request.json

    if not song_data:
        return jsonify({"success": False, "message": "노래 정보가 없습니다."}), 400

    response, status_code = add_liked_song(username, song_data)
    return response, status_code


# 좋아요 취소
@profile_bp.route("/profile/unlike-song", methods=["POST"])
def unlike_song():
    """
    사용자의 '좋아요' 목록에서 노래를 삭제합니다.
    """
    if "user_id" not in session:
        return jsonify({"success": False, "message": "로그인이 필요합니다."}), 401

    username = session["user_id"]
    data = request.json
    track_id = data.get("track_id")

    if not track_id:
        return jsonify({"success": False, "message": "track_id가 필요합니다."}), 400

    response, status_code = remove_liked_song(username, track_id)
    return response, status_code


# 프로필 이름 수정
@profile_bp.route("/api/profile/change-name", methods=["POST"])
def change_name():
    try:
        username = session.get("user_id")

        if not username:
            return jsonify({"error": "로그인이 필요한 서비스입니다."}), 400

        data = request.json
        if not data or "name" not in data:
            return jsonify({"error": "이름 정보를 찾을 수 없습니다."}), 400

        new_name = data.get("name")
        if not new_name:
            return jsonify({"error": "새로운 이름을 입력해주세요."}), 400

        # db_change_name 함수를 호출하고 결과를 확인합니다.
        if db_change_name(username, new_name):
            return jsonify({"message": "이름이 성공적으로 변경되었습니다."}), 200
        else:
            return jsonify({"error": "이름 변경에 실패했습니다."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 프로필 닉네임 수정
@profile_bp.route("/api/profile/change-nickname", methods=["POST"])
def change_nickname():
    try:
        username = session.get("user_id")

        data = request.json
        if not data or "nickname" not in data:
            return jsonify({"error": "닉네임 정보를 찾을 수 없습니다."}), 400

        new_nickname = data.get("nickname")
        if not new_nickname:
            return jsonify({"error": "새로운 닉네임을 입력해주세요."}), 400

        # db_change_nickname 함수를 호출하고 결과를 확인합니다.
        if db_change_nickname(username, new_nickname):
            return jsonify({"message": "닉네임이 성공적으로 변경되었습니다."}), 200
        else:
            return jsonify({"error": "닉네임 변경에 실패했습니다."}), 500

    except Exception as e:
        return jsonify({"error": f"서버 에러가 발생했습니다: {str(e)}"}), 500


# 프로필 생일 수정
@profile_bp.route("/api/profile/change-birth", methods=["POST"])
def change_birth():
    try:
        username = session.get("user_id")

        if not username:
            return jsonify({"error": "로그인이 필요한 서비스입니다."}), 400

        data = request.json
        new_birth_str = data.get("birth")

        if not new_birth_str:
            return jsonify({"error": "생년월일을 입력해주세요."}), 400

        # 날짜 형식 'YYYY-MM-DD'를 확인하고 유효성만 검사합니다.
        try:
            datetime.strptime(new_birth_str, "%Y-%m-%d")
        except ValueError:
            return (
                jsonify({"error": "유효한 생년월일 형식이 아닙니다. (YYYY-MM-DD)"}),
                400,
            )

        # db_change_birth 함수를 호출할 때, 문자열을 그대로 전달합니다.
        if db_change_birth(username, new_birth_str):
            return jsonify({"message": "생년월일이 성공적으로 변경되었습니다."}), 200
        else:
            return jsonify({"error": "생년월일 변경에 실패했습니다."}), 500

    except Exception as e:
        return jsonify({"error": f"서버 에러가 발생했습니다: {str(e)}"}), 500
