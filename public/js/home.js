$(document).ready(function () {
  $("button").click(function () {
    $.post(
      "/approval",
      {
        image: $(this).data('image'),
        status : $(this).data('status'),
      }
    );
  });
});
