// the normal script

// convention: return "" instead of undefined if error

// reference
// [Rich notifications API](https://developer.chrome.com/docs/extensions/mv3/richNotifications/#basic)
// [chrome.notifications](https://developer.chrome.com/docs/extensions/reference/notifications/#method-create)
// [Error when using chrome.notifications.create "Uncaught TypeError: Cannot read property 'create' of undefined"](https://stackoverflow.com/questions/34912279/error-when-using-chrome-notifications-create-uncaught-typeerror-cannot-read-pr)
// [Message passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)

main();

async function main() {
    try {
        await idle();

        // console.log("my content script is running");

        // infos
        var site = location.hostname.toLowerCase();
        if (site.endsWith('/')) site = site.substring(0, site.length-1);

        // copy content
        var selected = getSelectionText();
        var suffix = await getSuffix();
        var url = getURL();

        var toCopy = `[${selected}${suffix}](${url})`;
        
        // console.log(toCopy);

        // async function
        // write to clipboard
        // only HTTPS could use this API
        // check is HTTPS with window.isSecureContext
        await navigator.clipboard.writeText(toCopy);
        
        // tell service worker I'm finished
        // const response = await chrome.runtime.sendMessage("copy success");




        // await me to immediately return a async function
        async function idle() {}

        function isThatSite(theSite, isThatSite) {
            if (theSite.length >= isThatSite.length)
                if ( theSite.length == isThatSite.length )
                    return theSite == isThatSite;
                else
                    return theSite.endsWith('.' + isThatSite);
            return false;
        }

        function isThatPath(thePath, isThatPath) {
            var a = "";
            if (!thePath.startsWith("/")) thePath = "/" + thePath;
            if (!isThatPath.startsWith("/")) isThatPath = "/" + isThatPath;
            if (isThatPath.endsWith("/")) isThatPath = isThatPath.substring(0, isThatPath.length-1);
            if (thePath.length >= isThatPath.length)
                if ( thePath.length == isThatPath.length )
                    return thePath == isThatPath;
                else
                    return thePath.startsWith(isThatPath + "/");
            return false;
        }

        function removeGarbageCharacter(text) {
            if (text == undefined) return "";
            // remove emoji
            text = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, ' ');
            // remove Zero-Width Char
            text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
            // remove [ ]
            text = text.replace(/[\[\]]/g, ' ');
            // remove new line
            // text = text.replace(/(\r\n)|(\n)/g, " \\n ");
            text = text.replace(/((\r\n)|(\n))+/g, " ~ ");
            // n space to 1 space
            text = text.replace(/ +/g, " ");
            // remove leading and following whitespace
            text = text.trim();
            return text;
        }

		// e.g. input | output \|
		function toDisplayTextToSourceText(toDisplayText) {
			var sourceText = "";
			var i = 0;
			var charsNeedBackslash = "\\|_*~#$%^&()<>";
			for (; i<toDisplayText.length; i++) {
				var c = toDisplayText.charAt(i);
				var sourC = "";
				if (charsNeedBackslash.includes(c)) sourC = '\\' + c;
				else sourC = c;
				sourceText += sourC;
			}
			return sourceText;
		}

        function getSelectionText() {
            var text = "";
            var windowSelected;
            var documentSelected;
            if (window.getSelection && (windowSelected=window.getSelection().toString()) != "") {
                text = windowSelected;
            } else if (document.selection && document.selection.type != "Control" && 
                                    (documentSelected = document.selection.createRange().text) != "") {
                text = documentSelected;
            } else {
                var autoChoosed = autoChooseText();
                if (autoChoosed != "") text = autoChoosed;
            }
            text = removeGarbageCharacter(text);
            text = toDisplayTextToSourceText(text);
            return text;
        }

        function autoChooseText() {
            var elems = document.getElementsByTagName('h1');
            var elem = "";
            if (elems != undefined && elems.length != 0) elem = elems[0];
            
            // set text
            // lower case site needed
            var text;
            try {
                if (isThatSite(site, "zh.wikipedia.org"))
                	// XPATH
                	// [XPath - MDN web docs](https://developer.mozilla.org/en-US/docs/Web/XPath)
                	// [Document: evaluate() method - MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate)
                    text = document.evaluate("text()", document.querySelector("#firstHeading"), null, XPathResult.STRING_TYPE).stringValue;
                    if (text == "") 
                    	text = document.querySelector("#firstHeading").firstChild.innerText;
                else if (isThatSite(site, "google.com")) {
                    // my selector
                    text = document.getElementsByTagName("input")[0].value;
                    // generate by Dev Tool -> Elements -> Popup -> Copy -> Copy JSPath
                    // text = document.querySelector("#tsf > div:nth-child(1) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input").value;
                } else if (isThatSite(site, "github.com")) {
                    var authorName;
                    var repoName;
                    var fileInRepo;
                    var fileName;
                    
                    authorName = document.querySelector(".AppHeader-context-full ul").querySelector("li>a");
                    if (authorName) authorName = authorName.innerText;
                    repoName = document.querySelector(".AppHeader-context-full ul").querySelector("li+li>a");
                    if (repoName) repoName = repoName.innerText;
                    fileInRepo = document.querySelector("#file-name-id");
                    fileName = (fileInRepo && fileInRepo.innerText) ? fileInRepo.innerText : "";
                    text = fileName + 
                            (fileName != "" ? ' - ' : "") + 
                            repoName + ' - ' + authorName;
                } else if (isThatSite(site, "sspai.com")) {
                    text = document.querySelector(".title").innerText;
                } else if (isThatSite(site, "zhuanlan.zhihu.com")) {
                    var authorName;
                    authorName = document.getElementsByClassName("AuthorInfo-head")[0].innerText;
                    text = elem.innerText + (elem.innerText != "" && authorName != "" ? ' - ' : '') + authorName;
                } else if (isThatSite(site, "space.bilibili.com")) {
                    var userName;
                    userName = document.querySelector("#h-name").innerText;
                    text = userName;
                } else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/video')) {
	                var title = document.querySelector(".video-title").innerText;
	                try {
                        var authorName;
                        authorName = document.querySelector(".up-name").innerText;
                        text = title + 
                            ((title != "" && authorName != "") ? ' - ' : '') + 
                            authorName;
                    } catch (e) {
                        try {
	                        var authorNames = '';
	                        document.querySelectorAll(".container .staff-name").forEach(each => {
								var name = each.innerText;
		                        if (authorNames != '') authorNames += ' & ';
		                        authorNames += name;
	                        });
	                        text = title + 
	                            ((title != "" && authorNames != "") ? ' - ' : '') + 
	                            authorNames;
	                    } catch (e) {
		                    // is this outdate? 
                      		// try {
		                    //    var authorName;
		                    //    authorName = document.querySelector(".username").innerText;
		                    //    text = title + (title != "" ? ' - ' : '') + authorName;
		                    //} catch (e) {
		                        
		                    //}
	                    }
                    }
                } else if (isThatSite(site, "weread.qq.com")) {
                    var bookName;
                    var authorName;
                    bookName = document.getElementsByClassName("bookInfo_right_header_title")[0].innerText;
                    authorName = document.getElementsByClassName("bookInfo_author link")[0].innerText;
                    text = bookName + (bookName != "" && authorName != "" ? ' - ' : '') + authorName;
                } else if (isThatSite(site, "book.douban.com")  && isThatPath(location.pathname, '/subject')) {
                    var bookName;
                    var authorName;
                    bookName = elem.innerText;
                    authorName = document.querySelector("#info > span:nth-child(1) > a").innerText;
                    text = bookName + (bookName != "" && authorName != "" ? ' - ' : '') + authorName;
                } else if (isThatSite(site, "runoob.com")) {
                    var tutorialName;
                    tutorialName = document.getElementsByTagName('h1')[1].innerText;
                    text = tutorialName;
                } else if (isThatSite(site, "youtube.com")) {
                    var vidioName;
                    var authorName;
                    vidioName = document.querySelector("#title > h1").innerText;
                    authorName = document.querySelector("#text > a").innerText;
                    text = vidioName + ' - ' + authorName;
                } else if (isThatSite(site, "news.ycombinator.com")) {
                    var titleText = document.querySelector(".titleline").innerText;
                    text = titleText;
                } else if (isThatSite(site, "www.pixiv.net")) {
                    try {
                        var titleText = document.querySelector("h1").innerText;
                        var authorText = document.querySelector("aside h2").innerText;
                        text = titleText + ' - ' + authorText;
                    } catch (e) {}
                } else if (isThatSite(site, "store.steampowered.com")) {
                    try {
                        var titleText = document.querySelector("#appHubAppName").innerText;
                        var authorText = document.querySelector("#developers_list").innerText;
                        text = titleText + ' - ' + authorText;
                    } catch (e) {}
                }
                else
                    text = elem.innerText;
            } catch (e) {console.log('content script autoChooseText() error\n', e);}
            
            if (text == undefined || text == "") return "";
            return text;
        }

        async function getSuffix() {
            var recognizedSite = await identifySite();
            if (recognizedSite == undefined || recognizedSite == "") return "";
            return " - " + recognizedSite;
        }

        async function identifySite() {
            var site;
            site = await identifySiteByURL();
            if ( site != "" ) return site;
            // site = identifySiteByTitle();
            // if ( site != "" ) return site;
            return "";
        }

        async function identifySiteByURL() {
            // lower case site needed
            // frequently access site, put it at head
            var response = await fetch(chrome.runtime.getURL('./data.json'));
            var json = await response.json();
            var knownSiteList = json.knownSiteList;
            var result = knownSiteList.find(siteContainer => {
                siteContainer.site = siteContainer.site.toLowerCase();
                return isThatSite(site, siteContainer.site);
                });
            if (result != undefined) return result["name"];
            return "";
        }

        function identifySiteByTitle() {
            var title = document.title;
            var loweredTitle = title.toLowerCase();
            var knownSiteNameList = [
                'Stack Overflow', 'Github', 'V2EX', '阮一峰的网络日志', '知乎', 'Google'
                ];
            var result = knownSiteNameList.find(element => loweredTitle.includes(element.toLowerCase()));
            if (result != undefined) return result;
            return "";
        }

        function getURL() {
            if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/video')) {
	            var res = '';
            	res += location.origin + location.pathname;
            	// try find p=... in params, assign to pBody if p exist
            	var params = location.search;
            	var pBody = findParamInParams('p', params);
            	if (pBody != '')
            		res += '?' + pBody;
                return res;
            }
            if (isThatSite(site, "space.bilibili.com"))
                return location.origin + location.pathname;
            return location.href;
        }

		// find p in ?p=13&d=14, return 'p=13'
		// NOT found, return ''
		function findParamInParams(param, params) {
			if (params.length == 0) return '';  // NOT found
			if (params[0] != '?') {
				params = '?' + params;
			}
			var paramAndEqualMark = param.endsWith('=') ? param : param + '=';
	        var cursor = 0;
        	while(true) {
            	if (cursor >= params.length) return '';  // NOT found
            	var curChar = params[cursor];
            	if (curChar != '?' && curChar != '&') 
            		throw new Error('URL params format error, expect start mark, but NOT');
            	var startMark = curChar;
            	var bodyStartIndex = cursor + 1;
            	var bodyEndIndex = getIndexOfEndExclusiveFromString(params, bodyStartIndex, '&');
            	var bodyLen = bodyEndIndex - bodyStartIndex;
            	if (bodyLen >= paramAndEqualMark.length + 1) {
	            	var bodySection = params.substr(bodyStartIndex, paramAndEqualMark.length);
	            	if (bodySection == paramAndEqualMark) {
		            	return params.substr(bodyStartIndex, bodyLen);  // found
	            	}
            	}
            	if (bodyEndIndex <= cursor) 
            		throw new Error('expect cursor increment, but NOT');
            	cursor = bodyEndIndex;
        	}
        }

        function getIndexOfEndExclusiveFromString(str, startIndex, endChar) {
	        var endIndexExclusive = str.length;
	        var cursor = startIndex;
	        while(true) {
		        if (cursor >= str.length) break;
		        var cur = str[cursor];
		        if (cur == endChar) {
			        endIndexExclusive = cursor;
			        break;
		        }
		        cursor++;
	        }
	        return endIndexExclusive;
        }
    } catch (e) {
        console.log('content script error\n', e); 
    }
}
