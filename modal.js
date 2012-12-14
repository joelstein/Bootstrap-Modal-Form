$(document).ready(function() {

  // If hash changes, check if modal should launch.
  // E.g., #/login loads the /login form in a modal.
  $(window).on('hashchange', function() {
    var match = window.location.hash.match(/^#(\/.*)/);
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
    return;
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

  // Look for Cancel <a> button. Needs to be an <a> element, so on the actual
  // form page, it will work as a link. It also needs to have a
  // data-dismiss="modal" attribute. If this is not found, add a Cancel button.
  if ($form.find('.modal-footer a.btn[data-dismiss=modal]:contains(Cancel)').length == 0) {
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

  // Attach delegated click handler, not on the buttons themselves, but on the
  // form, so that we catch the click event as it's bubbling up. This allows the
  // buttons to decide whether or not continue, based on their own logic (such
  // as with a delete button and its confirm dialog).
  $form.on('click', '.modal-footer .btn[name]', function() {
    // If the clicked button has a name attribute, store it as a hidden field,
    // so that it gets submitted with the form (the form itself won't include
    // the button value, because it's not attached to the submit handler
    // below).
    $('<input type="hidden" />').attr({
      'name': $(this).attr('name'),
      'value': $(this).attr('value')
    }).appendTo($form);

    // Add loading state text to the buttons.
    $(this).button('loading');
  });


  // When submitting the form, send it via Ajax, hide the current modal, and
  // replace it with a new modal form.
  $form.submit(function() {
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

  // When modal is fully shown, "do stuff" in the context of the form.
  $form.on('shown', function() {
    doStuff(this);
  });

  // When closing the modal, remove it. Clear hash if form was successful and
  // the current hash is the same as the form's (in other words, if the form
  // had validation errors, keep the hash, or if we navigated to a new hash,
  // keep it).
  $form.on('hidden', function() {
    if (typeof($form.data('data')) == 'undefined' && $form.data('hash') === window.location.hash) {
      window.location.hash = '';
    }
    $form.remove();
  });

  // Show the modal now.
  $form.modal('show');
}
