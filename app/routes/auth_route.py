# 로그인, 회원가입 시스템 루트
from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    jsonify,
    session,
)
from app.services.auth_service import *


auth_bp = Blueprint("login", __name__)


# 로그인 페이지를 보여주는 라우트
@auth_bp.route("/login")
def show_login():
    user_id = session.get("user_id")
    if not user_id:
        # 로그인 상태로 로그인 창들어가면 못들어가게 함
        return render_template("login.html")
    # 로그인 페이지 상태가 아니라면 로그인 창 출력
    return render_template("login.html", status="already_login")


# 회원가입 페이지를 보여주는 라우트
@auth_bp.route("/register")
def show_register():

    return render_template("register.html")


# 아이디 찾기 페이지를 보여주는 라우트
@auth_bp.route("/findid")
def show_findid():

    return render_template("findid.html")


@auth_bp.route("/logout")
def logout():
    session.clear()  # 세션 초기화
    return redirect(url_for("login.show_login"))  # 메인 페이지 등으로 이동


# 아이디 찾기 페이지 결과를 보여주는 라우트
@auth_bp.route("/findid-reuslt")
def show_findid_result():

    return render_template("findid-result.html")


# 비밀번호 찾기 페이지를 보여주는 라우트
@auth_bp.route("/findpw")
def show_findpw():

    return render_template("findpw.html")


# 비밀번호 찾기 페이지를 보여주는 라우트
@auth_bp.route("/changepw")
def show_changepw_page():
    user_id = session.get("user_id")
    if not user_id:
        # 로그인이 필요한 경우 → 로그인 페이지로 이동 또는 접근 제한 템플릿 제공
        return render_template("changepw.html", status="need_login")
        # 또는: return redirect(url_for("auth_bp.show_login"))  ← 로그인 페이지로 이동
    return render_template("changepw.html")


# 로그인 하기
@auth_bp.route("/api/login", methods=["POST"])
def loginSystem():
    username = request.form.get("username")
    password = request.form.get("password")

    return process_login(username, password)


# 아이디 찾기 라우트
@auth_bp.route("/api/findid", methods=["POST"])
def findidSystem():
    name = request.form.get("name")
    birth = request.form.get("birth")

    return find_user_id(name, birth)


# 비밀번호 변경 라우트
@auth_bp.route("/api/findpw", methods=["POST"])
def findpwSystem():
    global username2
    username2 = request.form.get("username")  # 아이디 두번 써야해서 변수명 다름
    name = request.form.get("name")
    birth = request.form.get("birth")

    return find_user_for_pw_change(username2, name, birth)


# 비밀번호 변경 라우트
@auth_bp.route("/api/changepw", methods=["POST"])
def changepwSystem():
    username = session.get("user_id")
    if not username:
        return jsonify({"success": False, "message": "로그인이 필요합니다."}), 401

    new_password = request.form.get("new_password")
    if not new_password and request.is_json:
        payload = request.get_json(silent=True) or {}
        new_password = payload.get("new_password")

    if not new_password:
        return jsonify({"success": False, "message": "새 비밀번호가 필요합니다."}), 400

    return change_user_password(username, new_password)


# 회원가입 처리 라우트
@auth_bp.route("/api/register", methods=["POST"])
def registerSystem():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        nickname = request.form["nickname"]
        name = request.form["name"]
        birth = request.form["birth"]

        return save_user_info(username, password, nickname, name, birth)
