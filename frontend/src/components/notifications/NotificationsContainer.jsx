import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { removeNotification } from '../../store/slices/notificationsSlice'
import Notification from './Notification'
import './Notification.css'

const NotificationsContainer = () => {
	const dispatch = useAppDispatch()
	const notifications = useAppSelector(state => state.notifications.notifications)

	if (notifications.length === 0) {
		return null
	}

	return (
		<div className="notifications-container">
			{notifications.map(notification => (
				<Notification
					key={notification.id}
					notification={notification}
					onClose={() => dispatch(removeNotification(notification.id))}
				/>
			))}
		</div>
	)
}

export default NotificationsContainer



