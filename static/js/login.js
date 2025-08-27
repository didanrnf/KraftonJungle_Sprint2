$(document).ready(function () {
    // 로그인 폼 제출 이벤트
    $('#auth-form').on('submit', function (e) {
        e.preventDefault();

        const id = $('#user-id').val().trim();
        const pw = $('#user-password').val().trim();

        if (!id || !pw) {
            alert("아이디와 비밀번호를 모두 입력해주세요.");
            return;
        }

        const $btn = $(this).find('button[type="submit"]');
        $btn.prop("disabled", true).text("처리 중...");

        $.ajax({
            url: "/api/login",
            method: "POST",
            data: {
                username: id,
                password: pw
            },
            dataType: "json",
            success: function (res) {
                if (res && res.success) {
                    window.location.href = "/";  // 로그인 후 이동할 페이지
                } else {
                    alert(res && res.message ? res.message : "로그인에 실패했습니다.");
                }
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "서버 오류가 발생했습니다.";
                alert(msg);
            },
            complete: function () {
                $btn.prop("disabled", false).text("로그인");
            }
        });
    });

});
