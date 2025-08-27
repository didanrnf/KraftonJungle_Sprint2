$(document).ready(function () {
    $("#findpw-form").on("submit", function (e) {
        e.preventDefault();

        const id = $("#findpw-id").val().trim();
        const name = $("#findpw-name").val().trim();
        const birth = $("#findpw-birth").val().trim();

        if (!id || !name || !birth) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        const $btn = $(this).find("button[type='submit']");
        $btn.prop("disabled", true).text("처리 중...");

        $.ajax({
            url: "/api/findpw",
            method: "POST",
            data: {
                username: id,
                name: name,
                birth: birth
            }, // 기본 Content-Type: application/x-www-form-urlencoded
            dataType: "json",
            success: function (res) {
                if (res && res.success) {
                    console.log(res.message || "계정 정보가 확인되었습니다.");
                    window.location.href = `/changepw?user=${encodeURIComponent(id)}`;
                } else {
                    alert(res && res.message ? res.message : "계정 정보를 찾을 수 없습니다.");
                }
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || "서버 오류가 발생했습니다.";
                alert(msg);
            },
            complete: function () {
                $btn.prop("disabled", false).text("다음");
            }
        });
    });
});