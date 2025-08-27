$(document).ready(function () {
    $('#changepw-form').on('submit', function (e) {
        e.preventDefault();

        const newPw = $('#changepw-new').val().trim();
        const confirmPw = $('#changepw-confirm').val().trim();

        if (!newPw || !confirmPw) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        if (newPw !== confirmPw) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        const $btn = $(this).find('button[type="submit"]');
        $btn.prop("disabled", true).text("처리 중...");

        $.ajax({
            url: "/api/changepw",
            method: "POST",
            data: {
                new_password: newPw
            },
            dataType: "json",
            success: function (res) {
                if (res && res.success) {
                    alert("비밀번호가 성공적으로 변경되었습니다.");
                    window.location.href = "/";
                } else {
                    alert(res && res.message ? res.message : "변경 실패");
                }
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "서버 오류 발생";
                alert(msg);
            },
            complete: function () {
                $btn.prop("disabled", false).text("변경하기");
            }
        });
    });
});