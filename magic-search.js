/**
 * Created by A6252532 on 20/11/2015.
 */
(function($, window, document) {
    'use strict';
    var magicsearch = {};
    magicsearch.APP_NAME = "MagicSearch";
    magicsearch.APP_AUTHOR = "Vincent DAGOURY";
    magicsearch.APP_VERSION = "0.1b";
    magicsearch.CONTAINER_NAME = "#magic-search";
    magicsearch.ATTR_FOR_REF_MENU = "data-ref-menu";
    magicsearch.PATTERN_FOR_HREF = "";
    magicsearch.SHOW_DIV_DELAY = 3000;
    magicsearch.SHOW_ITEM_DELAY = 100;
    magicsearch.QUESTION_MARK = "?";
    magicsearch.CLOSING_MARK = "X";
    magicsearch.HTML_CLOSE_BUTTON = "";
    magicsearch.LOCALSTORAGE_CLICK = "LOCALSTORAGE_CLICK";

    // Default fake content
    magicsearch.content = [];

    // Sorting function for magicsearch.content based on title
    function compare(a, b) {
        if (a.title < b.title)
            return -1;
        if (a.title > b.title)
            return 1;
        return 0;
    }
/// CLEARABLE INPUT
    function tog(v) {
        return v ? 'addClass' : 'removeClass';
    }
   
    /* init */
    magicsearch.init = function() {
        // Cache the Window object and DOM objects
        var $window = $(window);
        // Get the main container
        var $container = $(magicsearch.CONTAINER_NAME);
        // Content of magicsearch
        var $containerList, $containerMetaSearch, $closeButton;

        var countSuggestion = 0;
        // We need to have something to do : a content for magicsearch to display
        if ($container.length > 0) {
            // Fresh content
            $container.empty();
            /* get content from json */
            $.getJSON("menu.json", function(data) {
                magicsearch.content = data.menus;
                $containerList = $container.find('ul:last');

                // Append item's list in magicsearch menu
                var item = {};
                for (var i = 0; i < magicsearch.content.length; i++) {
                    item = magicsearch.content[i];
                    $containerList.append('<li ><a id="' + item.id + '" class="menuItem" href="' + item.href + '"><span class="item-title">' + item.title + '</span></a></li>');
                }
                magicsearch.content.sort(compare);
                // Run the support html5 check
                if (!supportsLocalStorage()) {
                    // No HTML5 localStorage Support
                } else {
                    initStorage();
                }
            });//end ajax

            //create plugin structure
            $container.append('<div id="ms-container"><div id="ms-inner-left-pannel"><form action="#"> <label><h1>Rechercher...</h1> <div id="ms-searchInput-div"><input class="clearable" id="ms-searchInput-input" name="sidesearchbx" onkeydown="//typeSearch(this.value);" type="text"> <input id="ms-searchInput-btn" type="button" onclick="goSearch(\'ms-searchInput-input\');"> </div><ul></ul></label></form></div> <div  id="ms-inner-bottom-pannel"> <span id="ms-lib-invite">Entrez votre mot-clef ici<br/> Le site cherchera une correspondance pour vous.</span> </div><div  id="ms-outter-right-pannel"></div></div>');
            $containerMetaSearch = $container.find("#ms-searchInput-input");

            /* Input behavior */
            var searchInput, text = "";
            $containerMetaSearch
                    .unbind('keypress keyup')
                    .bind('keypress keyup', function(event) {
                         // clear suggestions.
                         $('li:has(a.suggestedItem)').detach();
                        // Get the input content
                        var valThis = $(this).val().toLowerCase();
                        // In input is empty the list is displayed
                        if (valThis.length == 0) {
                            //sort by alphabetical caracters when imput is blank
                            var $childrenli = $containerList.children('li');
                            $childrenli.sort(function(a, b) {
                                var an = $(a).find('a').text(),
                                        bn = $(b).find('a').text();
                                if (an < bn)
                                    return -1;
                                if (an > bn)
                                    return 1;
                                return 0;
                            });
                            $childrenli.detach().appendTo($containerList);
                            $containerList.children("li").each(function() {
                                $(this).slideDown();
                            })
                           

                        }
                        // Start search up to 3rd characters
                        if (valThis.length < 1 && event.keyCode != 13) {
                            return;
                        }
                        else {
                            searchInput = $(this);
                            text = "";
                            //sort <li> by click
                            var $childrenli = $containerList.children('li');
                            $childrenli.sort(function(a, b) {
                                var an = $(a).find('a').attr('id'),
                                        bn = $(b).find('a').attr('id');

                                if (magicsearch.tabClick[an] == null || magicsearch.tabClick[an] == 0) {
                                    magicsearch.tabClick[an] = 0;
                                }
                                if (magicsearch.tabClick[bn] == null || magicsearch.tabClick[bn] == 0) {
                                    magicsearch.tabClick[bn] = 0;
                                }
                                return  magicsearch.tabClick[bn] - magicsearch.tabClick[an];
                            });
                            $childrenli.detach().appendTo($containerList);


                            $containerList.children("li").each(function() {
                                text = $(this).text().toLowerCase();
                                (text.indexOf(valThis) >= 0) ? $(this).slideDown() : $(this).slideUp();
                            });
                            //$containerList.fadeIn();
                            //call timeout
                            countSuggestion++;
                            setTimeout(function() {
                                countSuggestion--;
                                if (countSuggestion == 0) {
                                    //call ajax suggestion
                                    $.getJSON("search.json", function(data) {
                                        magicsearch.content = data.suggestions;
                                        $containerList = $container.find('ul:last');

                                        // Append item's list in magicsearch menu
                                        var item = {};
                                        for (var i = 0; i < magicsearch.content.length; i++) {
                                            item = magicsearch.content[i];
                                            $containerList.append('<li><a id="' + item.id + '" class="suggestedItem" href="' + item.href + '"><span class="itemSuggestion-title">' + item.title + '</span></a></li>');
                                        }
                                        magicsearch.content.sort(compare);
                                        // Run the support html5 check
                                        if (!supportsLocalStorage()) {
                                            // No HTML5 localStorage Support
                                        } else {
                                            initStorage();
                                        }
                                    });//end ajax

                                }
                                //execute suggestion only if count suggestion is 0
                            }, 2000);

                        }
                        return;
                    });

            /* Define display after SHOW_DIV_DELAY is timedout*/
            setTimeout(
                    function() {
                        $container.show();
                    }
            , magicsearch.SHOW_DIV_DELAY);
    
     //fonctions delegate: on cherche a appliquer une fonction sur l'input avec classe x, qui n'existe pas encore
        $("#ms-container").on('keypress keyup', 'input.clearable', function() {
        $(this)[tog(this.value)]('x');
    }).on('mousemove', 'input.x', function(e) {
        $(this)[tog(this.offsetWidth - 18 < e.clientX - this.getBoundingClientRect().left)]('onX');
    }).on('touchstart click', 'input.onX', function(ev) {
        ev.preventDefault();
        $(this).removeClass('x onX').val('').change().keyup();
    });
    
        }
    };

    // localStorage detection
    function supportsLocalStorage() {
        return typeof (Storage) !== 'undefined';
    }

    // localStorage detection
    function initStorage() {
        magicsearch.tabClick = JSON.parse(localStorage.getItem(magicsearch.LOCALSTORAGE_CLICK));
        if (magicsearch.tabClick == null) {
            magicsearch.tabClick = new Object();
        }

        $("#magic-search ul li a.menuItem").on("click", function(e) {
            if (magicsearch.tabClick[$(e.currentTarget).attr('id')] == null) {
                magicsearch.tabClick[$(e.currentTarget).attr('id')] = 0;
            }
            magicsearch.tabClick[$(e.currentTarget).attr('id')]++;
            console.log($(e.currentTarget).attr('id') + ": " + magicsearch.tabClick[$(e.currentTarget).attr('id')])
            //alert(JSON.stringify(magicsearch.tabClick));
            //local storage stores strings
            localStorage.setItem(magicsearch.LOCALSTORAGE_CLICK, JSON.stringify(magicsearch.tabClick));
        });
    }
    /* Launcher : when DOM is ready */
    $(function() {
        magicsearch.init();
    })
})($, window, document);
