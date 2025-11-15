import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import processService from '../../services/ProcessService'

/**
 * Асинхронный thunk для завершения процесса
 */
export const killProcess = createAsyncThunk(
	'processes/killProcess',
	async (pid, { rejectWithValue }) => {
		try {
			const data = await processService.killProcessById(pid)
			return { pid, message: data.message }
		} catch (error) {
			return rejectWithValue(error.message || 'Ошибка завершения процесса')
		}
	}
)

const initialState = {
	processes: [],
	wsStatus: 'disconnected',
	isInitialLoading: true,
	error: null,
}

const processesSlice = createSlice({
	name: 'processes',
	initialState,
	reducers: {
		setProcesses: (state, action) => {
			state.processes = action.payload
			state.wsStatus = 'connected'

			if (action.payload && action.payload.length > 0) {
				state.isInitialLoading = false
			}
		},
		setWsStatus: (state, action) => {
			state.wsStatus = action.payload
		},
		setInitialLoading: (state, action) => {
			state.isInitialLoading = action.payload
		},
		clearError: state => {
			state.error = null
		},
		clearProcesses: state => {
			state.processes = []
		},
	},
	extraReducers: builder => {
		builder
			.addCase(killProcess.pending, state => {
				state.error = null
			})
			.addCase(killProcess.fulfilled, (state, action) => {
				state.error = null
			})
			.addCase(killProcess.rejected, (state, action) => {
				state.error = action.payload
			})
	},
})

export const {
	setProcesses,
	setWsStatus,
	setInitialLoading,
	clearError,
	clearProcesses,
} = processesSlice.actions
export default processesSlice.reducer
