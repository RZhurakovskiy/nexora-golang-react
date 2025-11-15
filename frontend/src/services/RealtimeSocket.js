export default class RealtimeSocket {
	constructor(url, { maxDelayMs = 10000 } = {}) {
		this.url = url
		this.maxDelayMs = maxDelayMs
		this.ws = null
		this.reconnectAttempts = 0
		this.reconnectTimer = null
		this.isStopped = false

		this.onOpen = null
		this.onMessage = null
		this.onError = null
		this.onClose = null
		this.onStatusChange = null
	}

	setHandlers({ onOpen, onMessage, onError, onClose, onStatusChange } = {}) {
		this.onOpen = onOpen || null
		this.onMessage = onMessage || null
		this.onError = onError || null
		this.onClose = onClose || null
		this.onStatusChange = onStatusChange || null
	}

	start() {
		this.isStopped = false
		this.connect()
	}

	stop() {
		this.isStopped = true
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		if (this.ws) {
			this.ws.onclose = null
			this.ws.onerror = null
			this.ws.onmessage = null
			this.ws.onopen = null

			if (
				this.ws.readyState === WebSocket.OPEN ||
				this.ws.readyState === WebSocket.CONNECTING
			) {
				this.ws.close()
			}
		}
		this.ws = null
	}

	send(data) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(data)
		}
	}

	connect() {
		if (this.isStopped) return
		try {
			this._setStatus('connecting')
			this.ws = new WebSocket(this.url)
		} catch (e) {
			this._scheduleReconnect()
			return
		}

		this.ws.onopen = () => {
			this._setStatus('connected')
			this.reconnectAttempts = 0
			if (this.onOpen) this.onOpen()
		}

		this.ws.onmessage = evt => {
			if (this.onMessage) this.onMessage(evt)
		}

		this.ws.onerror = err => {
			this._setStatus('reconnecting')
			if (this.onError) this.onError(err)
		}

		this.ws.onclose = () => {
			if (this.onClose) this.onClose()

			if (!this.isStopped) {
				this._scheduleReconnect()
			}
		}
	}

	_scheduleReconnect() {
		if (this.isStopped) return
		this._setStatus('reconnecting')
		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxDelayMs)
		this.reconnectAttempts++
		this.reconnectTimer = setTimeout(() => this.connect(), delay)
	}

	_setStatus(status) {
		if (this.onStatusChange) this.onStatusChange(status)
	}
}
