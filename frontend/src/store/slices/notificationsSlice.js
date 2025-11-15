import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	notifications: [],
}

const notificationsSlice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {
		addNotification: (state, action) => {
			const notification = {
				id: Date.now() + Math.random(),
				...action.payload,
				timestamp: Date.now(),
			}
			state.notifications.push(notification)
		},
		removeNotification: (state, action) => {
			state.notifications = state.notifications.filter(
				n => n.id !== action.payload
			)
		},
		clearAllNotifications: state => {
			state.notifications = []
		},
	},
})

export const { addNotification, removeNotification, clearAllNotifications } =
	notificationsSlice.actions

export default notificationsSlice.reducer



