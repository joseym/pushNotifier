### Mail Check Module

> This module handles all of the backend transactions with Googles GMail API.

#### Methods and Purpose

- [Authenticate](https://github.com/joseym/pushNotifier/blob/master/mailcheck/mailcheck.js#L167) - Authenticate user against Google API
  - If a token exists this method will call refresh, otherwise it will generate a new access token and require user acceptance.
- [Token Refresh](https://github.com/joseym/pushNotifier/blob/master/mailcheck/mailcheck.js#L195) - Refreshes an existing user token, giving it more longevity.
  - Upon success this method will emit the `startPolling` event, which ... starts the mail polling.
- [Generate Access Token](https://github.com/joseym/pushNotifier/blob/master/mailcheck/mailcheck.js#L241) - Fired from `Auth` if a token doesn't exist.
  - This method will hit google to create an access `code`
  - Once the code is generated you are redirected to your redirection point.
  - The frontend portion (express, running on heroku) of the script caches the code.
  - Once the code is stored the backend will use it to generate a new `request` and `refresh` token.
- [Get Messages](https://github.com/joseym/pushNotifier/blob/master/mailcheck/mailcheck.js#L293) - Request new messages
  - This method is fired from our `startPolling` event, it hits the Google API
  - If results match your query then the script `emmits` the `new` event.

#### Notable `Handle` Methods

> I extrapolated many "handlers" from the methods above to ease readability.
>
> This may have ended up being counterproductive.

- [cheatExpiry](https://github.com/joseym/pushNotifier/blob/master/mailcheck/mailcheck.js#L131)
  - This method is fired from `Get Messages`.
  - I store the token expiration, and check against it.
  - This methods purpose is to force a token refresh before the API can emit an error about expiration.
- [getNewToken](https://github.com/joseym/pushNotifier/blob/master/mailcheck/mailcheck.js#L102)
  - This method is fired from `Generate Access Token`
  - This method handles the magic behind generating a new access token.
- [listEmails](https://github.com/joseym/pushNotifier/blob/master/mailcheck/mailcheck.js#L48)
  - This method is fired from `Get Messages`.
  - This method determines if the new count is different than it was upon last check.
  - It also catches `rate limit` errors and initiates [`Exponential Backoff`](http://en.wikipedia.org/wiki/Exponential_backoff) if necessary. 
