type ItemDefaultsType = Record<
	string,
	{
		size: number[]
	}
>

const ItemDefaults: ItemDefaultsType = {
	fan: { size: [150, 150] },
	light: { size: [30, 30] },
	fan_light: { size: [150, 150] },
	aircon: { size: [100, 50] },
	tv: { size: [100, 50] },
	fan_pedestol: { size: [50, 50] },
	oven: { size: [50, 100] },
	washing_machine: { size: [100, 100] },
	bed: { size: [30, 30] },
	fridge: { size: [200, 250] },
	fire: { size: [200, 100] },
	switch_light: { size: [30, 30] },
	wifi_router: { size: [30, 30] },
	robot_vacuum: { size: [50, 50] },
	lamp: { size: [30, 30] },
	computer: { size: [30, 30] },
	laptop: { size: [100, 50] },
	pi: { size: [30, 30] },
	monitor: { size: [50, 50] },
	camera: { size: [30, 30] },
	alarm: { size: [30, 30] },
	speaker: { size: [30, 30] },
	doorbell: { size: [30, 30] },
}

export default ItemDefaults
