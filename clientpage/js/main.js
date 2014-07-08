/* Enable some jQuery goodness */
$("#sortable").sortable();
$("#sortable").disableSelection();
<!-- Refresh list to the end of sort to have a correct display -->
$("#sortable").bind("sortstop", function(event, ui) {
  //$('#sortable').listview('refresh');
});
$(function() {
  $("#tabs").tabs();
});

