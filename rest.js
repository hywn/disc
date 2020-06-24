const base_rest_url = 'https://discord.com/api'

/// <-- authorization header
/// <-- object { url: relative Discord API url, method: 'POST', 'GET', etc., body: request body }
/// ==> a fetch call to the described Discord API
const new_sender =
	authorization => ({ url: relative_url, method, body }) => {
		const options = {
			body,
			method,
			headers: { authorization }
		}

		if (typeof body === 'object') {
			options.body = JSON.stringify(body)
			options.headers['content-type'] = 'application/json'
		}

		return fetch(base_rest_url + relative_url, options)
	}

export default new_sender