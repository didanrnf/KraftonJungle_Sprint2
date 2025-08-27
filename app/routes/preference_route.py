from flask import Blueprint, render_template, jsonify
from app.services.preference_service import *

preference_bp = Blueprint("preference", __name__)


@preference_bp.route("/preference")
def show_preference():
    user_id = session.get("user_id")
    if not user_id:
        # 로그인 상태로 로그인 창들어가면 못들어가게 함
        return render_template("preference.html", status="need_login")
    # 로그인 페이지 상태가 아니라면 로그인 창 출력
    return render_template("preference.html")


@preference_bp.route("/api/preference", methods=["POST"])
def api_preference():

    username = request.form.get("username")  # 프론트에서 보내주는 값
    genres = request.form.getlist("genres[]")
    artists = request.form.getlist("artists[]")

    return insert_user_preference(username, genres, artists)
