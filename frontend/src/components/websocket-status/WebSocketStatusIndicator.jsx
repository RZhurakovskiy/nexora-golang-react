import './WebSocketStatusIndicator.css'

const WebSocketStatusIndicator = ({ status, label = 'WebSocket' }) => {
	const getStatusConfig = () => {
		switch (status) {
			case 'connected':
				return {
					text: 'Подключено',
					color: '#30d158',
					icon: (
						<svg width='8' height='8' viewBox='0 0 8 8' fill='none'>
							<circle cx='4' cy='4' r='4' fill='currentColor' />
						</svg>
					),
				}
			case 'connecting':
				return {
					text: 'Подключение...',
					color: '#ff9500',
					icon: (
						<svg width='8' height='8' viewBox='0 0 8 8' fill='none'>
							<circle
								cx='4'
								cy='4'
								r='3'
								stroke='currentColor'
								strokeWidth='2'
								fill='none'
							/>
						</svg>
					),
				}
			case 'reconnecting':
				return {
					text: 'Переподключение...',
					color: '#ff9500',
					icon: (
						<svg width='8' height='8' viewBox='0 0 8 8' fill='none'>
							<circle
								cx='4'
								cy='4'
								r='3'
								stroke='currentColor'
								strokeWidth='2'
								fill='none'
							/>
						</svg>
					),
				}
			case 'error':
				return {
					text: 'Ошибка',
					color: '#ff453a',
					icon: (
						<svg width='8' height='8' viewBox='0 0 8 8' fill='none'>
							<circle cx='4' cy='4' r='4' fill='currentColor' />
						</svg>
					),
				}
			case 'disconnected':
			default:
				return {
					text: 'Отключено',
					color: '#8e8e93',
					icon: (
						<svg width='8' height='8' viewBox='0 0 8 8' fill='none'>
							<circle
								cx='4'
								cy='4'
								r='3'
								stroke='currentColor'
								strokeWidth='2'
								fill='none'
							/>
						</svg>
					),
				}
		}
	}

	const config = getStatusConfig()

	return (
		<div className='ws-status-indicator'>
			<div
				className='ws-status-indicator__dot'
				style={{ color: config.color }}
				title={`${label}: ${config.text}`}
			>
				{config.icon}
			</div>
			<span className='ws-status-indicator__text'>{config.text}</span>
		</div>
	)
}

export default WebSocketStatusIndicator
