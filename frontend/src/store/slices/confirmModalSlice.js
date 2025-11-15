import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	isOpen: false,
	title: '',
	message: '',
	confirmText: 'Подтвердить',
	cancelText: 'Отмена',
}

const confirmModalSlice = createSlice({
	name: 'confirmModal',
	initialState,
	reducers: {
		openConfirmModal: (state, action) => {
			state.isOpen = true
			state.title = action.payload.title || 'Подтверждение'
			state.message = action.payload.message || ''
			state.confirmText = action.payload.confirmText || 'Подтвердить'
			state.cancelText = action.payload.cancelText || 'Отмена'
		},
		closeConfirmModal: state => {
			state.isOpen = false
			state.title = ''
			state.message = ''
			state.confirmText = 'Подтвердить'
			state.cancelText = 'Отмена'
		},
	},
})

export const { openConfirmModal, closeConfirmModal } = confirmModalSlice.actions
export default confirmModalSlice.reducer



