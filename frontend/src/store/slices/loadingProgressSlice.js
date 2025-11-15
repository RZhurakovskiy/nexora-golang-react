import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	progress: 0,
	isLoading: false,
	loadingSteps: {
		websocket: false,
		api: false,
	},
	stepWeights: {
		websocket: 70,
		api: 30,
	},
}

const loadingProgressSlice = createSlice({
	name: 'loadingProgress',
	initialState,
	reducers: {
		startLoading: state => {
			state.isLoading = true
			state.progress = 0
			state.loadingSteps = {
				websocket: false,
				api: false,
			}
		},
		setStepProgress: (state, action) => {
			const { step, progress } = action.payload
			if (step === 'websocket') {
				state.loadingSteps.websocket = progress >= 100

				state.progress = Math.min(
					(progress * state.stepWeights.websocket) / 100,
					70
				)
			} else if (step === 'api') {
				state.loadingSteps.api = progress >= 100

				const apiProgress = (progress * state.stepWeights.api) / 100
				state.progress = Math.min(70 + apiProgress, 100)
			}
		},
		setProgress: (state, action) => {
			state.progress = Math.min(Math.max(action.payload, 0), 100)
		},
		completeLoading: state => {
			state.isLoading = false
			state.progress = 100
			state.loadingSteps = {
				websocket: true,
				api: true,
			}
		},
		resetLoading: state => {
			state.isLoading = false
			state.progress = 0
			state.loadingSteps = {
				websocket: false,
				api: false,
			}
		},
	},
})

export const {
	startLoading,
	setStepProgress,
	setProgress,
	completeLoading,
	resetLoading,
} = loadingProgressSlice.actions
export default loadingProgressSlice.reducer
