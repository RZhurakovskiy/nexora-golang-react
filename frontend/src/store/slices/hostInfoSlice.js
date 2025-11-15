import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import hostInfoService from '../../services/HostInfoService'

/**
 * Асинхронный thunk для получения информации о хосте и пользователе
 */
export const fetchHostInfo = createAsyncThunk(
	'hostInfo/fetchHostInfo',
	async (_, { rejectWithValue }) => {
		try {
			const data = await hostInfoService.getHostUsername()
			return data
		} catch (error) {
			return rejectWithValue(error.message || 'Ошибка получения информации о хосте')
		}
	}
)

const initialState = {
	username: null,
	hostname: null,
	loading: false,
	error: null,
}

const hostInfoSlice = createSlice({
	name: 'hostInfo',
	initialState,
	reducers: {
		clearError: state => {
			state.error = null
		},
	},
	extraReducers: builder => {
		builder
			.addCase(fetchHostInfo.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchHostInfo.fulfilled, (state, action) => {
				state.loading = false
				state.username = action.payload.username
				state.hostname = action.payload.hostname
				state.error = null
			})
			.addCase(fetchHostInfo.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload
			})
	},
})

export const { clearError } = hostInfoSlice.actions
export default hostInfoSlice.reducer



