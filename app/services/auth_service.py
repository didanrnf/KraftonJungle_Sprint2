from flask import jsonify, session
from pymongo import MongoClient
from app.services.config import uri

client = MongoClient(uri, 27017)
db = client["sprint2"]  # 데이터베이스 이름
users_collection = db["users"]  # 컬렉션 이름


# db에 회원가입 정보 대입
def save_user_info(username, password, nickname, name, birth):
    if users_collection.find_one({"username": username}):
        return (
            jsonify({"success": False, "message": "이미 존재하는 아이디입니다."}),
            400,
        )
    user_doc = {
        "username": username,
        "password": password,
        "nickname": nickname,
        "name": name,
        "birth": birth,
        "like_music": [],
        "genres": [],
        "artists": [],
    }

    try:
        users_collection.insert_one(user_doc)
        return jsonify({"success": True, "message": "회원가입이 완료되었습니다."}), 200
    except Exception as e:
        return (
            jsonify({"success": False, "message": "회원가입 중 오류가 발생했습니다."}),
            500,
        )


# 로그인 처리 프로세스
def process_login(username, password):
    user = users_collection.find_one({"username": username})

    if user:
        if user["password"] == password:  ## 로그인 성공 → 세션 부여
            session["user_id"] = username
            session.permanent = True
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "로그인 성공",
                        "session_user": session.get("user_id"),
                    }
                ),
                200,
                print("세션에 저장된 사용자:", session.get("user_id")),
            )
        else:
            return (
                jsonify({"success": False, "message": "비밀번호가 일치하지 않습니다."}),
                401,
            )
    else:
        return (
            jsonify({"success": False, "message": "존재하지 않는 아이디입니다."}),
            404,
        )


# db에서 유저 정보 찾아서 아이디 반환
def find_user_id(name, birth):
    user = users_collection.find_one({"name": name, "birth": birth})
    if user:
        return jsonify({"success": True, "username": user["username"]}), 200
    else:
        return (
            jsonify(
                {"success": False, "message": "해당 정보로 가입된 아이디가 없습니다."}
            ),
            404,
        )


# db에서 유저 정보 찾아서 인증
def find_user_for_pw_change(username, name, birth):
    user = users_collection.find_one(
        {"username": username, "name": name, "birth": birth}
    )

    if not user:
        return (
            jsonify({"success": False, "message": "일치하는 회원 정보가 없습니다."}),
            404,
        )

    try:
        session["user_id"] = username
        session.permanent = True
        return jsonify({"success": True, "message": "계정 정보가 있습니다."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": "비밀번호 찾기 중 오류 발생"}), 500


# db에서 아이디 찾아서 비밀번호 변경
def change_user_password(username, new_password):
    user = users_collection.find_one({"username": username})

    if not user:
        return (
            jsonify({"success": False, "message": "일치하는 회원 정보가 없습니다."}),
            404,
        )

    try:
        result = users_collection.update_one(
            {"username": username}, {"$set": {"password": new_password}}
        )
        if result.modified_count == 1:
            session.clear()  # 세션 초기화
            return (
                jsonify({"success": True, "message": "비밀번호가 변경되었습니다."}),
                200,
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "같은 비밀번호로는 변경 할 수 없습니다.",
                    }
                ),
                400,
            )
    except Exception as e:
        return jsonify({"success": False, "message": "비밀번호 변경 중 오류 발생"}), 500
