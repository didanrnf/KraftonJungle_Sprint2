function showPanel(panelId) {
    document.querySelectorAll('.content-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.menu-tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(panelId + '-panel').classList.add('active');
    document.getElementById('show-' + panelId + '-btn').classList.add('active');
}

document.addEventListener('DOMContentLoaded', function () {
    const birthInput = document.getElementById('edit-birth');
    if (birthInput) {
        const value = birthInput.value;
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            try {
                const date = new Date(value);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                birthInput.value = `${year}-${month}-${day}`;
            } catch (e) {
                console.error('날짜 포맷 변환 오류:', e);
            }
        }
    }

    document.querySelector('.content-area').addEventListener('click', function (event) {
        const button = event.target.closest('.unlike-btn');
        if (button) {
            // 좋아요 취소 버튼 클릭 시
            const trackId = button.dataset.trackId;
            console.log("Unlike button clicked! trackId:", trackId);

            if (!confirm("정말로 좋아요를 취소하시겠습니까?")) {
                return;
            }

            fetch('/profile/unlike-song', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ track_id: trackId })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    alert(data.message);
                    if (data.success) {
                        const itemToRemove = document.querySelector(`.list-item[data-item-id='${trackId}']`);
                        if (itemToRemove) {
                            itemToRemove.remove();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('오류가 발생했습니다. 개발자 콘솔을 확인해주세요.');
                });
        } else {
            // 노래 리스트 아이템 클릭 시 (버튼 제외)
            const listItem = event.target.closest('.list-item');
            if (listItem) {
                const trackId = listItem.dataset.itemId;
                window.location.href = `/search?track_id=${trackId}`;
            }
        }
    });
});

/**
 * 주어진 필드(이름, 닉네임, 생년월일)의 값을 업데이트합니다.
 * @param {string} fieldName - 'name', 'nickname', 'birth' 중 하나의 문자열
 */
function updateField(fieldName) {
    let inputId, apiUrl, dataKey;

    switch (fieldName) {
        case 'name':
            inputId = 'edit-name';
            apiUrl = '/api/profile/change-name';
            dataKey = 'name';
            break;
        case 'nickname':
            inputId = 'edit-nickname';
            apiUrl = '/api/profile/change-nickname';
            dataKey = 'nickname';
            break;
        case 'birth':
            inputId = 'edit-birth';
            apiUrl = '/api/profile/change-birth';
            dataKey = 'birth';
            break;
        default:
            console.error('유효하지 않은 필드 이름입니다.');
            return;
    }

    const inputValue = document.getElementById(inputId).value;

    if (!inputValue) {
        alert(`${dataKey === 'birth' ? '생년월일' : dataKey === 'name' ? '이름' : '닉네임'}을 입력해주세요.`);
        return;
    }

    if (fieldName === 'birth') {
        const birthPattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!birthPattern.test(inputValue)) {
            alert("생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)");
            return;
        }
    }

    const requestData = { [dataKey]: inputValue };

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            console.log('성공:', data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`오류가 발생했습니다: ${error.message}`);
        });
}