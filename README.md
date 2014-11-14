### Custom pushNotifier

> I had a need to get push notifications for filtered (inbox skipped) messages in gmail

#### Usage

The script will take any gmail search query and send you a push notification using the handy [Pushover](https://pushover.net/) service.
~~~
node app.js -q "from(client@domain.com) is:unread"
~~~

### Technologies Integrated

> The goal for this project was to allow me to get notifications for messages I deem high priority.
>
> I tend to group messages by client/topic and force ones that come in frequently to skip my inbox (leaving my inbox for personal communications), sadly neither the gmail app or iOS mail app would allow me to `push` these filtered messages to my devices.
>
> - The `gmail` app doesn't push notifications from "skip inbox" filters.
> - The `iOS Mail` app doesnt allow for gmail push at all (thanks Google!)
