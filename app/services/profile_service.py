from flask import jsonify
from pymongo import MongoClient
from app.services.config import uri
from collections import Counter
from datetime import datetime, date

client = MongoClient(uri, 27017)
db = client["sprint2"]
users_collection = db["users"]
posts_collection = db["posts"]


# id를 기준으로 DB에서 유저 정보 따오기
def get_user_profile(username):
    """
    세션의 username을 기반으로 사용자의 프로필 정보를 DB에서 조회합니다.
    """
    try:
        user_data = users_collection.find_one(
            {"username": username}, {"password": 0, "_id": 0}
        )

        if not user_data:
            return (
                jsonify(
                    {"success": False, "message": "사용자 정보를 찾을 수 없습니다."}
                ),
                404,
            )

        user_posts = list(posts_collection.find({"username": username}))
        for post in user_posts:
            post["_id"] = str(post["_id"])

        profile_data = {
            "userInfo": {
                "name": user_data.get("name"),
                "nickname": user_data.get("nickname"),
                "birth": user_data.get("birth"),
            },
            "likedSongs": user_data.get("like_music", []),
            "authoredPosts": user_posts,
        }

        return jsonify({"success": True, "data": profile_data}), 200

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "프로필 정보를 가져오는 중 오류가 발생했습니다.",
                    "error": str(e),
                }
            ),
            500,
        )


# 좋아요 누른 곡을 DB에 추가하는 함수
def add_liked_song(username, song_data):
    """
    사용자의 'like_music' 배열에 노래 추가 + 아티스트 선호도 업데이트
    """
    try:
        # 1. 중복 확인 (같은 track_id가 이미 있는지)
        user = users_collection.find_one(
            {"username": username, "like_music.track_id": song_data.get("track_id")}
        )
        if user:
            return (
                jsonify({"success": False, "message": "이미 좋아요한 노래입니다."}),
                409,
            )

        # 2. 새 노래 정보 준비
        new_song = {
            "track_id": song_data.get("track_id"),
            "title": song_data.get("title"),
            "artist_name": song_data.get("artist"),  # 프론트에서 보낸 "artist" 키
            "album_cover": song_data.get("album_cover"),
            "preview": song_data.get("preview"),
        }

        # 3. like_music에 추가
        result = users_collection.update_one(
            {"username": username}, {"$push": {"like_music": new_song}}
        )

        if result.matched_count == 0:
            return (
                jsonify({"success": False, "message": "사용자를 찾을 수 없습니다."}),
                404,
            )

        # 4. 아티스트 카운트 업데이트
        user = users_collection.find_one({"username": username})
        liked_songs = user.get("like_music", [])

        # 아티스트 등장 횟수 세기
        artist_counts = Counter([song["artist_name"] for song in liked_songs])

        # 좋아요 3회 이상인 아티스트 목록
        preferred_artists = [
            artist for artist, count in artist_counts.items() if count >= 3
        ]

        # DB 업데이트 (중복 없이만 추가)
        users_collection.update_one(
            {"username": username},
            {"$addToSet": {"artists": {"$each": preferred_artists}}},
        )

        return (
            jsonify({"success": True, "message": "좋아요 목록에 추가 되었습니다."}),
            200,
        )

    except Exception as e:
        return jsonify({"success": False, "message": "오류 발생", "error": str(e)}), 500


# 좋아요 취소 함수
def remove_liked_song(username, track_id):
    """
    사용자의 'like_music' 배열에서 특정 track_id를 가진 노래를 제거합니다.
    """
    try:
        # 1. track_id를 정수형으로 변환 시도
        try:
            track_id_as_int = int(track_id)
            # 성공하면 정수와 문자열로 모두 검색
            query = {"$or": [{"track_id": track_id_as_int}, {"track_id": track_id}]}
        except (ValueError, TypeError):
            # 변환 실패 시, 문자열로만 검색
            query = {"track_id": track_id}

        # MongoDB의 $pull 연산자를 사용하여 노래를 제거합니다.
        result = users_collection.update_one(
            {"username": username},
            {"$pull": {"like_music": query}},
        )

        if result.matched_count == 0:
            return (
                jsonify({"success": False, "message": "사용자를 찾을 수 없습니다."}),
                404,
            )

        if result.modified_count == 0:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "해당 곡을 좋아요 목록에서 찾을 수 없습니다.",
                    }
                ),
                404,
            )

        return jsonify({"success": True, "message": "좋아요가 취소되었습니다."}), 200

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "좋아요 취소 중 오류가 발생했습니다.",
                    "error": str(e),
                }
            ),
            500,
        )


# db에서 이름 수정
def db_change_name(username, new_name):
    try:
        result = users_collection.update_one(
            {"username": username}, {"$set": {"name": new_name}}
        )
        return result.modified_count == 1
    except Exception as e:
        print(f"이름 변경 중 에러 발생: {e}")
        return False


# db에서 닉네임 수정
def db_change_nickname(username, new_nickname):
    try:
        result = users_collection.update_one(
            {"username": username}, {"$set": {"nickname": new_nickname}}
        )

        # modified_count가 1이면 성공적으로 업데이트된 것
        return result.modified_count == 1
    except Exception as e:
        print(f"닉네임 변경 중 에러 발생: {e}")
        return False


# db에서 생일 변경
def db_change_birth(username, new_birth_str):
    try:
        # 클라이언트에서 받은 문자열 형식을 검증합니다.
        # datetime 객체로 변환하지 않고 유효성만 확인합니다.
        datetime.strptime(new_birth_str, "%Y-%m-%d")

        # MongoDB 업데이트
        result = users_collection.update_one(
            {"username": username},
            # new_birth_str을 그대로 String 타입으로 저장합니다.
            {"$set": {"birth": new_birth_str}},
        )

        print(f"MongoDB 업데이트 결과: modified_count={result.modified_count}")

        return result.modified_count == 1
    except ValueError as e:
        print(f"ValueError: 날짜 변환 실패 - {e}")
        return False
    except Exception as e:
        print(f"일반 에러: {e}")
        return False