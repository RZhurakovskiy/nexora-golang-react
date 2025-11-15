import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import hostInfoService from '../../services/HostInfoService'

/**
 * Асинхронный thunk для получения информации об устройстве (например, CPU, ядра и т.д.)
 */
export const fetchDeviceInfo = createAsyncThunk(
	'deviceInfo/fetchDeviceInfo',
	async (_, { rejectWithValue }) => {
		try {
			const data = await hostInfoService.getDeviceInfo()
			return data
		} catch (error) {
			return rejectWithValue(
				error.message || 'Ошибка получения информации об устройстве'
			)
		}
	}
)

const initialState = {
	processname: null,
	cores: null,
	loading: false,
	error: null,
}

const deviceInfoSlice = createSlice({
	name: 'deviceInfo',
	initialState,
	reducers: {
		clearError: state => {
			state.error = null
		},
	},
	extraReducers: builder => {
		builder
			.addCase(fetchDeviceInfo.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchDeviceInfo.fulfilled, (state, action) => {
				state.loading = false
				state.processname = action.payload.processname
				state.cores = action.payload.cores
				state.error = null
			})
			.addCase(fetchDeviceInfo.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload
			})
	},
})

export const { clearError } = deviceInfoSlice.actions
export default deviceInfoSlice.reducer
