/**
 * @author joash.xu
 * 
 * Shameless Django SelectFilter, SelectBox port to jquery.
 * Need to use it outside Django.
 * 
 * Usage: 
 *      $('#unique_multiple_select_under_form').filterbox();
 * 
 *
 */
(function($) {
   $.filterbox = function (element) {
     return $.filterbox.impl.init(element);
   };

   $.fn.filterbox = function(){
     return $.filterbox.impl.init(this);
   };

   var SelectBox = {
       
     cache: new Object(),

     init: function(element) {
       var node;
       var id = $(element).attr("id");

       SelectBox.cache[id] = new Array();
       var cache = SelectBox.cache[id];

       for (var i = 0; (node = $(element)[0].options[i]); i++) {
         cache.push({value: node.value, text: node.text, displayed: 1});
       }
     },

     redisplay: function(element) {
       var id = $(element).attr("id");

       $(element)[0].options.length = 0;

       for (var i = 0, j = SelectBox.cache[id].length; i < j; i++) {
         var node = SelectBox.cache[id][i];
         if (node.displayed) {
             $(element)[0].options[$(element)[0].options.length] = new Option(node.text, node.value, false, false);
         }
       }
      },

     filter: function(element, text) {
       var tokens = text.toLowerCase().split(/\s+/);
       var node, token;
       var id = $(element).attr("id");

       for (var i = 0; (node = SelectBox.cache[id][i]); i++) {
            node.displayed = 1;
            for (var j = 0; (token = tokens[j]); j++) {
                if (node.text.toLowerCase().indexOf(token) == -1) {
                    node.displayed = 0;
                }
            }
       }

       SelectBox.redisplay(element);
     },

     delete_from_cache: function(element, value) {
       var id = $(element).attr("id");
       var node, delete_index = null;

       for (var i = 0; (node = SelectBox.cache[id][i]); i++) {
            if (node.value == value) {
                delete_index = i;
                break;
            }
        }

        var j = SelectBox.cache[id].length - 1;
        for (var i = delete_index; i < j; i++) {
            SelectBox.cache[id][i] = SelectBox.cache[id][i+1];
        }

        SelectBox.cache[id].length--;
     },

    add_to_cache: function(element, option) {
        var id = $(element).attr("id");
        SelectBox.cache[id].push({value: option.value, text: option.text, displayed: 1});
    },

    cache_contains: function(element, value) {
        var id = $(element).attr("id");
        var node;
        for (var i = 0; (node = SelectBox.cache[id][i]); i++) {
            if (node.value == value) {
                return true;
            }
        }
        return false;
    },

    move: function(from, to) {
        var from_box = $(from)[0];
        var to_box = $(to)[0];
        var option;
        for (var i = 0; (option = from_box.options[i]); i++) {
            if (option.selected && SelectBox.cache_contains(from, option.value)) {
                SelectBox.add_to_cache(to, {value: option.value, text: option.text, displayed: 1});
                SelectBox.delete_from_cache(from, option.value);
            }
        }
        SelectBox.redisplay(from);
        SelectBox.redisplay(to);
    },

    move_all: function(from, to) {
        var from_box = $(from)[0];
        var to_box = $(to)[0];
        var option;
        for (var i = 0; (option = from_box.options[i]); i++) {
            if (SelectBox.cache_contains(from, option.value)) {
                SelectBox.add_to_cache(to, {value: option.value, text: option.text, displayed: 1});
                SelectBox.delete_from_cache(from, option.value);
            }
        }
        SelectBox.redisplay(from);
        SelectBox.redisplay(to);
    },

    sort: function(element) {
        var id = $(element)[0];
        SelectBox.cache[id].sort( function(a, b) {
            a = a.text.toLowerCase();
            b = b.text.toLowerCase();
            try {
                if (a > b) return 1;
                if (a < b) return -1;
            }
            catch (e) {
                // silently fail on IE 'unknown' exception
            }

            return 0;
        });
    },

    select_all: function(element) {
        for (var i = 0; i <$(element)[0].options.length; i++) {
            $(element)[0].options[i].selected = 'selected';
        }
    }
   };

   $.filterbox.impl = {
     __uid_counter : 0,
     
     __getUID : function(){
        this.__uid_counter++;

        // Return a unique ID
        return "id-" + this.__uid_counter; 
     },
       
     filterboxHtml : '<div class="filterbox">\
          <div class="selector-available">\
            <p><input type="text" class="filter" /></p>\
            <select id="source-to-be-replaced" multiple="multiple"></select>\
            <a class="bulk-selector" href="#">Select All</a>\
          </div>\
          <ul class="selector-chooser">\
            <li><a class="add-item" href="#">&#187;</a></li>\
            <li><a class="remove-item" href="#">&#171;</a></li>\
          </ul>\
          <div class="selector-chosen">\
            <p></p>\
            <select id="destination-to-be-replaced" multiple="multiple"></select>\
            <a class="bulk-selector" href="#">Deselect All</a>\
          </div>\
        </div>',


     findForm : function(node) {
       while( $(node)[0].tagName.toLowerCase() != 'form' ){
         node = $(node).parent();
       }

       return node;
     },
     
     init : function(element){
       $(element).after(this.filterboxHtml);
       var filterbox_el = $(element).next();

       filterbox_el.find("select#destination-to-be-replaced").replaceWith($(element));

       var source = filterbox_el.find('select:first'),
           destination = $(element);

       $(source).attr("id", this.__getUID()); 

       temp = new Array();	
       for (var i = 0; (option = $(destination)[0].options[i]); i++) {
           if (option.selected) {
               temp.push({value: option.value, text: option.text, displayed: 1});
           }
       }

       SelectBox.init(source);
       SelectBox.init(destination);

       SelectBox.move_all(destination, source);

       for (var i = 0; i < $(source)[0].options.length; i++){
           for (var j = 0; j < temp.length; j++) {
               if ($(source)[0].options[i].value == temp[j].value) {
                   $(source)[0].options[i].selected = "selected";
               }
           }
       }
       
       SelectBox.move(source, destination);

       // search functionality
       filterbox_el
         .find('div.selector-available p input')
         .keyup(function(e){
                 if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)){
                   SelectBox.move(source, destination);
                   return false;
                 }

                 var temp = $(source)[0].selectedIndex;
                 SelectBox.filter(source, $(this).val());
                 $(source)[0].selectedIndex = temp;

                 return true;
          })
         .keydown(function(e){
                 // right arrow
                 if ((e.which && e.which == 39) || (e.keyCode && e.keyCode == 39)){
                   SelectBox.move(source, destination);

                   return false;
                 }

                 // down arrow -- wrap around
                 if ((e.which && e.which == 40) || (e.keyCode && e.keyCode == 40)) {
                   $(source)[0].selectedIndex = ($(source)[0].length == $(source)[0].selectedIndex + 1) ? 0 : $(source)[0].selectedIndex + 1;
                 }

                 // up arrow -- wrap around
                 if ((e.which && e.which == 38) || (e.keyCode && e.keyCode == 38)) {
                   $(source)[0].selectedIndex = ($(source)[0].selectedIndex == 0) ? $(source)[0].length - 1 : $(source)[0].selectedIndex - 1;
                 }

                 return true;
          });

       // add
       filterbox_el
         .find('ul li a:first')
         .click(function(e){
                  e.preventDefault();
                  SelectBox.move(source, destination);
          });

       // remove
       filterbox_el
         .find('ul li a:last')
         .click(function(e){
                  e.preventDefault();
                  SelectBox.move(destination, source);
          });

       // select all
       filterbox_el
         .find('a.bulk-selector:first')
         .click(function(e){
                  e.preventDefault();
                  SelectBox.move_all(source, destination);
          });

       // clear all
       filterbox_el
         .find('a.bulk-selector:last')
         .click(function(e){
                  e.preventDefault();
                  SelectBox.move_all(destination,source);
          });

       // double click source
       $(source).dblclick(function(e){
                  e.preventDefault();
                  SelectBox.move(source, destination);
       });

       $(destination).dblclick(function(e){
                  e.preventDefault();
                  SelectBox.move(destination, source);
       });

       $(this.findForm(element)).bind("submit", function(){
                 SelectBox.select_all(destination);
       });

       return this;
     }
   };
})(jQuery);
