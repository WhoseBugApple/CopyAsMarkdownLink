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
		let site = location.hostname.toLowerCase();
		if (site.endsWith('/')) site = site.substring(0, site.length-1);

		// copy content
		let selected = getSelectionText();
		let suffix = await getSuffix();
		let url = getURL();

		let toCopy = `[${selected}${suffix}](${url})`;
		
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

		//  preprocess: if that path /video then change to /video/
		//  /video/   is /video/
		//  /video	is /video/
		//  /video/1  is /video/
		//  /vide	 is NOT /video/
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
		//  /@1	continue /@
		//  /@123  continue /@
		//  /@/	NOT continue /@
		//  /@/123 NOT continue /@
		//  /@	 NOT continue /@
		function isContinueThatPathBeforeSplit(thePath, thatPath) {
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
			let sourceText = "";
			let i = 0;
			let charsNeedBackslash = "\\|_*~#$%^&()<>";
			for (; i<toDisplayText.length; i++) {
				let c = toDisplayText.charAt(i);
				let sourC = "";
				if (charsNeedBackslash.includes(c)) sourC = '\\' + c;
				else sourC = c;
				sourceText += sourC;
			}
			return sourceText;
		}

		function getSelectionText() {
			let text = "";
			let windowSelected;
			let documentSelected;
			if (window.getSelection && (windowSelected=window.getSelection().toString()) != "") {
				text = windowSelected;
			} else if (document.selection && document.selection.type != "Control" && 
									(documentSelected = document.selection.createRange().text) != "") {
				text = documentSelected;
			} else {
				let autoChoosed = autoChooseText();
				if (autoChoosed != "") text = autoChoosed;
			}
			text = removeGarbageCharacter(text);
			text = toDisplayTextToSourceText(text);
			return text;
		}

		function autoChooseText() {
			let firstVisualH1Text = "";
			{
				let h1s = document.querySelectorAll("h1");
				let i = 0;
				for (i=0; i<h1s.length; i++) {
					let h1 = h1s[i];
					let styles = h1.computedStyleMap();
					let displayStyle = styles.get("display").value;
					if (displayStyle == "none") continue;
					let h1Text = h1.outerText;
					let h1TrimedText = h1Text.trim();
					if (h1TrimedText == "") continue;
					firstVisualH1Text = h1Text;
					break;
				}
			}
			
			// set text
			// lower case site needed
			let text;
			try {
				if (isThatSite(site, "zh.wikipedia.org")) {
					let titleText;
					// XPATH
					// [XPath - MDN web docs](https://developer.mozilla.org/en-US/docs/Web/XPath)
					// [Document: evaluate() method - MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate)
					if (!titleText || titleText == "") titleText = document.evaluate("text()", document.querySelector("#firstHeading"), null, XPathResult.STRING_TYPE)?.stringValue;
					if (!titleText || titleText == "") titleText = document.querySelector("#firstHeading")?.firstChild?.outerText;
					if (!titleText || titleText == "") titleText = document.querySelector("#firstHeading")?.querySelector("span")?.outerText;
					if (!titleText) titleText = "";
					text = titleText;
				} else if (isThatSite(site, "google.com") && isThatPath(location.pathname, '/search/')) {
					// my selector
					text = document.querySelector("textarea").value;
					// generate by Dev Tool -> Elements -> Popup -> Copy -> Copy JSPath
					// text = document.querySelector("#tsf > div:nth-child(1) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input").value;
				} else if (isThatSite(site, "github.com")) {
					let fileName;
					if (!fileName || fileName == "") fileName = document.querySelector("#file-name-id")?.outerText;
					if (!fileName || fileName == "") fileName = document.querySelector("#file-name-id-wide")?.outerText;
					if (!fileName || fileName == "") fileName = "";
					let repoName = document.querySelector("#repository-container-header [itemprop=\"name\"]").outerText;
					let authorName = document.querySelector("#repository-container-header [itemprop=\"author\"]").outerText;
					text = connectText(connectText(fileName, repoName), authorName);
				} else if (isThatSite(site, "sspai.com")) {
					text = document.querySelector(".title").outerText;
				} else if (isThatSite(site, "zhuanlan.zhihu.com")) {
					let authorText = document.getElementsByClassName("AuthorInfo-head")[0].outerText;
					text = connectText(h1Text, authorText);
				} else if (isThatSite(site, "daily.zhihu.com")) {
					let titleText = document.querySelector(".DailyHeader-title").outerText;
					let authorText = document.querySelector(".ZhihuDaily-Author").outerText;
					text = connectText(titleText, authorText);
				} else if (isThatSite(site, "space.bilibili.com")) {
					let userName = document.querySelector("#h-name").outerText;
					text = userName;
				} else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/video/')) {
					let pageText = '';
					try {
						pageText = document.querySelector("#multi_page .on").outerText;
					} catch(e) {}
					let titleText = document.querySelector(".video-title").outerText;
					try {
						let authorText = document.querySelector(".up-info-container .up-name").outerText;
						text = connectText(connectText(pageText, titleText), authorText);
					} catch (e) {
						try {
							let authorTexts = '';
							document.querySelectorAll(".container .staff-name").forEach(each => {
								let name = each.outerText;
								if (authorTexts != '') authorTexts += ' & ';
								authorTexts += name;
							});
							text = connectText(connectText(pageText, titleText), authorTexts);
						} catch (e) {
							// ...
						}
					}
				} else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/audio/')) {
					let songNameText = document.querySelector('.song-title').outerText;
					text = songNameText;
				} else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/opus/')) {
					// 这是动态文章
					let timeText = document.querySelector('.opus-module-author__pub').outerText;
					let articleText = document.querySelector('.opus-module-content').outerText;
					let authorText = document.querySelector('.opus-module-author__name').outerText;
					text = connectText(timeText, connectText(articleText, authorText));
				} else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/read/readlist/')) {
					// 这是专栏列表
					let titleText = document.querySelector('.title').outerText;
					let authorText = document.querySelector('.list-container .up-name').outerText;
					text = connectText(titleText, authorText);
				} else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/read/')) {
					// 这是专栏文章
					let titleText = document.querySelector('.title').outerText;
					let authorText = document.querySelector('.article-detail .up-name').outerText;
					text = connectText(titleText, authorText);
				} else if (isThatSite(site, "weread.qq.com")) {
					let bookName = document.getElementsByClassName("bookInfo_right_header_title")[0].outerText;
					let authorName = document.getElementsByClassName("bookInfo_author link")[0].outerText;
					text = connectText(bookName, authorName);
				} else if (isThatSite(site, "book.douban.com")  && isThatPath(location.pathname, '/subject/')) {
					let bookName = h1Text;
					let authorName = document.querySelector("#info > span:nth-child(1) > a").outerText;
					text = connectText(bookName, authorName);
				} else if (isThatSite(site, "runoob.com")) {
					let tutorialName = document.getElementsByTagName('h1')[1].outerText;
					text = tutorialName;
				} else if (isThatSite(site, "youtube.com") && isThatPath(location.pathname, '/watch/')) {
					let videoName = document.querySelector("#title > h1").outerText;
					let authorName = document.querySelector("#text > a").outerText;
					text = connectText(videoName, authorName);
				} else if (isThatSite(site, "youtube.com") && isContinueThatPathBeforeSplit(location.pathname, '/@')) {
					let authorName = '';
					if (!authorName || authorName == '') {
						authorName = document.querySelector("#channel-name").outerText.trim();
					}
					if (!authorName || authorName == '') {
						authorName = document.querySelector("#page-header h1").outerText.trim();
					}
					let userSpaceMark = 'User Space';
					text = connectText(authorName, userSpaceMark);
				} else if (isThatSite(site, "youtube.com") && isThatPath(location.pathname, '/playlist/')) {
					let playListName = document.querySelector(".immersive-header-container #text").outerText;
					let authorName = document.querySelector(".immersive-header-container #owner-text").outerText;
					let playListMark = 'Playlist';
					text = connectText(connectText(playListName, authorName), playListMark);
				} else if (isThatSite(site, "youtube.com") && isThatPath(location.pathname, '/channel/')) {
					let channelText = document.querySelector("#channel-name #text").outerText;
					let channelMark = 'Channel';
					text = connectText(channelText, channelMark);
				} else if (isThatSite(site, "news.ycombinator.com")) {
					let titleText = document.querySelector(".titleline").outerText;
					text = titleText;
				} else if (isThatSite(site, "www.pixiv.net")) {
					try {
						let titleText = document.querySelector("h1").outerText;
						let authorText = document.querySelector("aside h2").outerText;
						text = connectText(titleText, authorText);
					} catch (e) {}
				} else if (isThatSite(site, "www.deviantart.com")) {
					try {
						let titleText = document.querySelector("h1").outerText;
						let authorText = document.querySelector(".user-link > span:nth-of-type(1)").outerText;
						text = connectText(titleText, authorText);
					} catch (e) {}
				} else if (isThatSite(site, "store.steampowered.com")) {
					try {
						let titleText = document.querySelector("#appHubAppName").outerText;
						let authorText = document.querySelector("#developers_list").outerText;
						text = connectText(titleText, authorText);
					} catch (e) {}
				} else if (isThatSite(site, "keylol.com")) {
					try {
						let titleText = document.querySelector("#thread_subject").outerText;
						let authorText = document.querySelector(".authi").outerText;
						text = connectText(titleText, authorText);
					} catch (e) {}
				} else if (isThatSite(site, "twitter.com") || isThatSite(site, "x.com")) {
					try {
						let timesInArticle = document.querySelector("article").querySelectorAll("time");
						let time = timesInArticle[timesInArticle.length-1];
						let timeText = time.outerText;
						let authorText = document.querySelector("article span").outerText;
						text = connectText(timeText, authorText);
					} catch (e) {}
				} else if (isThatSite(site, "youxiputao.com")) {
					try {
						let titleText = document.querySelector("h2").outerText;
						text = titleText;
					} catch (e) {}
				} else if (isThatSite(site, "gouhuo.qq.com")) {
					try {
						let titleText = document.querySelector("h2").outerText;
						text = titleText;
					} catch (e) {}
				} else if (isThatSite(site, "apod.nasa.gov") && isContinueThatPathBeforeSplit(location.pathname, '/apod/ap')) {
					try {
						let titleText = document.querySelector("body > center:nth-child(2) > b:nth-child(1)").outerText;
						let timeText = '';
						if (timeText == '') {
							try {
								timeText = document.evaluate("../../text()", document.querySelector("img"), null, XPathResult.STRING_TYPE)?.stringValue;
							} catch (e) {}
						}
						if (timeText == '') {
							try {
								timeText = document.evaluate("../text()", document.querySelector("iframe"), null, XPathResult.STRING_TYPE)?.stringValue;
							} catch (e) {}
						}
						if (timeText == '') {
							throw new Error('failed to get time from webpage');
						}
						text = connectText(titleText, timeText);
					} catch (e) {}
				} else if (isThatSite(site, "itch.io")) {
					try {
						let titleText = document.querySelector(".game_title").outerText;
						let infoTable = document.querySelector(".more_information_toggle table");
						let infos = infoTable.querySelectorAll("tr");
						let authorText = '';
						if (authorText == '') {
							try {
								// try to contact 6th row, if it's author info, get it, else do nothing
								if (infos[5].querySelector("td:nth-child(1)").outerText.toLowerCase() == 'author') {
									authorText = infos[5].querySelector("td:nth-child(2)").outerText;
								}
							} catch (e) {
								authorText = '';
							}
						}
						if (authorText == '') {
							try {
								// try to search all row, if meet author info, get it, else do nothing
								let i = 0;
								for (i=0; i<infos.length; i++) {
									let info = infos[i];
									if (info.querySelector("td:nth-child(1)").outerText.toLowerCase() == 'author') {
										authorText = info.querySelector("td:nth-child(2)").outerText;
										break;
									}
								}
							} catch (e) {
								authorText = '';
							}
						}
						text = connectText(titleText, authorText);
					} catch (e) {}
				} else if (		(isThatSite(site, "bangumi.tv") || isThatSite(site, "bgm.tv"))
								&& isThatPath(location.pathname, '/user/')) {
					try {
						let userNameText = document.querySelector(".name>:nth-child(1)").outerText;
						let userIdText = document.querySelector(".name>:nth-child(2)").outerText;
						let userText = connectText(userNameText, userIdText, ' ');
						let userSpaceMark = 'User Space';
						text = connectText(userText, userSpaceMark);
					} catch (e) {}
				} else if (isThatSite(site, "tieba.baidu.com") && isThatPath(location.pathname, '/p/')) {
					let titleText = document.querySelector('.core_title_txt').outerText;
					let authorText = document.querySelector('.d_author .d_name').outerText;
					let barText = document.querySelector('.card_title_fname').outerText;
					text = connectText(connectText(titleText, authorText), barText);
				} else if (isThatSite(site, "soundcloud.com")) {
					let emptyText = '';
					let maybeText = emptyText;
					if (maybeText == emptyText) {
						try {
							let authorText = document.querySelector('.profileHeaderInfo__userName').outerText;
							let userSpaceMark = 'User Space';
							maybeText = connectText(authorText, userSpaceMark);
						} catch (e) {}
					}
					if (maybeText == emptyText) {
						try {
							let soundText = document.querySelector('.soundTitle__title').outerText;
							let authorText = document.querySelector('.soundTitle__username').outerText;
							maybeText = connectText(soundText, authorText);
						} catch (e) {}
					}
					text = maybeText;
				} else if (isThatSite(site, "woshipm.com")) {
					let titleText = document.querySelector('.article--title').outerText;
					text = titleText;
				} else if (isThatSite(site, "www.cnblogs.com")) {
					let titleText = document.querySelector('.postTitle').outerText;
					let authorText = document.querySelector('#profile_block>a').outerText;
					text = connectText(titleText, authorText);
				} else if (isThatSite(site, "bandcamp.com")) {
					let titleText = document.querySelector('.trackTitle').outerText;
					let authorText = document.querySelector('#band-name-location>.title').outerText;
					text = connectText(titleText, authorText);
				} else if (isThatSite(site, "bbs.oldmantvg.net")) {
					let titleText = document.querySelector('h4').outerText;
					let authorText = document.querySelector('.card-user-info h5').outerText;
					text = connectText(titleText, authorText);
				} else if (isThatSite(site, "reddit.com") && isThatPath(location.pathname, '/r/')) {
					let titleText = document.querySelector('h1').outerText;
					let authorText = document.querySelector('.author-name').outerText;
					let subredditText = document.querySelector('.subreddit-name').outerText;
					text = connectText(connectText(titleText, authorText), subredditText);
				}
				else {
					text = firstVisualH1Text;
				}
			} catch (e) {console.log('content script autoChooseText() error\n', e);}

			if (!text) text = "";
			return text;
		}

		function connectText(text1, text2, connectionMark = ' - ') {
			text1 = text1.trim();
			text2 = text2.trim();
			return	text1 == "" ? text2 : 
					text2 == "" ? text1 : 
					text1 + connectionMark + text2;
		}

		async function getSuffix() {
			let recognizedSite = await identifySite();
			if (recognizedSite == undefined || recognizedSite == "") return "";
			return " - " + recognizedSite;
		}

		async function identifySite() {
			let site;
			site = await identifySiteByURL();
			if ( site != "" ) return site;
			// site = identifySiteByTitle();
			// if ( site != "" ) return site;
			return "";
		}

		async function identifySiteByURL() {
			// lower case site needed
			// frequently access site, put it at head
			let response = await fetch(chrome.runtime.getURL('./data.json'));
			let json = await response.json();
			let knownSiteList = json.knownSiteList;
			knownSiteList = knownSiteList.sort((a, b) => b.site.length - a.site.length);
			let result = knownSiteList.find(siteContainer => {
				siteContainer.site = siteContainer.site.toLowerCase();
				return isThatSite(site, siteContainer.site);
				});
			if (result != undefined) return result["name"];
			return "";
		}

		function identifySiteByTitle() {
			let title = document.title;
			let loweredTitle = title.toLowerCase();
			let knownSiteNameList = [
				'Stack Overflow', 'Github', 'V2EX', '阮一峰的网络日志', '知乎', 'Google'
				];
			let result = knownSiteNameList.find(element => loweredTitle.includes(element.toLowerCase()));
			if (result != undefined) return result;
			return "";
		}

		function getURL() {
			if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/video')) {
				let res = '';
				res += location.origin + location.pathname;
				// try find p=... in params, assign to pBody if p exist
				let params = location.search;
				let pBody = findParamInParams('p', params);
				if (pBody != '')
					res += '?' + pBody;
				res = urlEncodeRoundBrackets(res);
				return res;
			} else if (isThatSite(site, "bilibili.com")) {
				let res = location.origin + location.pathname + removeParamInParams("spm_id_from", location.search);
				res = urlEncodeRoundBrackets(res);
				return res;
			} else {
				let res = location.href;
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
			let paramAndEqualMark = param.endsWith('=') ? param : param + '=';
			let cursor = 0;
			while(true) {
				if (cursor >= params.length) return '';  // NOT found
				let curChar = params[cursor];
				if (curChar != '?' && curChar != '&') 
					throw new Error('URL params format error, expect start mark, but NOT');
				let startMark = curChar;
				let bodyStartIndex = cursor + 1;
				let bodyEndIndex = getIndexOfEndExclusiveFromString(params, bodyStartIndex, '&');
				let bodyLen = bodyEndIndex - bodyStartIndex;
				if (bodyLen >= paramAndEqualMark.length + 1) {
					let partOfBody = params.substr(bodyStartIndex, paramAndEqualMark.length);
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
			let paramAndEqualMark = param.endsWith('=') ? param : param + '=';
			let cursor = 0;
			let result = '';
			while(true) {
				// 1. check if there is more work to do
				// 2. try locate the param
				// 3. found OR reach the end
				// 4. improve result, according to this loop
				// 5. continue next loop
				
				if (cursor >= params.length) break;  // no more work

				let partOfResultStartIndex = cursor;
				let partOfResultEndIndex;
				while(true) {
					if (cursor >= params.length) {
						partOfResultEndIndex = params.length;
						break;
					}
					
					let curChar = params[cursor];
					if (curChar != '?' && curChar != '&') 
						throw new Error('URL params format error, expect start mark, but NOT');
					let startMark = curChar;
					let startIndex = cursor;
					let bodyStartIndex = startIndex + 1;
					let bodyEndIndex = getIndexOfEndExclusiveFromString(params, bodyStartIndex, '&');
					if (bodyEndIndex <= cursor) 
						throw new Error('expect cursor increment, but NOT');
					let bodyLen = bodyEndIndex - bodyStartIndex;
					
					let partOfBody = params.substr(bodyStartIndex, paramAndEqualMark.length);
					if (partOfBody == paramAndEqualMark) {
						partOfResultEndIndex = startIndex;
						cursor = bodyEndIndex;
						break;
					}
					
					cursor = bodyEndIndex;
				}

				let partOfResultLength = partOfResultEndIndex - partOfResultStartIndex;
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
			let endIndexExclusive = str.length;
			let cursor = startIndex;
			while(true) {
				if (cursor >= str.length) break;
				let cur = str[cursor];
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
