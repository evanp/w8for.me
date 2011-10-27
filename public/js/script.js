/* Author: Evan Prodromou

 */

var UI = {
    _current: null,
    switchTo: function(panel) {
	if (this._current != null) {
	    $("#"+this._current).fadeOut();
	    $("#menu-"+this._current).removeClass('selected');
	}
	var old = this._current;
	this._current = panel;
	$("#"+this._current).trigger('switchfrom', { newPanel: panel });
	$("#"+this._current).trigger('switchto', { oldPanel: old });
	$("#"+this._current).fadeIn();
	$("#menu-"+this._current).addClass('selected');
    },

    niceDate: function(d)
    {
	now = new Date();
	
	if ((now.getYear() != d.getYear()) || (now.getMonth() != d.getMonth()) || (now.getDate() != d.getDate())) {
	    return d.toLocaleDateString();
	} else {
	    return d.toLocaleTimeString();
	}
    }
};

var entryForm = {

    showLastEntryDate: function(ts)
    {
	var d = new Date(ts);
	$('#last-entry-date').html("Last saved: " + UI.niceDate(d));
    },

    showWeight: function(weight)
    {
	$('#hundreds').val(Math.floor(weight/100));
	$('#tens').val(Math.floor((weight%100)/10));
	$('#ones').val(Math.floor(weight%10));
    },

    getWeight: function()
    {
	var hundreds = parseInt($('#hundreds').val());
	var tens = parseInt($('#tens').val());
	var ones = parseInt($('#ones').val());

	return (hundreds*100) + (tens*10) + ones;
    }
};

var entryStore = {

    get: function(key, def)
    {
	var raw = localStorage[key];

	if (raw == null) {
	    return def;
	} else {
	    return JSON.parse(raw);
	}
    },

    set: function(key, value)
    {
	localStorage[key] = JSON.stringify(value);
    },

    pushEntry: function(entry) 
    {
	this.set("entry."+entry.id, entry);
	this.set("entry.last", entry.id);

	var indexByTS = this.get("entry.index.by-ts", {});

	// XXX: assumes unique TS

	indexByTS[entry.ts] = entry.id;

	this.set("entry.index.by-ts", indexByTS);
    },

    getEntry: function(id)
    {
	return this.get("entry."+id, null);
    },

    getLastEntry: function()
    {
	var id = this.get("entry.last", null);
	if (id == null) {
	    return null;
	} else {
	    return this.getEntry(id);
	}
    },

    reverseChron: function() {

	var index = this.get("entry.index.by-ts", {});
	var times = new Array();
	var ids = new Array();

	for (var ts in index) {
	    times.push(parseInt(ts));
	}

	times.sort(function(a, b) { return b - a; });

	for (var i = 0; i < times.length; i++) {
	    var ts = times[i];
	    ids.push(index[ts]);
	}

	return ids;
    }
};

var historyPanel = {
    _init: false,
    initialize: function() {
	if (this._init) {
	    return;
	}
	var ids = entryStore.reverseChron();
	for (var i = 0; i < ids.length; i++) {
	    var id = ids[i];
	    var entry = entryStore.getEntry(id);
	    if (entry != null) {
		this.appendEntry(entry);
	    }
	}
	this._init = true;
    },

    appendEntry: function(entry) {
	$('#history-items tbody').append(this.rowForEntry(entry));
    },

    rowForEntry: function(entry) {
	return $('<tr id="entry-'+entry.id+'"><td>'+UI.niceDate(entry.ts)+'</td><td>'+entry.weight+'</td></tr>');
    },

    prependEntry: function(entry) {
	$('#history-items tbody').prepend(this.rowForEntry(entry));
    }
};

$(function() {

    // Make sure we have global JSON object

    if (!window.JSON) {
	$.getScript('js/mylibs/json2.js');
    }

    $.getScript('js/mylibs/uuid.js');

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

	    fr.insertAfter(el)
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

	var weight = entryForm.getWeight();
	// zero-indexed

	var entry = { weight: weight,
		      ts: new Date().getTime(),
		      id: uuid() };

	entryStore.pushEntry(entry);

	historyPanel.prependEntry(entry);
	entryForm.showLastEntryDate(entry.ts);

	// Don't do default processing

	return false;
    });

    var entry = entryStore.getLastEntry();

    if (entry == null) {
	entryForm.showWeight(150);
    } else {
	entryForm.showWeight(entry.weight);
	entryForm.showLastEntryDate(entry.ts);
    } 

    $('#history').bind('switchto', function (event, data) {
	historyPanel.initialize();
    });

    UI.switchTo('entry');
});
