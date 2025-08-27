import React, { useState, useEffect } from 'react';
import './chart.css';
import { mockSongs, mockPosts } from './db'; // 샘플 데이터베이스 파일 import

// 오늘 날짜를 'YYYY-MM-DD' 형식으로 가져오는 함수
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Chart = () => {
    const [popularSongs, setPopularSongs] = useState([]);
    const [todayPopularPosts, setTodayPopularPosts] = useState([]);

    useEffect(() => {
        // --- 좌측 인기 차트 데이터 로드 ---
        const top5Songs = mockSongs.slice(0, 5).map(song => ({ ...song, isLiked: false }));
        setPopularSongs(top5Songs);

        // --- 우측 오늘의 인기글 데이터 로드 ---
        const today = getTodayDate();
        const todayPosts = mockPosts.filter(post => post.created_at === today);
        const sortedPosts = todayPosts.sort((a, b) => b.likes - a.likes);
        const top5Posts = sortedPosts.slice(0, 5);
        setTodayPopularPosts(top5Posts);
    }, []);

    // 좋아요 버튼 클릭 핸들러
    const handleLikeClick = async (id) => {
        // 실제 API 호출 로직 (mockup)
        try {
            // 이 부분을 실제 서버 API 호출로 교체하세요.
            const response = await fetch('/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track_id: id })
            });
            const result = await response.json();

            if (result.success) {
                // UI 상태 업데이트
                setPopularSongs(prevSongs =>
                    prevSongs.map(song =>
                        song.id === id ? { ...song, isLiked: !song.isLiked } : song
                    )
                );
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Like Error:', error);
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="music-chart-container">
            {/* 좌측: 실시간 인기 차트 */}
            <div className="chart-section">
                <h2>실시간 인기 차트</h2>
                <p>지금 가장 많이 듣는 음악</p>
                <ul className="chart-list">
                    {popularSongs.map((song, index) => (
                        <li key={song.id} className="chart-item">
                            <span className="rank">{index + 1}</span>
                            <img src={song.albumArt} alt={song.title} className="album-art" />
                            <div className="song-info">
                                <span className="title">{song.title}</span>
                                <span className="artist">{song.artist}</span>
                            </div>
                            <div className="actions">
                                <button
                                    className="like-btn text-pink-500"
                                    title="좋아요"
                                    onClick={() => handleLikeClick(song.id)}
                                >
                                    {song.isLiked ? (
                                        <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                        </svg>
                                    )}
                                </button>
                                <button className="share-btn" title="공유">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                    </svg>
                                </button>
                                <button className="play-btn">▶</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 우측: 오늘의 인기글 */}
            <div className="chart-section">
                <h2>오늘의 인기글</h2>
                <p>오늘 가장 사랑받은 음악글</p>
                <ul className="chart-list">
                    {todayPopularPosts.map((post, index) => (
                        <li key={post.id} className="chart-item">
                            <span className="rank">{index + 1}</span>
                            <img src={post.albumArt} alt={post.songTitle} className="album-art" />
                            <div className="song-info">
                                <span className="title">{post.songTitle}</span>
                                <span className="artist">{post.artist}</span>
                            </div>
                            <div className="actions">
                                <button className="like-btn" title="좋아요" onClick={() => alert('인기글 좋아요 기능은 현재 비활성화되어 있습니다.')}>
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                </button>
                                <button className="share-btn" title="공유">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                    </svg>
                                </button>
                                <button className="play-btn">▶</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Chart;