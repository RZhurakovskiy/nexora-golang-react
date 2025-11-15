import { useEffect } from 'react'
import './ConfirmModal.css'

const ConfirmModal = ({
	isOpen,
	title,
	message,
	confirmText,
	cancelText,
	onConfirm,
	onCancel,
}) => {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	if (!isOpen) return null

	const handleConfirm = () => {
		if (onConfirm) {
			onConfirm()
		}
	}

	const handleCancel = () => {
		if (onCancel) {
			onCancel()
		}
	}

	const handleBackdropClick = e => {
		if (e.target === e.currentTarget) {
			handleCancel()
		}
	}

	return (
		<div className='confirm-modal-backdrop' onClick={handleBackdropClick}>
			<div className='confirm-modal'>
				<div className='confirm-modal__header'>
					<div className='confirm-modal__icon'>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z'
								fill='currentColor'
							/>
						</svg>
					</div>
					<h2 className='confirm-modal__title'>{title}</h2>
				</div>
				<div className='confirm-modal__body'>
					<p className='confirm-modal__message'>
						{message.split('\n').map((line, index) => (
							<span key={index}>
								{line}
								{index < message.split('\n').length - 1 && <br />}
							</span>
						))}
					</p>
				</div>
				<div className='confirm-modal__footer'>
					<button
						className='confirm-modal__button confirm-modal__button--cancel'
						onClick={handleCancel}
					>
						{cancelText}
					</button>
					<button
						className='confirm-modal__button confirm-modal__button--confirm'
						onClick={handleConfirm}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	)
}

export default ConfirmModal
