// static/js/register.js
$(document).ready(function () {
    $("#register-form").on("submit", function (e) {
        e.preventDefault();

        const id = $("#register-id").val().trim();
        const pw = $("#register-password").val().trim();
        const nickname = $("#register-nickname").val().trim();
        const name = $("#register-name").val().trim();
        const birth = $("#register-birth").val().trim();

        if (!id || !pw || !name || !birth || !nickname) {
            alert("모든 항목을 입력하세요.");
            return;
        }

        // 버튼 중복 클릭 방지
        const $btn = $(this).find('button[type="submit"]');
        $btn.prop("disabled", true).text("처리 중...");

        $.ajax({
            url: "/api/register",
            method: "POST",
            data: {
                username: id,
                password: pw,
                name: name,
                birth: birth,
                nickname: nickname
            },
            success: function (res) {
                // 기대 응답 예: { success: true, message: "회원가입 완료" }
                if (res && res.success) {
                    alert(res.message || "회원가입이 완료되었습니다.");
                    window.location.href = "/";
                } else {
                    alert(res && res.message ? res.message : "회원가입에 실패했습니다.");
                }
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "서버 오류가 발생했습니다.";
                alert(msg);
            },
            complete: function () {
                $btn.prop("disabled", false).text("가입하기");
            }
        });
    });
});
