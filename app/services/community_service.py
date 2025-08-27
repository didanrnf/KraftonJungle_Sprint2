from flask import jsonify
from pymongo import MongoClient, DESCENDING
from bson.objectid import ObjectId
from app.services.config import uri
import datetime
import math
from bson import ObjectId
from bson.errors import InvalidId
import pytz

client = MongoClient(uri, 27017)
db = client["sprint2"]
posts_collection = db["posts"]
users_collection = db["users"]


# 게시글 작성 (기존 코드 유지)
def create_post(username, title, song_info, content):
    try:
        user_doc = db.users.find_one({"username": username})
        nickname = user_doc.get("nickname", "알 수 없음") if user_doc else "알 수 없음"
        korea_timezone = pytz.timezone("Asia/Seoul")
        korean_time_now = datetime.datetime.now(korea_timezone)
        naive_korean_time = korean_time_now.replace(tzinfo=None)
        post_doc = {
            "username": username,
            "nickname": nickname,
            "title": title,
            "song_info": song_info,
            "content": content,
            "likes": 0,
            "created_at": naive_korean_time,
        }
        posts_collection.insert_one(post_doc)
        return (
            jsonify(
                {"success": True, "message": "게시글이 성공적으로 등록되었습니다."}
            ),
            201,
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "게시글 등록 중 오류가 발생했습니다.",
                    "error": str(e),
                }
            ),
            500,
        )


# 게시글 목록 조회 (기존 코드 유지)
def get_posts_paginated(page):
    try:
        limit = 10
        skip_count = (page - 1) * limit
        total_posts = posts_collection.count_documents({})
        total_pages = math.ceil(total_posts / limit)
        projection = {
            "_id": 1,
            "nickname": 1,
            "song_info": 1,
            "likes": 1,
            "created_at": 1,
            "content": 1,
            "title": 1,
            "comment_count": 1,
        }
        posts_cursor = (
            posts_collection.find({}, projection)
            .sort("created_at", DESCENDING)
            .skip(skip_count)
            .limit(limit)
        )
        posts_list = []
        for post in posts_cursor:
            post["_id"] = str(post["_id"])
            post["comment_count"] = post.get("comment_count", 0)
            created_at_db = post.get("created_at")
            if isinstance(created_at_db, datetime.datetime):
                post["created_at"] = created_at_db.strftime("%Y-%m-%d %H:%M")
            posts_list.append(post)
        result = {"posts": posts_list, "total_pages": total_pages, "current_page": page}
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "게시글을 불러오는 중 오류가 발생했습니다.",
                    "error": str(e),
                }
            ),
            500,
        )


# 취향 비슷한 사용자 게시글 조회 (최종 로직)
def get_posts_by_similar_taste(current_username, page):
    try:
        # 1. 현재 사용자의 취향 정보를 가져옵니다.
        current_user = users_collection.find_one({"username": current_username})
        if not current_user:
            return (
                jsonify(
                    {"success": False, "message": "사용자 정보를 찾을 수 없습니다."}
                ),
                404,
            )

        current_user_tastes = set(current_user.get("genres", [])) | set(
            current_user.get("artists", [])
        )

        # 2. posts 컬렉션에서 중복을 제거한 모든 작성자 목록을 가져옵니다.
        all_authors = posts_collection.distinct("username")

        similar_usernames = []
        # 3. 각 작성자들의 취향 정보를 확인합니다.
        for author_name in all_authors:
            if author_name == current_username:
                continue

            author_user = users_collection.find_one({"username": author_name})
            if not author_user:
                continue

            author_tastes = set(author_user.get("genres", [])) | set(
                author_user.get("artists", [])
            )

            # 4. 두 사용자의 '취향 보따리'가 얼마나 겹치는지 계산합니다.
            common_tastes_count = len(current_user_tastes.intersection(author_tastes))

            # 5. 공통 취향이 3개 이상이면 목록에 추가합니다.
            if common_tastes_count >= 3:
                similar_usernames.append(author_name)

        # 6. '취향이 비슷한 사람'들이 작성한 게시글을 최신순으로 조회합니다.
        limit = 10
        skip_count = (page - 1) * limit
        query = {"username": {"$in": similar_usernames}}

        total_posts = posts_collection.count_documents(query)
        total_pages = math.ceil(total_posts / limit)

        projection = {
            "_id": 1,
            "nickname": 1,
            "song_info": 1,
            "likes": 1,
            "created_at": 1,
            "content": 1,
            "title": 1,
            "comment_count": 1,
        }

        posts_cursor = (
            posts_collection.find(query, projection)
            .sort("created_at", DESCENDING)
            .skip(skip_count)
            .limit(limit)
        )

        posts_list = []
        for post in posts_cursor:
            post["_id"] = str(post["_id"])
            post["comment_count"] = post.get("comment_count", 0)
            created_at_db = post.get("created_at")
            if isinstance(created_at_db, datetime.datetime):
                post["created_at"] = created_at_db.strftime("%Y-%m-%d %H:%M")
            posts_list.append(post)

        result = {"posts": posts_list, "total_pages": total_pages, "current_page": page}
        return jsonify({"success": True, "data": result}), 200

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "게시글을 불러오는 중 오류가 발생했습니다.",
                    "error": str(e),
                }
            ),
            500,
        )


