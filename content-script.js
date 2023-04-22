var verified_list = []
/* this whole section was using a naive HTML parse approach. Not ideal, HTML is easier for TWIT to change... */

// parentWalk = (element)=>{ //recursively walk up the parentElement tree to find the data we need
//   if(!element) return; //safety check...
//   var parent = element.parentElement
//   if(element.nodeName == 'A'){ //it's a link to the profile
//     username=element.getAttribute('href').slice(1)
//     if(!verified_list.includes(username))
//       verified_list.push(username);
//     return;
//   }
//   else if(element.nodeName=='ARTICLE') { //we've gone all the way up to the parent tweet
//     console.log('hit the top tweet', element) //need to go back down to find the embedded check...
//     return 
//   } else if(element.getAttribute('data-testid') == 'User-Name') {
//     username=element.querySelectorAll('span')[3].innerHTML.slice(1)
//     if(!verified_list.includes(username))
//       verified_list.push(username)
//     return
//   }
//   else {
//     parentWalk(parent)
//   }
// }

findVerified = () => { //finds blue checkmarks
  var verified_checks = document.querySelectorAll('[aria-label="Verified account"]')
  verified_checks.forEach((check)=>{
    if(check.firstChild.childElementCount==1 && !check.firstChild.firstChild.hasAttribute('fill'))
      parentWalk(check.parentElement)
  })
  // console.log(verified_list)
}

setInterval(()=>findVerified(),5000) // this is the naive HTML parsing/long polling approach
/* end the HTML parsing method */

/* XHR intercept / timeline object method */
var rawOpen = XMLHttpRequest.prototype.open;
//this part hooks into the XHRs so we can grab the TL Object
//mostly taken from SO https://stackoverflow.com/questions/16959359/intercept-xmlhttprequest-and-modify-responsetext
XMLHttpRequest.prototype.open = function() { 

	if (!this._hooked) {
		this._hooked = true;
		setupHook(this);
	}
	rawOpen.apply(this, arguments);
}


//functions to walk into the TL object and find blue checks
function parseHomeTL(hometlobj){
  tweets = hometlobj.data.home.home_timeline_urt.instructions[0].entries //dig for the tweet list

  tweets.forEach((tweet)=>{ // iterate through tweets on the TL object
    if(tweet.content.entryType == "TimelineTimelineItem"){ //weird entryType name...
      if(tweet,tweet.content.itemContent.tweet_results.result.core){ // some validation since the entries are so inconsistent
        user = tweet.content.itemContent.tweet_results.result.core.user_results.result //honestly this object is gnarly
        if(user.is_blue_verified && user.profile_image_shape!="Square") // use !="Square" to avoid "official"/business accounts
          console.log(user.legacy.screen_name,user) //should spit out blue check users. 

          //TODO: from here, take the blue check user object and fire off the block request
      }
    }
  })
  console.log(tweets) //dump the tweet list for debugging
}
//hook into the update req. Is this formatted differently?
function parseHomeLatestTL(homelatesttlobj){
  console.log(homelatesttlobj.data.home.home_timeline_urt.instructions[0].entries)
}


//the rest of the SO XHR hook
function setupHook(xhr) {
	function getter() {
		delete xhr.responseText;
		var ret = xhr.responseText;
    if(xhr.responseURL.includes("HomeTimeline")) // HomeTimeline request, brings us the timeline object
      parseHomeTL(JSON.parse(xhr.response))
    if(xhr.responseURL.includes("HomeLatestTimeline")){ // maybe updates are different?
      parseHomeLatestTL(JSON.parse(xhr.response))
      xhr.onprgress = console.log
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

