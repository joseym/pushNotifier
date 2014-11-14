### Custom pushNotifier

- [Mail Check Explaination](https://github.com/joseym/pushNotifier/tree/master/mailcheck)

> I had a need to get push notifications for filtered (inbox skipped) messages in gmail
>
> The goal for this project was to allow me to get notifications for messages I deem high priority.
>
> I tend to group messages by client/topic and force ones that come in frequently to skip my inbox (leaving my inbox for personal communications), sadly neither the gmail app or iOS mail app would allow me to `push` these filtered messages to my devices.
>
> - The `gmail` app doesn't push notifications from "skip inbox" filters.
> - The `iOS Mail` app doesnt allow for gmail push at all (thanks Google!)
>
> I was missing messages, or not responding hastily - as a self employed contractor this was not a good thing.

#### Usage

The script will take any gmail search query and send you a push notification using the handy [Pushover](https://pushover.net/) service.
~~~
node app.js -q "from(client@domain.com) is:unread"
~~~

##### Options

Parameter   | Purpose | Usage
----------- | --------| -----------
-q          | The gmail query to poll against | "from(*@tulsajs.com) is:unread"
-c          | Clear tokens (start fresh) | `n/a`
-t          | Define a polling time | -t 3000

### Technologies Integrated

- [node.js](http://nodejs.org/)
- [Express](http://expressjs.com/)
  - For the initial API token auth
- [Redis](http://redis.io/)
  - For basic data storage (persistent tokens)
- [Pushover](https://pushover.net/)
- [GMail API](https://developers.google.com/gmail/api/)
- [Forever CLI](https://github.com/nodejitsu/forever) _optional_
- [Heroku](http://heroku.com) _optional_
