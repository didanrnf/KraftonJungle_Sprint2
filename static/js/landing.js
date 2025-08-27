// 네온 트레일 및 음표 애니메이션 효과
(() => {
    const canvas = document.getElementById('neonTrail');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    // 접근성/성능 보호
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // if (isTouch || reduceMotion) { canvas.style.display = 'none'; return; }

    // DPR 세팅
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    function resize() {
        const w = window.innerWidth, h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // 합성 모드: 네온 겹칠 때 밝아지도록
    ctx.globalCompositeOperation = 'lighter';

    // ===== 파라미터 =====
    const HUE = 230;                 // 색깔
    const HUE_JITTER = 5;
    const LIFE_MS = 420;
    const SPAWN_HZ = 120;
    const SIZE_MIN = 3;              // 가로 반경(half-width)
    const SIZE_MAX = 6;
    const ASPECT = 1.8;         
    const ROT_BASE = 0;            
    const ROT_JITTER = 2 * Math.PI / 180; // 살짝만 흔들림
    const SHADOW_BLUR = 10;
    const MAX_PARTICLES = 260;
    const FOLLOW_LERP = 0.5;

    // 상태
    const particles = [];
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let fx = mouseX, fy = mouseY;   // follower
    let lastSpawn = 0;
    const spawnInterval = 1000 / SPAWN_HZ;

    // 마우스 추적
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
    }, { passive: true });

    function spawn(x, y, t) {
        const sizeX = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN); // 가로 반경
        const hue = HUE + (Math.random() * 2 - 1) * HUE_JITTER;
        const rot = ROT_BASE + (Math.random() * 2 - 1) * ROT_JITTER;    // 거의 0° ← ★
        particles.push({
            x, y,
            rot,
            birth: t,
            life: LIFE_MS * (0.9 + Math.random() * 0.25),
            sizeX,            // 가로 반경
            sizeY: sizeX * ASPECT, // 세로 반경 ← ★
            hue
        });
        if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    }

    function drawDiamond(p, alpha) {
        const ax = p.sizeX;     // half-width
        const ay = p.sizeY;     // half-height (더 큼) ← ★
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rot) ctx.rotate(p.rot);  // 기본 0°, 살짝만 흔들림

        // 네온 글로우
        ctx.shadowColor = `hsla(${p.hue} 100% 65% / ${0.9 * alpha})`;
        ctx.shadowBlur = SHADOW_BLUR;

        // 내부 그라데이션 (흰색 → 연파랑)
        const r = Math.max(ax, ay) * 1.1;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, `hsla(${p.hue} 100% 98% / ${0.9 * alpha})`);
        grad.addColorStop(1, `hsla(${p.hue} 100% 70% / ${0.55 * alpha})`);

        ctx.beginPath();
        // ★ 길쭉한 마름모(◇): 위/오른/아래/왼쪽 꼭짓점
        ctx.moveTo(0, -ay);
        ctx.lineTo(ax, 0);
        ctx.lineTo(0, ay);
        ctx.lineTo(-ax, 0);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // 얇은 외곽 하이라이트
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `hsla(${p.hue} 100% 80% / ${0.45 * alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    function tick(t) {
        // 배경을 건드리지 않음(완전 투명 클리어)
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // follower 보간 → 커서를 정확히, 부드럽게 따라감
        fx += (mouseX - fx) * FOLLOW_LERP;
        fy += (mouseY - fy) * FOLLOW_LERP;

        // 일정 주기로 다이아 스폰 (빠르게 움직여도 빈틈 없음)
        if (t - lastSpawn >= spawnInterval) {
            lastSpawn = t;
            spawn(fx, fy, t);
            // 중간 보강(더 촘촘)
            spawn((fx + mouseX) * 0.5, (fy + mouseY) * 0.5, t);
        }

        // 그리기
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const age = t - p.birth;
            const k = age / p.life;
            if (k >= 1) { particles.splice(i, 1); continue; }

            // 페이드 (끝으로 갈수록 사라짐)
            const alpha = Math.pow(1 - k, 1.6);
            drawDiamond(p, alpha);
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();


// 음표 애니메이션 관련 변수들
let musicInterval;
let notePositions = []; // 음표들의 고정 위치 저장
const maxNotes = 5; // 최대 5개 음표 표시

// 음표 기호들
const noteSymbols = ['♪', '♫', '♬', '♩'];

// 음표들의 고정 위치 초기화 (왼쪽부터 오른쪽으로)
function initializeNotePositions() {
    // 메인 콘텐츠 그룹의 중앙 위치를 찾음
    const mainContent = document.querySelector('.relative.flex.flex-col.items-center.justify-center.space-y-8');
    const lpGroup = mainContent.querySelector('.relative.group');

    if (lpGroup) {
        const rect = lpGroup.getBoundingClientRect();
        const recordLeft = rect.left + rect.width / 2; // LP판의 실제 중앙 X좌표
        const recordTop = rect.top + rect.height / 2;  // LP판의 실제 중앙 Y좌표

        // 레코드판 왼쪽에 음표들이 배치될 위치들
        notePositions = []; // 초기화
        for (let i = 0; i < maxNotes; i++) {
            const x = recordLeft - 100 - (i * 50); // 레코드에서 100px 떨어진 지점부터 시작
            const baseY = recordTop - 100;
            notePositions.push({
                x: x,
                baseY: baseY, // 기본 높이는 레코드판 중앙
                y: baseY, // 실제 높이 (랜덤 오프셋 포함)
                note: null // 현재 이 위치에 있는 음표 element
            });
        }
    }
}

// 새로운 음표 생성 및 기존 음표들 왼쪽으로 이동
function createMusicNote() {
    // 기존 음표들을 왼쪽으로 한 칸씩 이동
    for (let i = maxNotes - 1; i > 0; i--) {
        if (notePositions[i - 1].note) {
            // 이전 위치의 음표와 높이를 현재 위치로 이동
            notePositions[i].note = notePositions[i - 1].note;
            notePositions[i].y = notePositions[i - 1].y; // 높이도 함께 이동
            notePositions[i - 1].note = null;
            notePositions[i - 1].y = notePositions[i - 1].baseY; // 이전 위치는 기본 높이로 초기화

            // 위치 업데이트 (각 음표의 고유 높이 유지)
            const noteElement = notePositions[i].note;
            noteElement.style.left = notePositions[i].x + 'px';
            noteElement.style.top = notePositions[i].y + 'px';

            // 왼쪽으로 갈수록 투명해짐
            const opacity = Math.max(0, 1 - (i * 0.15)); // 더 자연스러운 투명도
            noteElement.style.opacity = opacity;

            // 크기도 점점 작아지게
            const scale = Math.max(0.4, 1 - (i * 0.1));
            noteElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }

    // 가장 왼쪽 음표 제거
    if (notePositions[maxNotes - 1].note) {
        notePositions[maxNotes - 1].note.remove();
        notePositions[maxNotes - 1].note = null;
        notePositions[maxNotes - 1].y = notePositions[maxNotes - 1].baseY; // 높이 초기화
    }

    // 새로운 음표를 가장 오른쪽 위치(0번)에 생성
    const newNote = document.createElement('div');
    newNote.className = 'fixed text-2xl font-bold text-blue-500 pointer-events-none z-10 select-none transition-all duration-700 ease-out';
    newNote.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];

    // 새 음표의 높이를 랜덤하게 설정
    const randomHeight = (Math.random() - 0.5) * 60; // -40px ~ +40px
    notePositions[0].y = notePositions[0].baseY + randomHeight;

    newNote.style.left = notePositions[0].x + 'px';
    newNote.style.top = notePositions[0].y + 'px';
    newNote.style.transform = 'translate(-50%, -50%) scale(1)';
    newNote.style.opacity = '1';

    notePositions[0].note = newNote;
    document.body.appendChild(newNote);

    // 다음 음표 생성 시간을 랜덤하게 설정 (자연스러운 리듬)
    const nextInterval = 500 + Math.random() * 600; // 0.5초 ~ 1.1초 사이
    setTimeout(createMusicNote, nextInterval);
}

// 모든 음표 제거 함수
function clearAllNotes() {
    notePositions.forEach(position => {
        if (position.note) {
            position.note.remove();
            position.note = null;
        }
    });
}

// 페이지 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 음표 위치 초기화
    initializeNotePositions();

    // 1초 후 음표 생성 시작 (자연스러운 시작)
    setTimeout(() => {
        createMusicNote(); // 첫 음표 생성 후 자동으로 연쇄 호출됨
        console.log('음표 애니메이션 자동 시작');
    }, 1500);
});

// 창 크기 변경 시 위치 재계산
window.addEventListener('resize', () => {
    clearAllNotes();
    initializeNotePositions();
});