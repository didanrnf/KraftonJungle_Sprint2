from flask import jsonify, session, request
from pymongo import MongoClient
from app.services.config import uri

client = MongoClient(uri, 27017)
db = client["sprint2"]  # 데이터베이스 이름
users_collection = db["users"]  # 컬렉션 이름


def insert_user_preference(username, genres, artist):
    print("서버로 받은 값들:")
    print("username:", username)
    print("genres:", genres)
    print("artist:", artist)

    try:
        if not username or not genres or not artist:
            return (
                jsonify({"success": False, "message": "필수 값이 누락되었습니다."}),
                400,
            )

        user = users_collection.find_one({"username": username})
        if not user:
            return (
                jsonify({"success": False, "message": "존재하지 않는 유저입니다."}),
                404,
            )

        # 기존 잘못된 필드 제거
        if isinstance(user.get("genres"), str):
            users_collection.update_one(
                {"username": username}, {"$unset": {"genres": ""}}
            )
        if isinstance(user.get("artists"), str):
            users_collection.update_one(
                {"username": username}, {"$unset": {"artists": ""}}
            )

        # 완전 덮어쓰기
        users_collection.update_one(
            {"username": username}, {"$set": {"genres": genres, "artists": artist}}
        )

        return jsonify({"success": True, "message": "유저 성향이 저장되었습니다."}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
