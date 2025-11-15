package getmetrics

import (
	"github.com/shirou/gopsutil/v4/mem"
)

func UsageMemory() (float64, uint64, uint64, error) {
	memory, err := mem.VirtualMemory()
	if err != nil {
		return 0, 0, 0, err
	}

	const mib = uint64(1024 * 1024)
	totalMiB := memory.Total / mib
	usedMiB := memory.Used / mib

	return memory.UsedPercent, totalMiB, usedMiB, nil
}
