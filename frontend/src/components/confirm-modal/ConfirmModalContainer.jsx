import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { closeConfirmModal } from '../../store/slices/confirmModalSlice'
import ConfirmModal from './ConfirmModal'

// Глобальный объект для хранения callback'ов вне Redux state
const confirmModalCallbacks = {
	onConfirm: null,
	onCancel: null,
}

export const setConfirmModalCallbacks = (onConfirm, onCancel) => {
	confirmModalCallbacks.onConfirm = onConfirm
	confirmModalCallbacks.onCancel = onCancel
}

const ConfirmModalContainer = () => {
	const dispatch = useAppDispatch()
	const { isOpen, title, message, confirmText, cancelText } =
		useAppSelector(state => state.confirmModal)

	const handleConfirm = () => {
		if (confirmModalCallbacks.onConfirm) {
			confirmModalCallbacks.onConfirm()
		}
		confirmModalCallbacks.onConfirm = null
		confirmModalCallbacks.onCancel = null
		dispatch(closeConfirmModal())
	}

	const handleCancel = () => {
		if (confirmModalCallbacks.onCancel) {
			confirmModalCallbacks.onCancel()
		}
		confirmModalCallbacks.onConfirm = null
		confirmModalCallbacks.onCancel = null
		dispatch(closeConfirmModal())
	}

	return (
		<ConfirmModal
			isOpen={isOpen}
			title={title}
			message={message}
			confirmText={confirmText}
			cancelText={cancelText}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
		/>
	)
}

export default ConfirmModalContainer



