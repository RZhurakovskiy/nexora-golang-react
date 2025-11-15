import { configureStore } from '@reduxjs/toolkit'
import confirmModalReducer from './slices/confirmModalSlice'
import cpuReducer from './slices/cpuSlice'
import deviceInfoReducer from './slices/deviceInfoSlice'
import hostInfoReducer from './slices/hostInfoSlice'
import loadingProgressReducer from './slices/loadingProgressSlice'
import memoryReducer from './slices/memorySlice'
import monitoringReducer from './slices/monitoringSlice'
import notificationsReducer from './slices/notificationsSlice'
import processesReducer from './slices/processesSlice'

export const store = configureStore({
	reducer: {
		hostInfo: hostInfoReducer,
		processes: processesReducer,
		cpu: cpuReducer,
		memory: memoryReducer,
		notifications: notificationsReducer,
		confirmModal: confirmModalReducer,
		loadingProgress: loadingProgressReducer,
		monitoring: monitoringReducer,
		deviceInfo: deviceInfoReducer,
	},
})
