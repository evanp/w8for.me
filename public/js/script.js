/* Author: Evan Prodromou

 */

// Shim for 'number' types

$(function() {

    if (!Modernizr.inputtypes.number) {

	$('input[type="number"]').each(function(){
	    var el = $(this),
	    min = +el.attr('min'),
	    max = +el.attr('max'),
	    step = +el.attr('step'),
	    disabled = el.attr('disabled'),
	    lock = true, // Locking disables lots of key combinations, like Ctrl+V.
	    fr = $('<span class="num-shim" style="position: absolute;"><span class="up" style="display: block; cursor: pointer;">&#9650;</span><span class="down" style="display: block; cursor: pointer;">&#9660;</span></span>');
	    // Don't forget to position .num-shim in CSS.

	    el.wrap('<span style="position: relative; display: inline-block; overflow: hidden;" />');

	    disabled && el.parent().addClass('disabled');

	    el.bind('change', function() {
		var val = +el.val() || 0;
		el.val(Math.min(Math.max(min, val), max));
	    });

	    el.bind('keydown', function(e) {
		// ↑ ↓ keys
		if (e.keyCode === 38) {
		    valUpdate(step);
		}
		if (e.keyCode === 40) {
		    valUpdate(-step);
		}

		if (lock) {
		    // Backspace, enter, escape, delete
		    if ($.inArray(e.keyCode, [8, 13, 27, 46]) !== -1) return;

		    // Disable input of anything except numbers
		    if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
			e.preventDefault();
		    }
		}
	    });

	    fr
		.insertAfter(el)
		.find('span')
		.bind('click', function() {
		    $(this).hasClass('up') ? valUpdate(step) : valUpdate(-step);
		});

	    function valUpdate(num) {
		if (el.attr('disabled')) {
		    return;
		}
		el.val(+el.val() +num).trigger('change');
	    }
	});
    }
});