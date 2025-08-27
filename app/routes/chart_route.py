from flask import Blueprint, render_template, session, request
from app.services.chart_service import get_popular_songs, get_today_popular_posts
from app.services.profile_service import users_collection, add_liked_song

chart_bp = Blueprint('chart', __name__)

@chart_bp.route('/chart')
def chart_page():
    # 인기곡 목록과 인기 게시글 목록을 모두 가져옵니다.
    popular_songs = get_popular_songs()
    daily_posts = get_today_popular_posts()
    
    # 로그인 상태일 경우, '좋아요' 누른 곡인지 확인하는 로직
    if 'user_id' in session:
        user_data = users_collection.find_one({"username": session['user_id']})
        liked_track_ids = set()
        if user_data and 'like_music' in user_data:
            liked_track_ids = {song.get('track_id') for song in user_data['like_music']}

        for song in popular_songs:
            song['is_liked'] = song.get('id') in liked_track_ids
    
    # 두 데이터를 모두 템플릿으로 전달합니다.
    return render_template(
        'chart.html',
        popular_songs=popular_songs,
        daily_posts=daily_posts
    )

# '/like' API 경로는 그대로 유지합니다.
@chart_bp.route('/like', methods=['POST'])
def like_song_from_chart():
    if 'user_id' not in session:
        return {"success": False, "message": "로그인이 필요합니다."}, 401
    
    username = session['user_id']
    song_data = request.json
    
    response, status_code = add_liked_song(username, song_data)
    return response, status_code