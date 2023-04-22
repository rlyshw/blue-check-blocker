// this is the HTML parsing method.
// NOT using this because you can't easily extrapolate USER_ID from the UI.
//   might revisit, do a "click the three buttons, click the block button, OK OK"
// findVerified = () => { //finds blue checkmarks
//   var verified_checks = document.querySelectorAll('[aria-label="Verified account"]')
//   verified_checks.forEach((check)=>{
//     if(check.firstChild.childElementCount==1 && !check.firstChild.firstChild.hasAttribute('fill'))
//       parentWalk(check.parentElement)
//   })
// }

// setInterval(()=>findVerified(),5000) // this is the naive HTML parsing/long polling approach
/* end the HTML parsing method */

/* XHR intercept / timeline object method */
var rawOpen = XMLHttpRequest.prototype.open;

//this part hooks into the XHRs so we can grab the TL Object
//mostly taken from SO https://stackoverflow.com/questions/16959359/intercept-xmlhttprequest-and-modify-responsetext
XMLHttpRequest.prototype.open = function() { 
	if (!this._hooked) {
		this._hooked = true;
		setupOpenHook(this);
	}
	rawOpen.apply(this, arguments);
}
//the rest of the SO XHR hook
function setupOpenHook(xhr) { //TODO: Clean this up, don't actually need to hook for any mods
	function getter() {
		delete xhr.responseText;
		var ret = xhr.responseText;
    // console.log("log xhr and xhr.response",xhr,JSON.parse(xhr.response))
    if(xhr.responseURL.includes("HomeTimeline") || xhr.responseURL.includes("HomeLatestTimeLine")) // HomeTimeline request, brings us the timeline object
      parseHomeTL(JSON.parse(xhr.response))
    if(xhr.responseURL.includes("BlockedAccounts")){
      getBlockedList(JSON.parse(xhr.response))
    }
    
		setup();
		return ret;
	}

	function setter(str) {
		console.log('set responseText: %s', str); //not using this, initial SO code was for intercepting/rewriting req/responses
	}

	function setup() {
		Object.defineProperty(xhr, 'responseText', {
			get: getter,
			set: setter,
			configurable: true
		});
	}
	setup();
}

var rawSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
var modHeaders = {
  "accept": "*/*",
  "accept-language": "en-US,en;q=0.9,de;q=0.8",
  "authorization": "",
  "cache-control": "no-cache",
  "content-type": "application/x-www-form-urlencoded",
  "pragma": "no-cache",
  "x-csrf-token": "",
  "x-twitter-active-user": "yes",
  "x-twitter-auth-type": "OAuth2Session",
  "x-twitter-client-language": "en"
}
XMLHttpRequest.prototype.setRequestHeader = function() {
  if(arguments[0]=="authorization") modHeaders.authorization = arguments[1]
  if(arguments[0]=="x-csrf-token") modHeaders["x-csrf-token"] = arguments[1]
  rawSetRequestHeader.apply(this,arguments)
}

//functions to walk into the TL object and find blue checks
function parseHomeTL(hometlobj){
  tweets = hometlobj.data.home.home_timeline_urt.instructions[0].entries //dig for the tweet list

  tweets.forEach((tweet)=>{ // iterate through tweets on the TL object
    if(tweet.content.entryType == "TimelineTimelineItem"){ //weird entryType name...
      if(tweet,tweet.content.itemContent.tweet_results.result.core){ // some validation since the entries are so inconsistent
        user = tweet.content.itemContent.tweet_results.result.core.user_results.result //honestly this object is gnarly
        if(user.is_blue_verified && user.profile_image_shape!="Square"){ // use !="Square" to avoid "official"/business accounts
          console.log("blocking",user.legacy.screen_name) //should spit out blue check users. 
          block(user.rest_id)
        }
      }
    }
  })
}


getBlockedList = (data) => {
  console.log(data)
}

// this is the xhr that kicks off a block
// I think a lot of these headers are probably required. Need to scrape them off other requests from the XHR hook
block = (userId) => {
  fetch("https://twitter.com/i/api/1.1/blocks/create.json", {
    "headers": modHeaders,
    "body": "user_id="+userId,
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then(console.log("Blocked!"));
}
