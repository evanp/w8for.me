/* Author: Evan Prodromou

 */

function setLastEntryDate(ts)
{
    var d = new Date(ts);
    $('#last-entry-date').html("Last saved: " + niceDate(d));
}

function niceDate(d)
{
    now = new Date();
    
    if ((now.getYear() != d.getYear()) || (now.getMonth() != d.getMonth()) || (now.getDate() != d.getDate())) {
	return d.toLocaleDateString();
    } else {
	return d.toLocaleTimeString();
    }
}

function setWeight(weight)
{
    $('#hundreds').val(Math.floor(weight/100));
    $('#tens').val(Math.floor((weight%100)/10));
    $('#ones').val(Math.floor(weight%10));
}

function getCount()
{
    var rawCnt = localStorage["entry.count"];
    if (rawCnt == null) {
	cnt = 0;
	localStorage["entry.count"] = cnt;
    } else {
	cnt = parseInt(rawCnt);
    }
    return cnt;
}

function setCount(cnt)
{
    localStorage["entry.count"] = cnt;
}

$(function() {

    // Shim for 'number' types

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

    $('form#weight-entry').submit(function(event) {

	var hundreds = parseInt($('#hundreds').val());
	var tens = parseInt($('#tens').val());
	var ones = parseInt($('#ones').val());

	var weight = (hundreds*100) + (tens*10) + ones;

	cnt = getCount();

	// zero-indexed

	var item = cnt;

	var ts = new Date().getTime();

	localStorage["entry."+item+".weight"] = weight;
	localStorage["entry."+item+".timestamp"] = ts;

	setCount(cnt+1);

	// Don't do default processing

	setLastEntryDate(ts);

	return false;
    });

    var cnt = getCount();

    if (cnt > 0) {
	var item = cnt-1;
	var weight = parseInt(localStorage["entry."+item+".weight"]);
	var ts = parseInt(localStorage["entry."+item+".timestamp"]);
	setWeight(weight);
	setLastEntryDate(ts);
    }
});
