from flask import Blueprint, render_template, session

write_bp = Blueprint("write", __name__)


# 글쓰기 라우트
@write_bp.route("/write")
def show_write():
    user_id = session.get("user_id")
    if not user_id:
        # 로그인 안한 상태로 글쓰기 창 진입 불가
        return render_template("write.html", status="need_login")
    # 로그인 한 상태면 글쓰기 가능
    return render_template("write.html")
