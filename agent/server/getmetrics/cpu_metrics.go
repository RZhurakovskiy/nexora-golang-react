package getmetrics

import (
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
)

func UsageCPU(duration time.Duration) (float64, error) {

	percents, err := cpu.Percent(duration, false)
	if err != nil || len(percents) == 0 {
		return 0, err
	}
	return percents[0], nil
}
