/* Author: Evan Prodromou
 * 
 */

var UI = {
    _current: null,
    switchTo: function(newPanel) {
        var oldPanel = this._current;
        this._current = newPanel;

        if (oldPanel === null) {
            $("#"+newPanel).trigger('switchto', { oldPanel: oldPanel });
            $("#"+newPanel).fadeIn('fast', function() {
                $("#menu-"+newPanel).addClass('selected');
            });
        } else {
            $("#"+oldPanel).trigger('switchfrom', { newPanel: newPanel });
            $("#"+newPanel).trigger('switchto', { oldPanel: oldPanel });
            $("#"+oldPanel).fadeOut('fast', function() {
		$("#"+newPanel).fadeIn('fast', function() {
                    $("#menu-"+oldPanel).removeClass('selected');
                    $("#menu-"+newPanel).addClass('selected');
                });
            });
        }
    },

    switchToSynch: function() {
        var acct = entryStore.getAccount();

        if (acct === null) {
            return UI.switchTo('synch');
        } else {
            return UI.switchTo('synched');
        }
    },

    niceDate: function(d) {
        now = new Date();
        
        if ((now.getYear() != d.getYear()) || (now.getMonth() != d.getMonth()) || (now.getDate() != d.getDate())) {
            return d.toLocaleDateString();
        } else {
            return d.toLocaleTimeString();
        }
    }
};

var entryForm = {

    showLastEntryDate: function(ts) {
        var d = new Date(ts);
        $('#last-entry-date').html("Last saved: " + UI.niceDate(d));
    },

    showWeight: function(weight) {
        $('#hundreds').val(Math.floor(weight/100));
        $('#tens').val(Math.floor((weight%100)/10));
        $('#ones').val(Math.floor(weight%10));
    },

    getWeight: function() {
        var hundreds = parseInt($('#hundreds').val(), 10);
        var tens = parseInt($('#tens').val(), 10);
        var ones = parseInt($('#ones').val(), 10);

        return (hundreds*100) + (tens*10) + ones;
    }
};

var entryStore = {

    get: function(key, def) {
        var result = def;
        var raw = localStorage[key];
        if (raw !== null) {
            try {
                result = JSON.parse(raw);
            } catch (err) {
                delete localStorage[key];
                result = def;
            }
        }
        return result;
    },

    set: function(key, value) {
        localStorage[key] = JSON.stringify(value);
    },

    remove: function(key) {
        delete localStorage[key];
    },

    pushEntry: function(entry) {
        this.set("entry."+entry.id, entry);
        this.set("entry.last", entry.id);

        var indexByTS = this.get("entry.index.by-ts", {});

        // XXX: assumes unique TS

        indexByTS[entry.ts] = entry.id;

        this.set("entry.index.by-ts", indexByTS);
    },

    getEntry: function(id) {
        return this.get("entry."+id, null);
    },

    getLastEntry: function() {
        var id = this.get("entry.last", null);
        if (id === null) {
            return null;
        } else {
            return this.getEntry(id);
        }
    },

    reverseChron: function() {

        var index = this.get("entry.index.by-ts", {});
        var times = [];
        var ids   = [];
        var ts    = 0;
        var i     = 0;

        for (ts in index) {
            times.push(parseInt(ts, 10));
        }

        times.sort(function(a, b) { return b - a; });

        for (i = 0; i < times.length; i++) {
            ts = times[i];
            ids.push(index[ts]);
        }

        return ids;
    },

    getAccount: function() {
        return this.get('account', null);
    },

    removeAccount: function() {
        return this.remove('account');
    },

    setAccount: function(username, password) {
        return this.set('account', {username: username, password: password});
    },

    getLastSynch: function() {
        return this.get('entry.last-synch', null);
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
            if (entry !== null) {
                this.appendEntry(entry);
            }
        }
        this._init = true;
    },

    appendEntry: function(entry) {
        $('#history-items tbody').append(this.rowForEntry(entry));
    },

    rowForEntry: function(entry) {
        return $('<tr id="entry-'+entry.id+'"><td>'+UI.niceDate(new Date(entry.ts))+'</td><td>'+entry.weight+'</td></tr>');
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

    $('form#weight-entry').submit(function(event) {

        // Don't do default processing

        event.preventDefault();

        var weight = entryForm.getWeight();
        // zero-indexed

        var entry = { weight: weight,
                      ts: new Date().getTime(),
                      id: uuid() };

        entryStore.pushEntry(entry);

        historyPanel.prependEntry(entry);
        entryForm.showLastEntryDate(entry.ts);
    });

    $('form#synch-account').submit(function(event) {

        // Don't do default processing

        event.preventDefault();

        var username = $('#username').val();
        var password = $('#password').val();

        if (!username || !password) {
            
        }

        entryStore.setAccount(username, password);

        UI.switchTo('synched');
    });

    $('form#disconnect-account').submit(function(event) {
        // Don't do default processing

        event.preventDefault();

        entryStore.removeAccount();

        UI.switchTo('synch');

    });

    $('#synched').bind('switchto', function (event, data) {
        var acct = entryStore.getAccount();
        var lastSynch = entryStore.getLastSynch();
        var lastSynchText = (lastSynch === null) ? '' : UI.niceDate(lastSynch);

        if (acct !== null) {
            $('#synched-username').html(acct.username);
        }

        $('#last-synch').html(lastSynchText);
    });

    $('#history').bind('switchto', function (event, data) {
        historyPanel.initialize();
    });

    $('#entry').bind('switchto', function (event, data) {
        var entry = entryStore.getLastEntry();

        if (entry === null) {
            entryForm.showWeight(150);
        } else {
            entryForm.showWeight(entry.weight);
            entryForm.showLastEntryDate(entry.ts);
        } 
    });

    UI.switchTo('entry');
});
