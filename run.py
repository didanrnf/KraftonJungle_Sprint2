from flask import Flask, render_template
from app.routes.__init__ import blueprints
from datetime import timedelta
import os

app = Flask(__name__)


app.secret_key = os.urandom(24)  # 필수!
app.permanent_session_lifetime = timedelta(hours=2)  # 세션 만료 시간

for bp in blueprints:
    app.register_blueprint(bp)


@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    app.run("0.0.0.0", port=5000, debug=True)
