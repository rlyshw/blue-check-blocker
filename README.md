This is a really basic content-script chrome extension that will block Twitter Blue users as they load onto your TL.

The MVP is built. The blocks happen behind the scenes so you'll still see the blue check the first time they load up, but then they get blocked and won't load up on subsequent TL refreshses

schema/mock will have model json dumps pulled from a live tl object.
    tweet.json is a model schema of just one tweet object

quick and dirty front-end method to click all the unblock buttons
`document.querySelectorAll('[aria-label="Blocked"]').forEach((button)=>button.click())`