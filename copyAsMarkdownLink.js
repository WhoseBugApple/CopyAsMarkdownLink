// the normal script

// convention: return "" instead of undefined if error

// reference
// [Rich notifications API](https://developer.chrome.com/docs/extensions/mv3/richNotifications/#basic)
// [chrome.notifications](https://developer.chrome.com/docs/extensions/reference/notifications/#method-create)
// [Error when using chrome.notifications.create "Uncaught TypeError: Cannot read property 'create' of undefined"](https://stackoverflow.com/questions/34912279/error-when-using-chrome-notifications-create-uncaught-typeerror-cannot-read-pr)
// [Message passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)

main();

async function main() {
	await main_noTimeLimit();
}

async function main_timeLimited() {
	try {
		console.log("CopyAsMarkdownLink: start");
		await copy_timeLimited();
		const response = await chrome.runtime.sendMessage("copy success");
	} catch (e) {
		console.log("CopyAsMarkdownLink: error thrown: ");
		console.log(e);
		const response = await chrome.runtime.sendMessage("copy fail:" + e.toString());
	} finally {
		console.log("CopyAsMarkdownLink: end");
	}
}

function copy_timeLimited() {
	return new Promise(
		(resolve, reject) => {
			try {
				setTimeout(reject, 3000, "timeout");
				idle().then(
					() => {
						waitLoad().then(
							() => {
								afterLoad().then(
									resolve
								).catch(reject);
							}
						).catch(reject);
					}
				).catch(reject);
			} catch (e) {
				reject(e);
			}
		}
	);
}

async function main_noTimeLimit() {
	try {
		console.log("CopyAsMarkdownLink: start");
	    await idle();
	    await waitLoad();
		await afterLoad();
        const response = await chrome.runtime.sendMessage("copy success");
	} catch (e) {
		console.log("CopyAsMarkdownLink: error thrown: ");
		console.log(e);
		const response = await chrome.runtime.sendMessage("copy fail:" + e.toString());
	} finally {
		console.log("CopyAsMarkdownLink: end");
	}
}

// await me to immediately return a async function
async function idle() {}

function waitLoad() {
	return new Promise(
		(resolve, reject) => {
			if (document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", resolve);
				setTimeout(reject, 3000, "timeout");
			} else {
				resolve();
			}
		}
	);
}

