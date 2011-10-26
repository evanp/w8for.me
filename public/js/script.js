/* Author: Evan Prodromou

 */

function showLastEntryDate(ts)
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

function showWeight(weight)
{
    $('#hundreds').val(Math.floor(weight/100));
    $('#tens').val(Math.floor((weight%100)/10));
    $('#ones').val(Math.floor(weight%10));
}

function pushEntry(entry) 
{
    cnt = getCount();

    var i = cnt;
    var props = [];

    for (var prop in entry)
    {
	localStorage["entry."+i+"."+prop] = entry[prop];
	props.push(prop);
    }
    
    localStorage["entry."+i+"._properties"] = props.join(",");

    setCount(cnt+1);
}

function getEntry(i)
{
    var propString = localStorage["entry."+i+"._properties"];

    if (propString == null) {
	return null;
    }

    var properties = propString.split(",");

    var entry = {};

    for (var i in properties)
    {
	var prop = properties[i];
	entry[prop] = localStorage["entry."+i+"."+prop];
    }

    return entry;
}

function getLastEntry()
{
    var cnt = getCount();

    if (cnt == 0) {
	return null;
    } else {
	return getEntry(cnt - 1);
    }
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

	// zero-indexed

	var entry = { weight: weight,
		      ts: new Date().getTime() };

	pushEntry(entry);

	showLastEntryDate(entry.ts);

	// Don't do default processing

	return false;
    });

    var entry = getLastEntry();

    if (entry != null) {
	showWeight(entry.weight);
	showLastEntryDate(entry.ts);
    }
});
