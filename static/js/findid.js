$(document).ready(function () {
    $("#findid-form").on("submit", function (e) {
        e.preventDefault();

        const name = $("#findid-name").val().trim();
        const birth = $("#findid-birth").val().trim();

        if (!name || !birth) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        const $btn = $(this).find("button[type='submit']");
        $btn.prop("disabled", true).text("처리 중...");

        $.ajax({
            url: "/api/findid",
            method: "POST",
            data: { name, birth },
            dataType: "json",
            success: function (res) {
                if (res.success && res.username) {
                    $("#findid-result")
                        .removeClass("hidden text-red-500")
                        .addClass("text-indigo-700")
                        .text(`찾은 아이디: ${res.username}`);
                } else {
                    $("#findid-result")
                        .removeClass("hidden text-indigo-700")
                        .addClass("text-red-500")
                        .text(res.message || "일치하는 아이디가 없습니다.");
                }
            },
            error: function () {
                $("#findid-result")
                    .removeClass("hidden text-indigo-700")
                    .addClass("text-red-500")
                    .text("서버 오류가 발생했습니다.");
            },
            complete: function () {
                $btn.prop("disabled", false).text("아이디 찾기");
            }
        });
    });
});
