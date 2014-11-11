### Custom pushNotifier

> I had a need to get push notifications for filtered (inbox skipped) messages in gmail

#### Usage

The script will take any gmail search query and send you a push notification using the handy [Pushover](https://pushover.net/) service.
~~~
node app.js -q "from(client@domain.com) is:unread"
~~~

> Deeper documentation is incoming ...
