import {
	app,
	BrowserWindow,
	ipcMain,
	Menu,
	nativeImage,
	Notification,
	shell,
	Tray,
} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, format as formatUrl } from 'node:url'

if (process.platform === 'linux') {
	app.commandLine.appendSwitch('--no-sandbox')
	app.commandLine.appendSwitch('--disable-setuid-sandbox')

	app.commandLine.appendSwitch('--enable-features', 'TrayIcon')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null
let tray = null
let lastNotificationTime = 0

const getResourcePath = fileName => {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, 'assets', fileName)
	} else {
		return path.join(__dirname, 'assets', fileName)
	}
}

const loadTrayIcon = fileName => {
	const iconPath = getResourcePath(fileName)
	if (!fs.existsSync(iconPath)) {
		console.error(`[Tray Icon] File not found: ${iconPath}`)
		return null
	}

	console.log(`[Tray Icon] Loading: ${iconPath}`)
	const image = nativeImage.createFromPath(iconPath)
	if (image.isEmpty()) {
		console.error(`[Tray Icon] Failed to load image: ${iconPath}`)
		return null
	}

	const size = image.getSize()
	console.log(`[Tray Icon] Image size: ${size.width}x${size.height}`)

	if (process.platform === 'linux') {
		const targetSizes = [22, 24, 16]
		let processedImage = image

		if (!targetSizes.includes(size.width) || size.width !== size.height) {
			console.log(`[Tray Icon] Resizing to 22x22 for Linux`)
			processedImage = image.resize({ width: 22, height: 22 })
		}

		return processedImage
	}

	return image
}

const getTrayIconPath = fileName => {
	return getResourcePath(fileName)
}

const getTrayIconFileName = isHighLoad => {
	if (process.platform === 'linux') {
		return isHighLoad ? 'cpu-high-linux.png' : 'cpu-normal-linux.png'
	}
	return isHighLoad ? 'cpu-high.png' : 'cpu-normal.png'
}

function createMainWindow() {
	const window = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: app.isPackaged
				? path.join(__dirname, 'preload.js')
				: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			sandbox: false,
		},
		show: false,
		webSecurity: true,
	})

	const indexPath = app.isPackaged
		? path.join(__dirname, '../dist/index.html')
		: path.join(__dirname, '../../dist/index.html')

	const indexHtml = formatUrl({
		pathname: indexPath,
		protocol: 'file',
		slashes: true,
	})

	window.loadURL(indexHtml)

	window.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url)
		return { action: 'deny' }
	})

	window.once('ready-to-show', () => {
		window.show()
	})

	window.on('closed', () => {
		mainWindow = null
	})

	return window
}

app.whenReady().then(async () => {
	mainWindow = createMainWindow()

	console.log('[Notifications] Platform:', process.platform)
	console.log('[Notifications] Supported:', Notification.isSupported())

	if (process.platform === 'linux') {
		console.log('[Notifications] Linux detected, will use Notification API')
	}

	const iconFileName = getTrayIconFileName(false)
	console.log(`[Tray] Creating tray with icon: ${iconFileName}`)

	let icon = loadTrayIcon(iconFileName)

	if (!icon) {
		console.warn('[Tray] Icon not loaded, trying alternative approach')

		if (process.platform === 'linux') {
			const iconPath = getTrayIconPath(iconFileName)
			if (fs.existsSync(iconPath)) {
				console.log(`[Tray] Using direct path: ${iconPath}`)
				tray = new Tray(iconPath)
			} else {
				console.error('[Tray] Icon path does not exist, using placeholder')
				tray = new Tray(nativeImage.createEmpty())
			}
		} else {
			tray = new Tray(nativeImage.createEmpty())
		}
	} else {
		if (process.platform === 'linux') {
			try {
				tray = new Tray(icon)
				console.log('[Tray] Created with nativeImage')
			} catch (error) {
				console.warn(
					'[Tray] Failed with nativeImage, trying path:',
					error.message
				)

				const iconPath = getTrayIconPath(iconFileName)
				tray = new Tray(iconPath)
				console.log('[Tray] Created with path')
			}
		} else {
			tray = new Tray(icon)
		}
	}

	if (!tray) {
		console.error('[Tray] Failed to create tray icon!')
		return
	}

	console.log('[Tray] Tray created successfully')
	tray.setToolTip('GoVigil — мониторинг системы')

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Открыть приложение',
			click: () => {
				if (mainWindow) {
					mainWindow.show()
					mainWindow.focus()
				}
			},
		},
		{
			label: 'Скрыть приложение',
			click: () => {
				mainWindow?.hide()
			},
		},
		{ label: 'Выход', click: () => app.quit() },
	])
	tray.setContextMenu(contextMenu)

	mainWindow.on('close', e => {
		if (process.platform !== 'darwin') {
			e.preventDefault()
			mainWindow.hide()
		}
	})

	tray.on('double-click', () => {
		if (mainWindow) {
			mainWindow.show()
			mainWindow.focus()
		}
	})
})

