package utils

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func StartElectron() {
	exePath, err := os.Executable()
	if err != nil {
		panic(fmt.Errorf("не удалось определить путь к исполняемому файлу: %w", err))
	}

	exeDir := filepath.Dir(exePath)
	electronDir := filepath.Join(exeDir, "electron-build")

	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		appPath := filepath.Join(electronDir, "nexora.exe")
		if _, err := os.Stat(appPath); os.IsNotExist(err) {
			fmt.Printf("Electron-приложение не найдено: %s\n", appPath)
			fmt.Println("Убедитесь, что вы поместили nexora.exe в папку electron-build/")
			return
		}
		cmd = exec.Command(appPath)

	case "linux":
		binFolderName := "nexora-0.0.0-linux-x64"
		binDir := filepath.Join(electronDir, binFolderName)
		appPath := filepath.Join(binDir, "nexora")

		if _, err := os.Stat(binDir); os.IsNotExist(err) {
			fmt.Printf("Папка с Electron-бинарником не найдена: %s\n", binDir)
			fmt.Println("Убедитесь, что вы распаковали nexora.tar.gz в electron-build/")
			return
		}

		cmd = exec.Command(appPath, "--no-sandbox", "--disable-setuid-sandbox")
		cmd.Dir = binDir

	default:
		fmt.Printf("ОС %s не поддерживается\n", runtime.GOOS)
		return
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		fmt.Printf("Ошибка запуска Electron: %v\n", err)
		return
	}

	fmt.Println("Electron-приложение запущено.")
}
