const formatTime = (time: number): string => {
	const hours: number = Math.floor(time / 1)
	const minutes: number = (time % 1) * 60

	if(hours > 0) {
		return `${hours}h ${minutes}m`
	}
	else {
		return `${minutes}m`
	}
}

export default formatTime