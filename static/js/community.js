$(document).ready(function () {
    // 좋아요 버튼 클릭 이벤트 (향후 구현)
    $(document).on('click', '.like-btn', function (event) {
        // 부모 요소(카드)로 이벤트가 전파되는 것을 막음
        event.stopPropagation();

        const postId = $(this).closest('.post-card').data('post-id');
        alert('좋아요 기능은 곧 추가될 예정입니다. (게시글 ID: ' + postId + ')');

        // 여기에 좋아요 API를 호출하는 AJAX 코드를 추가할 예정입니다.
    });

    // 게시글 카드 클릭 시 상세 페이지로 이동 (향후 구현)
    // $(document).on('click', '.post-card', function() {
    //     const postId = $(this).data('post-id');
    //     window.location.href = '/community/' + postId;
    // });
});
document.querySelectorAll(".post-card").forEach(card => {
    card.addEventListener("click", function () {
        const postId = this.dataset.postId;
        if (postId) {
            window.location.href = `/post/${postId}`;
        }
    });
});