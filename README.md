disc
=====
light JavaScript wrapper around Discord API written on top of Deno


goals
------
- provide a *light* wrapper around Discord API
- abstract away the *most general* details of the API (e.g. WebSocket and authentication) and nothing more
- have minimal and readable code


example
--------
the following is a bot that replies to 'ping' DMs with a 'pong' and 🙂 reaction
```javascript
import std_sender from './rest_std.js'
import std_discorder from './sock_std.js'
import { new_dispatch_listener } from '../disc/sock_std.js'

const token = 'my bot token'

const sender = std_sender(`Bot ${token}`)
const bot = await std_discorder(token)(1 << 12)

const responder = new_dispatch_listener('MESSAGE_CREATE')(({ d: { content, channel_id, id } }) => {

	if (content === 'ping') {
		sender.create_message(channel_id)('pong')
		sender.create_reaction(channel_id)(id)('🙂')
	}

})

await bot.listen(responder)
```
note: it would be nicer if the program Promise.raced SIGINT and called bot.kill() but idrk how to do that


TODO
-----
- handle gateway [error codes](https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-close-event-codes)
- handle dropped connections