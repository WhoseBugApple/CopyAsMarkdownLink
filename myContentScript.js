// convention: return "" instead of undefined if error

try {
    // console.log("my content script is running");

    // infos
    var site = location.hostname.toLowerCase();
    if (site.endsWith('/')) site = site.substring(0, site.length-1);

    // copy content
    var selected = getSelectionText();
    var suffix = getSuffix();
    var url = getURL();

    var toCopy = `[${selected}${suffix}](${url})`;
    
    // console.log(toCopy);

    // write to clipboard
    // only HTTPS could use this API
    // check is HTTPS with window.isSecureContext
    navigator.clipboard.writeText(toCopy);

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
                text = elem.firstChild.innerText;
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
                authorName = document.getElementsByClassName("author")[0].innerText;
                repoName = document.querySelector(".mr-2.flex-self-stretch").innerText;
                fileInRepo = document.querySelector(".final-path");
                fileName = fileInRepo != undefined ? fileInRepo.innerText : "";
                text = fileName + 
                        fileName != "" ? ' - ' : "" + 
                        repoName + ' - ' + authorName;
            } else if (isThatSite(site, "sspai.com")) {
                text = document.querySelector("#article-title").innerText;
            } else if (isThatSite(site, "zhuanlan.zhihu.com")) {
                var authorName;
                authorName = document.getElementsByClassName("AuthorInfo-head")[0].innerText;
                text = elem.innerText + (elem.innerText != "" && authorName != "" ? ' - ' : '') + authorName;
            } else if (isThatSite(site, "space.bilibili.com")) {
                var userName;
                userName = document.querySelector("#h-name").innerText;
                text = userName;
            } else if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/video')) {
                var authorName;
                authorName = document.querySelector(".username").innerText;
                text = elem.lastChild.innerText + (elem.innerText != "" ? ' - ' : '') + authorName;
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
            }
            else
                text = elem.innerText;
        } catch (e) {console.log('content script autoChooseText() error'); console.log(e);}
        
        if (text == undefined || text == "") return "";
        return text;
    }

    function getSuffix() {
        var recognizedSite = recognizeSite();
        if (recognizedSite == undefined || recognizedSite == "") return "";
        return " - " + recognizedSite;
    }

    function recognizeSite() {
        var site;
        site = recognizeSiteByURL();
        if ( site != "" ) return site;
        site = recognizeSiteByTitle();
        if ( site != "" ) return site;
        return "";
    }

    function recognizeSiteByURL() {
        // lower case site needed
        // frequently access site, put it at head
        var knownSiteList = [
            {'site': 'google.com', 'name': 'Google'}, 
            {'site': 'zh.wikipedia.org', 'name': '维基百科'}, 
            {'site': 'wikipedia.org', 'name': 'wikipedia'}, 
            {'site': 'stackoverflow.com', 'name': 'Stack Overflow'}, 
            {'site': 'github.com', 'name': 'Github'}, 
            {'site': 'v2ex.com', 'name': 'V2EX'}, 
            {'site': 'ruanyifeng.com', 'name': '阮一峰的网络日志'}, 
            {'site': 'space.bilibili.com', 'name': 'Bilibili User Space'}, 
            {'site': 'bilibili.com', 'name': 'Bilibili'}, 
            {'site': 'oracle.com', 'name': 'Oracle'}, 
            {'site': 'sspai.com', 'name': '少数派'}, 
            {'site': 'zhihu.com', 'name': '知乎'}, 
            {'site': 'weread.qq.com', 'name': '微信读书'}, 
            {'site': 'douban.com', 'name': '豆瓣'}, 
            {'site': 'runoob.com', 'name': '菜鸟教程'}, 
            {'site': 'cppreference.com', 'name': 'cppreference'}, 
            {'site': 'cplusplus.com', 'name': 'cplusplus'}, 
            {'site': 'microsoft.com', 'name': 'Microsoft'}, 
            {'site': 'developer.mozilla.org', 'name': 'MDN web docs'}
            ];
        var result = knownSiteList.find(element => {
            element.site = element.site.toLowerCase();
            return isThatSite(site, element.site);
            });
        if (result != undefined) return result["name"];
        return "";
    }

    function recognizeSiteByTitle() {
        return "";
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
        if (isThatSite(site, "bilibili.com") && isThatPath(location.pathname, '/video'))
            return location.origin + location.pathname;
        return location.href;
    }

} catch (e) {console.log('content script error'); console.log(e);}
