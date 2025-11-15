package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/shirou/gopsutil/v3/cpu"
)

func deviceInfo() (string, int32) {
	info, err := cpu.Info()

	if err != nil {
		fmt.Println("Ошибка при получении информации")
	}

	processName := info[0].ModelName

	var totalCores int32
	for _, info := range info {
		totalCores += info.Cores
	}

	return processName, totalCores
}

func GetDeviceInfo(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		http.Error(writer, "Сервер не поддерживает метод", http.StatusMethodNotAllowed)
	}
	processName, core := deviceInfo()

	type DeficeInfo struct {
		ProcessName string `json:"processname"`
		Cores       int32  `json:"cores"`
	}

	deviceInfo := DeficeInfo{
		ProcessName: processName,
		Cores:       core,
	}

	writer.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(writer)
	err := encoder.Encode(deviceInfo)
	if err != nil {
		log.Printf("Ошибка сериализации информации о системе: %v", err)
	}
}
