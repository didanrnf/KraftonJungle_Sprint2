from flask import Blueprint, render_template, jsonify, session
import asyncio
from app.services.recommend_service import get_recommendations
from pymongo import MongoClient
from app.services.config import uri

client = MongoClient(uri, 27017)
db = client["sprint2"]  # 데이터베이스 이름
users_collection = db["users"]  # 컬렉션 이름


recommend_bp = Blueprint("recommend", __name__)


@recommend_bp.route("/recommend")
def show_recommend_page():
    user_id = session.get("user_id")

    if not user_id:
        return render_template("recommend.html", status="need_login")

    user = users_collection.find_one({"username": user_id})

    if not user or not user.get("genres") or not user.get("artists"):
        return render_template("recommend.html", status="need_preference")

    # 추천 로직은 따로 분기
    return render_template("recommend.html")


@recommend_bp.route("/api/recommend")
def api_recommend():
    user_id = session.get("user_id")
    recommendations_data = asyncio.run(get_recommendations(user_id))
    return jsonify(recommendations_data)
