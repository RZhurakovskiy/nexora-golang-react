import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import ApiService from '../../services/ApiService'

const apiService = new ApiService()

export const fetchMonitoringStatus = createAsyncThunk(
	'monitoring/fetchStatus',
	async (_, { rejectWithValue }) => {
		try {
			const response = await apiService.get('/api/monitoring-status')
			return response
		} catch (error) {
			console.error('Ошибка получения состояния мониторинга:', error)
			return rejectWithValue(
				error.message || 'Не удалось получить состояние мониторинга'
			)
		}
	}
)

export const setMonitoringStatus = createAsyncThunk(
	'monitoring/setStatus',
	async (enabled, { rejectWithValue }) => {
		try {
			const response = await apiService.post('/api/monitoring-status', {
				enabled,
			})
			console.log('Мониторинг установлен:', response)
			return response
		} catch (error) {
			console.error('Ошибка установки состояния мониторинга:', error)
			return rejectWithValue(
				error.message || 'Не удалось установить состояние мониторинга'
			)
		}
	}
)

const initialState = {
	enabled: false,
	loading: false,
	error: null,
}

const monitoringSlice = createSlice({
	name: 'monitoring',
	initialState,
	reducers: {
		setMonitoringEnabled: (state, action) => {
			state.enabled = action.payload
		},
	},
	extraReducers: builder => {
		builder

			.addCase(fetchMonitoringStatus.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchMonitoringStatus.fulfilled, (state, action) => {
				state.loading = false
				state.enabled = action.payload.enabled || false
			})
			.addCase(fetchMonitoringStatus.rejected, (state, action) => {
				state.loading = false
				state.error = action.error.message
			})

			.addCase(setMonitoringStatus.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(setMonitoringStatus.fulfilled, (state, action) => {
				state.loading = false
				state.enabled = action.payload.enabled || false
			})
			.addCase(setMonitoringStatus.rejected, (state, action) => {
				state.loading = false
				state.error = action.error.message
			})
	},
})

export const { setMonitoringEnabled } = monitoringSlice.actions
export default monitoringSlice.reducer