ipcMain.on('cpu-load-update', (event, cpuLoad) => {
	if (!tray) {
		console.warn('[Tray] Tray not initialized, skipping update')
		return
	}

	const isHighLoad = cpuLoad > 70
	const fileName = getTrayIconFileName(isHighLoad)

	if (process.platform === 'linux') {
		const image = loadTrayIcon(fileName)
		if (image) {
			try {
				tray.setImage(image)
			} catch (error) {
				console.warn(
					'[Tray] Failed to set image with nativeImage, trying path:',
					error.message
				)
				const iconPath = getTrayIconPath(fileName)
				if (fs.existsSync(iconPath)) {
					tray.setImage(iconPath)
				}
			}
		} else {
			const iconPath = getTrayIconPath(fileName)
			if (fs.existsSync(iconPath)) {
				tray.setImage(iconPath)
			}
		}
	} else {
		const image = loadTrayIcon(fileName)
		if (image) {
			tray.setImage(image)
		}
	}

	const now = Date.now()
	if (isHighLoad && now - lastNotificationTime > 30000) {
		lastNotificationTime = now
		showNotification(cpuLoad)
	}
})

function showNotification(cpuLoad) {
	console.log(
		`[Notification] Attempting to show notification for CPU: ${cpuLoad}%`
	)

	if (!Notification.isSupported()) {
		console.warn('[Notification] Not supported on this platform')

		if (process.platform === 'linux' && tray?.isBalloonSupported?.()) {
			console.log('[Notification] Trying displayBalloon fallback')
			tray.displayBalloon({
				icon: loadTrayIcon('cpu-high-linux.png')?.toBitmap?.() || undefined,
				title: 'Высокая загрузка CPU!',
				content: `CPU: ${cpuLoad}% — проверьте процессы.`,
			})
		}
		return
	}

	try {
		const iconFileName =
			process.platform === 'linux' ? 'cpu-high-linux.png' : 'cpu-high.png'

		const notificationOptions = {
			title: 'Высокая загрузка CPU!',
			body: `Текущая нагрузка: ${cpuLoad}%`,
			silent: false,
		}

		if (process.platform === 'linux') {
			const iconPath = getTrayIconPath(iconFileName)
			if (fs.existsSync(iconPath)) {
				notificationOptions.icon = iconPath
				console.log(`[Notification] Using icon path: ${iconPath}`)
			}
		} else {
			const notificationIcon = loadTrayIcon(iconFileName)
			if (notificationIcon) {
				notificationOptions.icon = notificationIcon
			}
		}

		console.log('[Notification] Creating notification with options:', {
			title: notificationOptions.title,
			body: notificationOptions.body,
			hasIcon: !!notificationOptions.icon,
		})

		const notification = new Notification(notificationOptions)

		notification.on('click', () => {
			console.log('[Notification] Clicked')
			if (mainWindow) {
				mainWindow.show()
				mainWindow.focus()
			}
		})

		notification.on('show', () => {
			console.log('[Notification] Shown successfully')
		})

		notification.on('error', error => {
			console.error('[Notification] Error event:', error)
		})

		notification.show()
		console.log('[Notification] show() called')
	} catch (error) {
		console.error('[Notification] Exception:', error)

		if (process.platform === 'linux' && tray?.isBalloonSupported?.()) {
			console.log('[Notification] Trying displayBalloon as fallback')
			tray.displayBalloon({
				icon: loadTrayIcon('cpu-high-linux.png')?.toBitmap?.() || undefined,
				title: 'Высокая загрузка CPU!',
				content: `CPU: ${cpuLoad}% — проверьте процессы.`,
			})
		}
	}
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		mainWindow = createMainWindow()
	} else {
		mainWindow.show()
	}
})
