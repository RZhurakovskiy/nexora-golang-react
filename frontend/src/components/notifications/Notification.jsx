import { useEffect } from 'react'
import './Notification.css'

const Notification = ({ notification, onClose }) => {
	const { type = 'info', title, message, duration = 5000 } = notification

	useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				onClose()
			}, duration)
			return () => clearTimeout(timer)
		}
	}, [duration, onClose])

	const getIcon = () => {
		switch (type) {
			case 'success':
				return (
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
							fill="currentColor"
						/>
					</svg>
				)
			case 'error':
				return (
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
							fill="currentColor"
						/>
					</svg>
				)
			case 'warning':
				return (
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10 0L0 18H20L10 0ZM10 14C9.45 14 9 14.45 9 15C9 15.55 9.45 16 10 16C10.55 16 11 15.55 11 15C11 14.45 10.55 14 10 14ZM9 12H11V8H9V12Z"
							fill="currentColor"
						/>
					</svg>
				)
			default:
				return (
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
							fill="currentColor"
						/>
					</svg>
				)
		}
	}

	return (
		<div className={`notification notification--${type}`}>
			<div className="notification__icon">{getIcon()}</div>
			<div className="notification__content">
				{title && <div className="notification__title">{title}</div>}
				{message && <div className="notification__message">{message}</div>}
			</div>
			<button
				className="notification__close"
				onClick={onClose}
				aria-label="Закрыть уведомление"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 4L4 12M4 4L12 12"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					/>
				</svg>
			</button>
		</div>
	)
}

export default Notification