def get_post_by_id(post_id):
    try:
        object_id = ObjectId(post_id)
        post_data = posts_collection.find_one({"_id": object_id})
        if not post_data:
            return (
                jsonify({"success": False, "message": "게시글을 찾을 수 없습니다."}),
                404,
            )
        post_data["_id"] = str(post_data["_id"])
        if isinstance(post_data["created_at"], datetime.datetime):
            post_data["created_at"] = post_data["created_at"].strftime("%Y-%m-%d")
        return jsonify({"success": True, "data": post_data}), 200
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "게시글 상세 정보를 불러오는 중 오류가 발생했습니다.",
                    "error": str(e),
                }
            ),
            500,
        )


def call_post(post_id):
    try:
        obj_id = ObjectId(post_id)
    except InvalidId:
        return (
            jsonify({"success": False, "message": "유효하지 않은 게시글 ID입니다."}),
            400,
        )

    post = posts_collection.find_one({"_id": obj_id})
    if not post:
        return jsonify({"success": False, "message": "게시글을 찾을 수 없습니다."}), 404

    # 한국 시간 변환
    korea_timezone = pytz.timezone("Asia/Seoul")
    created_at = post.get("created_at", "")
    if isinstance(created_at, datetime.datetime):
        created_at = created_at.astimezone(korea_timezone).strftime("%Y-%m-%d %H:%M")
    else:
        created_at = str(created_at)

    song_info = post.get("song_info", {}) or {}
    comments = post.get("comments", []) or []

    post_data = {
        "id": str(post["_id"]),
        "title": post.get("title", ""),
        "content": post.get("content", ""),
        "nickname": post.get("nickname", ""),
        "created_at": created_at,
        "likes": post.get("likes", 0),
        # 곡 정보 (DB에 저장된 값들)
        "song_title": song_info.get("title", ""),
        "artist": song_info.get("artist", ""),
        "album_cover_url": song_info.get("album_cover", ""),
        "preview_url": song_info.get("preview", ""),
        # ★ 프론트가 Deezer API로 다시 조회할 때 필요한 키
        "track_id": song_info.get("track_id"),
        # (참고: Deezer 트랙 페이지 링크는 프론트에서 https://www.deezer.com/track/<track_id> 로 만들 수 있음)
        "comments": comments,
        "comment_count": post.get("comment_count", 0),
    }

    return jsonify({"success": True, "data": post_data}), 200


def increment_like(post_id, user_id):
    try:
        obj_id = ObjectId(post_id)
        post = posts_collection.find_one({"_id": obj_id})
        if not post:
            return (
                False,
                {"success": False, "message": "게시글을 찾을 수 없습니다."},
                404,
            )
        liked_users = post.get("liked_users", [])
        if user_id in liked_users:
            return (
                False,
                {"success": False, "message": "이미 좋아요를 누르셨습니다."},
                400,
            )
        posts_collection.update_one(
            {"_id": obj_id}, {"$inc": {"likes": 1}, "$push": {"liked_users": user_id}}
        )

        updated_post = posts_collection.find_one({"_id": obj_id})
        return True, {"success": True, "likes": updated_post.get("likes", 0)}, 200
    except Exception as e:
        return False, {"success": False, "message": "서버 오류", "error": str(e)}, 500


def insert_comment(username, post_id, comment_text):
    if not username:
        return False, {"success": False, "message": "로그인이 필요합니다."}, 401
    if not comment_text:
        return False, {"success": False, "message": "댓글 내용이 없습니다."}, 400
    user = users_collection.find_one({"username": username})
    if not user or not user.get("nickname"):
        return False, {"success": False, "message": "유저 정보가 없습니다."}, 400
    try:
        obj_id = ObjectId(post_id)
    except Exception:
        return (
            False,
            {"success": False, "message": "유효하지 않은 게시글 ID입니다."},
            400,
        )
    korea_timezone = pytz.timezone("Asia/Seoul")
    korean_time_now = datetime.datetime.now(korea_timezone)
    naive_korean_time = korean_time_now.replace(tzinfo=None)
    formatted_time = naive_korean_time.strftime("%Y-%m-%d %H:%M:%S")
    comment_data = {
        "user_id": username,
        "nickname": user["nickname"],
        "content": comment_text,
        "created_at": formatted_time,
    }
    result = posts_collection.update_one(
        {"_id": obj_id},
        {"$push": {"comments": comment_data}, "$inc": {"comment_count": 1}},
    )
    if result.modified_count == 0:
        return False, {"success": False, "message": "게시글을 찾을 수 없습니다."}, 404
    return (
        True,
        {"success": True, "message": "댓글 등록 완료", "comment": comment_data},
        200,
    )
