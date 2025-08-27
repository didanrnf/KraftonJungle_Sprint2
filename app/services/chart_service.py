# services/chart_service.py

import requests
from pymongo import MongoClient, DESCENDING
from datetime import datetime, timedelta
from app.services.config import uri 

client = MongoClient(uri, 27017)
db = client["sprint2"]
posts_collection = db["posts"]

def get_popular_songs():
    """Deezer API에서 실시간 글로벌 TOP 5 트랙 차트 데이터를 가져옵니다."""
    try:
        url = "https://api.deezer.com/chart/0/tracks"
        response = requests.get(url, timeout=10)
        response.raise_for_status() 
        data = response.json().get('data', [])
        
        songs = []
        # 상위 5곡만 가져오도록 수정
        for item in data[:10]:
            song = {
                'id': item.get('id'),
                'title': item.get('title_short'),
                'artist': item['artist'].get('name'),
                'album_art': item['album'].get('cover_medium'),
                'rank': item.get('rank'),
                'preview_url': item.get('preview')
            }
            songs.append(song)
        return songs
    except requests.exceptions.RequestException as e:
        print(f"Deezer API 요청 실패: {e}")
        return []
    except Exception as e:
        print(f"데이터 처리 중 오류 발생: {e}")
        return []

def get_today_popular_posts():
    """오늘 작성된 게시물 중 '좋아요' 상위 10개를 가져옵니다."""
    try:
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)

        pipeline = [
            {'$match': {'created_at': {'$gte': today_start, '$lt': tomorrow_start}}},
            {'$sort': {'likes': DESCENDING}},
            {'$limit': 10}
        ]
        
        popular_posts = list(posts_collection.aggregate(pipeline))
        
        for post in popular_posts:
            post['_id'] = str(post['_id'])
            
        return popular_posts
    except Exception as e:
        print(f"MongoDB 인기 게시글 조회 실패: {e}")
        return []