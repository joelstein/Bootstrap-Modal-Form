$(document).ready(function() {

  // If hash changes, check if modal should launch.
  // E.g., #/login loads the /login form in a modal.
  $(window).on('hashchange', function() {
    var match = window.location.hash.match(/^#\/(.*)/);
    if (match) {
      $('.modal').modal('hide');
      var url = match[1];
      $.ajax({
        url: url,
        dataType: 'json',
        success: function(data) {
          modalForm(data, url);
        }
      });
    }
  }).trigger('hashchange');

});

/**
 * Converts form into modal form.
 */
function modalForm(data, url) {

  // Redirect if a redirect value is present.
  if (data.redirect) {
    window.location = data.redirect;
  }

  // If HTML contains <script> tags, strip from HTML and evaluate them.
  var regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  var scripts = data.data.match(regex);
  if (scripts) {
    $.each(scripts, function(i, script) {
      $.globalEval($(script).text());
    });
    data.data = data.data.replace(regex, '');
  }

  // If script is available, evaluate it.
  if (data.script) {
    $.getScript('/' + data.script);
  }

  // Assumes that the top-level element is a form.
  var $form = $(data.data);

  // Store the form's hash.
  $form.data('hash', window.location.hash);

  // Give form modal classes.
  $form.addClass('modal modal-form');

  // Wrap form contents in a modal body.
  $form.contents().wrapAll('<div class="modal-body">');

  // Move form actions to modal footer.
  $form.find('.form-actions').addClass('modal-footer').appendTo($form).removeClass('form-actions');

  // Add a Cancel button, if non is present.
  if ($form.find('.modal-footer .btn:contains(Cancel)').length == 0) {
    $form.find('.modal-footer').append('<button href="' + window.location + '" class="btn" data-dismiss="modal">Cancel</button>');
  }

  // Slap on a modal header.
  $form.prepend('<div class="modal-header"><button type="button" class="close" data-dismiss="modal">&times;</button><h3>' + (data.title ? data.title : 'Form') + '</h3></div>');

  // If form has no action defined, use the passed URL.
  if (!$form.is('[action]')) {
    $form.attr('action', url);
  }

  // Show any any messages that were returned.
  if (data.messages) {
    $messages = $('<div />');
    $.each(data.messages, function(type, messages) {
      $.each(messages, function(i, message) {
        $messages.append('<div class="alert ' + (type == 'error' ? 'alert-danger' : (type ? 'alert-' + type : 'alert-info')) + '"><button type="button" class="close" data-dismiss="alert">&times;</button>' + message + '</div>');
      });
    });
    $messages.prependTo($form.find('.modal-body'));
  }

  // When submitting the form, send it via Ajax, hide the current modal, and
  // replace it with a new modal form.
  $form.find('[type=submit]').click(function() {
    $.ajax({
      url: $form.attr('action'),
      data: $form.serialize(),
      type: 'POST',
      dataType: 'json',
      success: function(data) {
        // Store the response data (see the modal's hidden callback below).
        $form.data('data', data).modal('hide');
        modalForm(data, url);
      }
    });
    return false;
  });

  // Convert form into a modal. If form has data- attributes, use those to
  // override our default "close" behaviors (we don't normally want the modal
  // to close unless the user clicks an intentional close element). Don't show
  // it yet (we have to define our "shown" callback).
  $form.modal({
    backdrop: $form.attr('data-backdrop') || 'static',
    keyboard: $form.attr('data-keyboard') || false,
    show: false
  });

  // When modal is fully shown, "do stuff".
  $form.on('shown', function() {
    doStuff();
  });

  // When closing the modal, remove it. Clear hash if form was successful and
  // the current hash is the same as the form's (in other words, if the form
  // had validation errors, keep the hash, or if we navigated to a new hash,
  // keep it).
  $form.on('hidden', function() {
    if (typeof($(this).data('data')) == 'undefined' && $(this).data('hash') === window.location.hash) {
      window.location.hash = '';
    }
    $(this).remove();
  });

  // Show the modal now.
  $form.modal('show');
}