async function afterLoad() {
    try {
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




        function isThatSite(theSite, isThatSite) {
            if (theSite.length >= isThatSite.length)
                if ( theSite.length == isThatSite.length )
                    return theSite == isThatSite;
                else
                    return theSite.endsWith('.' + isThatSite);
            return false;
        }

		//  /video/   is /video/
		//  /video    is /video/
		//  /video/1  is /video/
		//  /vide     is NOT /video/
		//  /vide/1   is NOT /video/
		//  /videos   is NOT /video/
		//  /videos/1 is NOT /video/
        function isThatPath(thePath, isThatPath) {
            if (!thePath.startsWith("/")) thePath = "/" + thePath;
            if (!isThatPath.startsWith("/")) isThatPath = "/" + isThatPath;
            if (!thePath.endsWith("/")) thePath = thePath + "/";
            if (!isThatPath.endsWith("/")) isThatPath = isThatPath + "/";
            if (thePath.length >= isThatPath.length)
                return thePath.startsWith(isThatPath);
            return false;
        }

		// thatPath should NOT ends with /
		//  /@1    continue /@
		//  /@123  continue /@
		//  /@/    NOT continue /@
		//  /@/123 NOT continue /@
		//  /@     NOT continue /@
        function isContinueThatPathWithoutSplit(thePath, thatPath) {
            if (!thePath.startsWith("/")) thePath = "/" + thePath;
            if (!thatPath.startsWith("/")) thatPath = "/" + thatPath;
            if (!thePath.endsWith("/")) thePath = thePath + "/";
            if (thePath.length > thatPath.length && thePath.startsWith(thatPath))
	            if (thePath[thatPath.length] != "/")
		            return true;
            return false;
        }

        function removeGarbageCharacter(text) {
            if (text == undefined) return "";
            // remove link symbol emoji the char of unicode codepoint 128279 0x1F517 UTF16 BE D83D DD17
            text = text.replace(/\uD83D\uDD17/g, '');
            // remove emoji
            text = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, ' ? ');
            // remove Zero-Width Char
            text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
            // remove [ ]
            text = text.replace(/[\[\]]/g, ' ');
            // handle new line
            // remove new line at head
            text = text.replace(/^[ \t]*(?:(?:\r\n)|(?:\n))(?:(?:(?:\r\n)|(?:\n))|[ \t])*/g, "");
            // remove new line at tail
            text = text.replace(/[ \t]*(?:(?:\r\n)|(?:\n))(?:(?:(?:\r\n)|(?:\n))|[ \t])*$/g, "");
            // replace remain new line to ~
            text = text.replace(/[ \t]*(?:(?:\r\n)|(?:\n))(?:(?:(?:\r\n)|(?:\n))|[ \t])*/g, " ~ ");
            // n space to 1 space
            text = text.replace(/[ \t]+/g, " ");
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
            var h1 = document.querySelector("h1");
            var h1Text = "";
            if (h1) h1Text = h1.innerText;
            
            // set text
            // lower case site needed
            var text;
            try {
                if (isThatSite(site, "zh.wikipedia.org")) {
					var titleText;
					// XPATH
                	// [XPath - MDN web docs](https://developer.mozilla.org/en-US/docs/Web/XPath)
                	// [Document: evaluate() method - MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate)
					if (!titleText || titleText == "") titleText = document.evaluate("text()", document.querySelector("#firstHeading"), null, XPathResult.STRING_TYPE)?.stringValue;
					if (!titleText || titleText == "") titleText = document.querySelector("#firstHeading")?.firstChild?.innerText;
					if (!titleText || titleText == "") titleText = document.querySelector("#firstHeading")?.querySelector("span")?.innerText;
					if (!titleText) titleText = "";
                    text = titleText;
                } else if (isThatSite(site, "google.com") && isThatPath(location.pathname, '/search')) {
                    // my selector
                    text = document.querySelector("textarea").value;
                    // generate by Dev Tool -> Elements -> Popup -> Copy -> Copy JSPath
                    // text = document.querySelector("#tsf > div:nth-child(1) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input").value;
                } else if (isThatSite(site, "github.com")) {
	                var fileName;
	                if (!fileName || fileName == "") fileName = document.querySelector("#file-name-id")?.innerText;
	                if (!fileName || fileName == "") fileName = document.querySelector("#file-name-id-wide")?.innerText;
                    if (!fileName || fileName == "") fileName = "";
                    var repoName = document.querySelector(".AppHeader-context-full ul").querySelector("li+li>a").innerText;
                    var authorName = document.querySelector(".AppHeader-context-full ul").querySelector("li>a").innerText;
                    text = connectText(connectText(fileName, repoName), authorName);
                } else if (isThatSite(site, "sspai.com")) {
                    text = document.querySelector(".title").innerText;
                } else if (isThatSite(site, "zhuanlan.zhihu.com")) {
                    var authorText = document.getElementsByClassName("AuthorInfo-head")[0].innerText;
                    text = connectText(h1Text, authorText);
                } else if (isThatSite(site, "daily.zhihu.com")) {
	                var titleText = document.querySelector(".DailyHeader-title").innerText;
	                var authorText = document.querySelector(".ZhihuDaily-Author").innerText;
                    text = connectText(titleText, authorText);
                } else if (isThatSite(site, "space.bilibili.com")) {
                    var userName = document.querySelector("#h-name").innerText;
                    text = userName;
                } else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/video')) {
	                var titleText = document.querySelector(".video-title").innerText;
	                try {
                        var authorText = document.querySelector(".up-info-container .up-name").innerText;
                        text = connectText(titleText, authorText);
                    } catch (e) {
                        try {
	                        var authorTexts = '';
	                        document.querySelectorAll(".container .staff-name").forEach(each => {
								var name = each.innerText;
		                        if (authorTexts != '') authorTexts += ' & ';
		                        authorTexts += name;
	                        });
	                        text = connectText(titleText, authorTexts);
	                    } catch (e) {
		                    // ...
	                    }
                    }
                } else if (isThatSite(site, "weread.qq.com")) {
                    var bookName = document.getElementsByClassName("bookInfo_right_header_title")[0].innerText;
                    var authorName = document.getElementsByClassName("bookInfo_author link")[0].innerText;
                    text = connectText(bookName, authorName);
                } else if (isThatSite(site, "book.douban.com")  && isThatPath(location.pathname, '/subject')) {
                    var bookName = h1Text;
                    var authorName = document.querySelector("#info > span:nth-child(1) > a").innerText;
                    text = connectText(bookName, authorName);
                } else if (isThatSite(site, "runoob.com")) {
                    var tutorialName = document.getElementsByTagName('h1')[1].innerText;
                    text = tutorialName;
                } else if (isThatSite(site, "youtube.com") && isThatPath(location.pathname, '/watch')) {
                    var videoName = document.querySelector("#title > h1").innerText;
                    var authorName = document.querySelector("#text > a").innerText;
                    text = connectText(videoName, authorName);
                } else if (isThatSite(site, "youtube.com") && isContinueThatPathWithoutSplit(location.pathname, '/@')) {
                    var authorName = document.querySelector("#channel-name").innerText;
                    var userSpaceMark = 'User Space';
                    text = connectText(authorName, userSpaceMark);
                } else if (isThatSite(site, "youtube.com") && isThatPath(location.pathname, '/playlist')) {
                    var playListName = document.querySelector(".immersive-header-container #text").innerText;
                    var authorName = document.querySelector(".immersive-header-container #owner-text").innerText;
                    var playListMark = 'Playlist';
                    text = connectText(connectText(playListName, authorName), playListMark);
                } else if (isThatSite(site, "news.ycombinator.com")) {
                    var titleText = document.querySelector(".titleline").innerText;
                    text = titleText;
                } else if (isThatSite(site, "www.pixiv.net")) {
                    try {
                        var titleText = document.querySelector("h1").innerText;
                        var authorText = document.querySelector("aside h2").innerText;
                        text = connectText(titleText, authorText);
                    } catch (e) {}
                } else if (isThatSite(site, "store.steampowered.com")) {
                    try {
                        var titleText = document.querySelector("#appHubAppName").innerText;
                        var authorText = document.querySelector("#developers_list").innerText;
                        text = connectText(titleText, authorText);
                    } catch (e) {}
                } else if (isThatSite(site, "keylol.com")) {
                    try {
                        var titleText = document.querySelector("#thread_subject").innerText;
                        var authorText = document.querySelector(".authi").innerText;
                        text = connectText(titleText, authorText);
                    } catch (e) {}
                } else if (isThatSite(site, "twitter.com")) {
                    try {
	                    var timesInArticle = document.querySelector("article").querySelectorAll("time");
	                    var time = timesInArticle[timesInArticle.length-1];
	                    var timeText = time.innerText;
                        var authorText = document.querySelector("article span").innerText;
                        text = connectText(timeText, authorText);
                    } catch (e) {}
                } else if (isThatSite(site, "youxiputao.com")) {
                    try {
	                    var titleText = document.querySelector("h2").innerText;
                        text = titleText;
                    } catch (e) {}
                } else if (isThatSite(site, "gouhuo.qq.com")) {
                    try {
	                    var titleText = document.querySelector("h2").innerText;
                        text = titleText;
                    } catch (e) {}
                } 
                else {
	                text = h1Text;
                }
            } catch (e) {console.log('content script autoChooseText() error\n', e);}

            if (!text) text = "";
            return text;
        }

		function connectText(text1, text2) {
			return	text1 == "" ? text2 : 
					text2 == "" ? text1 : 
					text1 + ' - ' + text2;
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
            	res = urlEncodeRoundBrackets(res);
                return res;
            } else if (isThatSite(site, "bilibili.com")) {
	            var res = location.origin + location.pathname + removeParamInParams("spm_id_from", location.search);
	            res = urlEncodeRoundBrackets(res);
	            return res;
            } else {
	            var res = location.href;
            	res = urlEncodeRoundBrackets(res);
            	return res;
            }
        }

		// find p in ?p=13&d=14, return 'p=13'
		// NOT found, return ''
		// only first match is returned
		// case sensitive
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
	            	var partOfBody = params.substr(bodyStartIndex, paramAndEqualMark.length);
	            	if (partOfBody == paramAndEqualMark) {
		            	return params.substr(bodyStartIndex, bodyLen);  // found
	            	}
            	}
            	if (bodyEndIndex <= cursor) 
            		throw new Error('expect cursor increment, but NOT');
            	cursor = bodyEndIndex;
        	}
        }

		// remove that param, if multiple match, remove all matched, return result
		// case sensitive
		function removeParamInParams(param, params) {
			if (params.length == 0) return '';  // NOT found
			if (params[0] != '?') {
				params = '?' + params;
			}
			var paramAndEqualMark = param.endsWith('=') ? param : param + '=';
	        var cursor = 0;
	        var result = '';
        	while(true) {
	        	// 1. check if there is more work to do
	        	// 2. try locate the param
	        	// 3. found OR reach the end
	        	// 4. improve result, according to this loop
	        	// 5. continue next loop
	        	
            	if (cursor >= params.length) break;  // no more work

				var partOfResultStartIndex = cursor;
				var partOfResultEndIndex;
            	while(true) {
	            	if (cursor >= params.length) {
		            	partOfResultEndIndex = params.length;
		            	break;
	            	}
	            	
	            	var curChar = params[cursor];
	            	if (curChar != '?' && curChar != '&') 
	            		throw new Error('URL params format error, expect start mark, but NOT');
	            	var startMark = curChar;
	            	var startIndex = cursor;
	            	var bodyStartIndex = startIndex + 1;
	            	var bodyEndIndex = getIndexOfEndExclusiveFromString(params, bodyStartIndex, '&');
	            	if (bodyEndIndex <= cursor) 
	            		throw new Error('expect cursor increment, but NOT');
	            	var bodyLen = bodyEndIndex - bodyStartIndex;
	            	
	            	var partOfBody = params.substr(bodyStartIndex, paramAndEqualMark.length);
	            	if (partOfBody == paramAndEqualMark) {
						partOfResultEndIndex = startIndex;
		            	cursor = bodyEndIndex;
		            	break;
	            	}
	            	
	            	cursor = bodyEndIndex;
            	}

            	var partOfResultLength = partOfResultEndIndex - partOfResultStartIndex;
            	result += params.substr(partOfResultStartIndex, partOfResultLength);
        	}
        	
        	if (result.length > 0) {
	        	if (result[0] == '&') result = '?' + result.substr(1);
        	}
        	return result;
        }

		function urlEncodeRoundBrackets(url) {
			url = url.replace(/\(/g, '%28');
        	url = url.replace(/\)/g, '%29');
        	return url;
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
        // console.log('content script error\n', e); 
        throw e;
    }
}
