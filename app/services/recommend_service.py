from flask import session
import random
import asyncio
import aiohttp
from bson.objectid import ObjectId  # _id가 ObjectId 타입일 경우를 대비하여 임포트
from pymongo import MongoClient
from app.services.config import uri

client = MongoClient(uri, 27017)
db = client["sprint2"]  # 데이터베이스 이름
users_collection = db["users"]  # 컬렉션 이름


# Deezer API 기본 URL
API_BASE_URL = "https://api.deezer.com/"


async def get_data(session, endpoint):
    try:
        async with session.get(API_BASE_URL + endpoint) as response:
            response.raise_for_status()
            return await response.json()
    except aiohttp.ClientError as e:
        print(f"API 요청 오류: {endpoint} - {e}")
        return None


async def get_track_info_from_data(track_data):
    if not track_data or not isinstance(track_data, dict):
        return None
    return {
        "track_id": track_data.get("id"),
        "title": track_data.get("title"),
        "artist": track_data.get("artist", {}).get("name"),
        "album_cover": track_data.get("album", {}).get("cover_medium"),
        "preview": track_data.get("preview"),
    }


async def fetch_track_pool(session, endpoint, limit=40):
    """지정된 엔드포인트에서 추천 후보군(노래 목록)을 가져옵니다."""
    data = await get_data(session, f"{endpoint}?limit={limit}")
    if not data:
        return []

    # API 응답에서 실제 트랙 목록을 안전하게 추출
    track_list = data.get("data", [])
    if isinstance(data.get("tracks"), dict):
        track_list = data.get("tracks", {}).get("data", [])

    tasks = [get_track_info_from_data(track) for track in track_list]
    return [track for track in await asyncio.gather(*tasks) if track]


async def get_surprise_track(
    session, all_genres_data, excluded_genre_ids, used_track_ids, user_id=None
):
    # 1. 세션 user_id 기준으로 유저 조회
    preferred_artist_ids = []
    preferred_genre_ids = []

    if user_id:
        user = users_collection.find_one({"username": user_id})
        if user:
            preferred_artists = user.get("artists", [])
            preferred_genres = user.get("genres", [])

            # 장르명 → id 변환용 매핑
            genre_map = {
                g["name"].lower(): g["id"] for g in all_genres_data.get("data", [])
            }

            preferred_genre_ids = [
                genre_map.get(name.lower())
                for name in preferred_genres
                if name.lower() in genre_map
            ]

            # 아티스트 ID는 따로 API로 조회해야 함 (성능 이슈 시 생략 가능)
            artist_search_results = await asyncio.gather(
                *[
                    get_data(session, f"search/artist?q={name}")
                    for name in preferred_artists
                ]
            )
            preferred_artist_ids = [
                res["data"][0]["id"]
                for res in artist_search_results
                if res and res.get("data")
            ]

    # 2. 선호 정보 없으면 추천 안 함
    if not preferred_artist_ids and not preferred_genre_ids:
        print("깜짝 추천 제외됨: 선호 장르/아티스트 없음")
        return None

    # 3. 추천 가능한 장르 중에서 무작위로 시도
    candidate_genres = [
        g
        for g in all_genres_data.get("data", [])
        if g.get("id") not in excluded_genre_ids and g.get("name", "").lower() != "all"
    ]
    random.shuffle(candidate_genres)

    for genre in candidate_genres:
        genre_id = genre["id"]
        genre_name = genre["name"]

        track_pool = await fetch_track_pool(session, f"chart/{genre_id}/tracks")

        if track_pool:
            random.shuffle(track_pool)
            for track in track_pool:
                if track and track.get("track_id") not in used_track_ids:
                    track["surprise_genre"] = genre_name
                    return track

    print("경고: 모든 장르를 탐색했으나 유효한 곡을 찾지 못했습니다.")
    return None


async def get_recommendations(user_id=None):
    if user_id:
        user = users_collection.find_one({"username": user_id})
        preferred_artists_names = user.get("artists", []) if user else []
        preferred_genres_names = user.get("genres", []) if user else []
    else:
        preferred_artists_names = []
        preferred_genres_names = []

    async with aiohttp.ClientSession() as session:
        # 1. 추천에 필요한 모든 데이터를 동시에 가져오기
        all_genres_task = get_data(session, "genre")
        artist_id_tasks = [
            get_data(session, f"search/artist?q={name}")
            for name in preferred_artists_names
        ]
        all_genres_data, *artist_search_results = await asyncio.gather(
            all_genres_task, *artist_id_tasks
        )

        genre_map = (
            {g["name"].lower(): g["id"] for g in all_genres_data.get("data", [])}
            if all_genres_data
            else {}
        )
        preferred_artist_ids = [
            res["data"][0]["id"]
            for res in artist_search_results
            if res and res.get("data")
        ]
        preferred_genre_ids = [
            genre_map.get(name.lower())
            for name in preferred_genres_names
            if name.lower() in genre_map
        ]

        # 관련 아티스트 목록 확장
        related_artist_ids = set()
        if preferred_artist_ids:
            # 너무 많은 요청을 피하기 위해 최대 2명의 아티스트만 사용
            sample_artist_ids = random.sample(
                preferred_artist_ids, min(len(preferred_artist_ids), 2)
            )
            related_tasks = [
                get_data(session, f"artist/{aid}/related") for aid in sample_artist_ids
            ]
            for res in await asyncio.gather(*related_tasks):
                if res and res.get("data"):
                    related_artist_ids.update(artist["id"] for artist in res["data"])

        # 2. 모든 후보곡 목록을 병렬로 가져오기
        artist_tasks = [
            fetch_track_pool(session, f"artist/{aid}/top")
            for aid in preferred_artist_ids
        ]
        related_artist_tasks = [
            fetch_track_pool(session, f"artist/{aid}/top") for aid in related_artist_ids
        ]
        genre_tasks = [
            fetch_track_pool(session, f"genre/{gid}/radio")
            for gid in preferred_genre_ids
        ]

        # 모든 결과를 하나의 리스트로 통합
        all_pools = await asyncio.gather(
            *artist_tasks, *related_artist_tasks, *genre_tasks
        )
        full_pool = [track for pool in all_pools for track in pool]

        # 3. 중복을 제거하고 무작위로 섞어 최종 추천곡 선택
        unique_tracks = {
            track["track_id"]: track for track in full_pool if track
        }.values()
        shuffled_pool = list(unique_tracks)
        random.shuffle(shuffled_pool)

        main_tracks = []
        used_artists = set()

        for track in shuffled_pool:
            if len(main_tracks) >= 4:
                break

            artist_name = track.get("artist")
            if artist_name and artist_name not in used_artists:
                main_tracks.append(track)
                used_artists.add(artist_name)

        # 만약 아티스트 중복 방지로 4곡을 못 채웠다면, 남은 곡으로 채우기
        if len(main_tracks) < 4:
            used_track_ids = {track["track_id"] for track in main_tracks}
            for track in shuffled_pool:
                if len(main_tracks) >= 4:
                    break
                if track.get("track_id") not in used_track_ids:
                    main_tracks.append(track)

        used_track_ids = {track["track_id"] for track in main_tracks}

        # 4. 깜짝 추천곡 가져오기
        surprise_track = await get_surprise_track(
            session,
            all_genres_data,
            set(filter(None, preferred_genre_ids)),
            used_track_ids,
            user_id=user_id,  # 세션 기반으로 직접 전달
        )

        return {"main_tracks": main_tracks, "surprise_track": surprise_track}
