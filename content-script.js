var verified_list = []
parentWalk = (element)=>{ //recursively walk up the parentElement tree to find the data we need
  if(!element) return; //safety check...
  var parent = element.parentElement
  if(element.nodeName == 'A'){ //it's a link to the profile
    username=element.getAttribute('href').slice(1)
    if(!verified_list.includes(username))
      verified_list.push(username);
    return;
  }
  else if(element.nodeName=='ARTICLE') { //we've gone all the way up to the parent tweet
    console.log('hit the top tweet', element) //need to go back down to find the embedded check...
    return 
  } else if(element.getAttribute('data-testid') == 'User-Name') {
    username=element.querySelectorAll('span')[3].innerHTML.slice(1)
    if(!verified_list.includes(username))
      verified_list.push(username)
    return
  }
  else {
    parentWalk(parent)
  }
}

findVerified = () => { //finds blue checkmarks
  var verified_checks = document.querySelectorAll('[aria-label="Verified account"]')
  verified_checks.forEach((check)=>{
    if(check.firstChild.childElementCount==1 && !check.firstChild.firstChild.hasAttribute('fill'))
      parentWalk(check.parentElement)
  })
  console.log(verified_list)
}

setInterval(()=>findVerified(),5000)

var rawOpen = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function() {
	if (!this._hooked) {
		this._hooked = true;
		setupHook(this);
	}
	rawOpen.apply(this, arguments);
}

function parseHomeTL(hometlobj){
  tweets = hometlobj.data.home.home_timeline_urt.instructions[0].entries

  tweets.forEach((tweet)=>{
    if(tweet.content.entryType == "TimelineTimelineItem"){
      if(tweet,tweet.content.itemContent.tweet_results.result.core){
        user = tweet.content.itemContent.tweet_results.result.core.user_results.result
        if(user.is_blue_verified && user.profile_image_shape!="Square") console.log(user.legacy.screen_name,user)
      }
    }
  })
  console.log(tweets)
}
function parseHomeLatestTL(homelatesttlobj){
  console.log(homelatesttlobj.data.home.home_timeline_urt.instructions[0].entries)
}

function setupHook(xhr) {
	function getter() {
		delete xhr.responseText;
		var ret = xhr.responseText;
    console.log(xhr.responseURL)
    if(xhr.responseURL.includes("HomeTimeline"))
      parseHomeTL(JSON.parse(xhr.response))
    if(xhr.responseURL.includes("HomeLatestTimeline")){
      parseHomeLatestTL(JSON.parse(xhr.response))
      xhr.onprgress = console.log
    }
		setup();
		return ret;
	}

	function setter(str) {
		console.log('set responseText: %s', str);
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

// fetch("https://twitter.com/i/api/graphql/7JUXeanO9cYvjKvaPe7EMg/HomeTimeline", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9,de;q=0.8",
//     "content-type": "application/json",
//   },
//   "referrer": "https://twitter.com/home",
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "method": "POST",
//   "mode": "cors",
//   "credentials": "include"
// }).then(console.log)
