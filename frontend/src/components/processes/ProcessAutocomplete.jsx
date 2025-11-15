import { useEffect, useMemo, useRef, useState } from 'react'
import './ProcessAutocomplete.css'

const ProcessAutocomplete = ({
	processes,
	value,
	onSelect,
	onBlur,
	maxSuggestions = 8,
	containerRef,
	searchType = 'auto',
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(-1)
	const inputRef = useRef(null)
	const suggestionsRef = useRef(null)

	const suggestions = useMemo(() => {
		if (!value || value.trim().length === 0) return []

		const query = value.trim().toLowerCase()
		const isNumeric = /^\d+$/.test(query)
		const actualSearchType =
			searchType === 'auto' ? (isNumeric ? 'pid' : 'name') : searchType

		const processMap = new Map()

		processes.forEach(process => {
			const pid = String(process?.pid || '')
			const name = String(process?.name || '').toLowerCase()
			const username = String(process?.username || '')
			const ports = process?.ports || []

			let shouldInclude = false
			let displayValue = ''

			if (actualSearchType === 'pid') {
				if (pid.includes(query)) {
					if (pid === query) {
						return
					}
					shouldInclude = true
					displayValue = pid
				}
			} else if (actualSearchType === 'name') {
				if (name.includes(query)) {
					shouldInclude = true
					displayValue = process?.name || 'Неизвестно'
				}
			} else if (actualSearchType === 'port') {
				const queryNum = query
				const matchingPorts = ports.filter(port =>
					String(port).includes(queryNum)
				)
				if (matchingPorts.length > 0) {
					shouldInclude = true
					displayValue = matchingPorts.join(', ')
				}
			}

			if (shouldInclude && !processMap.has(pid)) {
				processMap.set(pid, {
					pid,
					name: process?.name || 'Неизвестно',
					username: username,
					ports: ports,
					displayValue: displayValue,
					type: actualSearchType,
				})
			}
		})

		return Array.from(processMap.values())
			.slice(0, maxSuggestions)
			.sort((a, b) => {
				if (a.type !== b.type) {
					const order = { pid: 0, name: 1, port: 2 }
					return (order[a.type] || 0) - (order[b.type] || 0)
				}
				return a.name.localeCompare(b.name)
			})
	}, [processes, value, maxSuggestions, searchType])

	useEffect(() => {
		setIsOpen(suggestions.length > 0 && value.trim().length > 0)
		setHighlightedIndex(-1)
	}, [suggestions.length, value])

	useEffect(() => {
		const handleClickOutside = event => {
			if (!isOpen) return

			const clickedOutsideContainer = containerRef?.current
				? !containerRef.current.contains(event.target)
				: true
			const clickedOutsideSuggestions = suggestionsRef.current
				? !suggestionsRef.current.contains(event.target)
				: true

			if (clickedOutsideContainer && clickedOutsideSuggestions) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => {
				document.removeEventListener('mousedown', handleClickOutside)
			}
		}
	}, [isOpen, containerRef])

	useEffect(() => {
		const handleKeyDown = e => {
			if (!isOpen) return

			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setHighlightedIndex(prev =>
					prev < suggestions.length - 1 ? prev + 1 : prev
				)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
			} else if (e.key === 'Enter' && highlightedIndex >= 0) {
				e.preventDefault()
				handleSelect(suggestions[highlightedIndex])
			} else if (e.key === 'Escape') {
				setIsOpen(false)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, highlightedIndex, suggestions])

	const handleSelect = suggestion => {
		if (suggestion.type === 'pid') {
			onSelect?.(suggestion.pid)
		} else if (suggestion.type === 'name') {
			onSelect?.(suggestion.name)
		} else if (suggestion.type === 'port') {
			const query = value.trim()
			const matchingPort = suggestion.ports.find(port =>
				String(port).includes(query)
			)
			onSelect?.(
				matchingPort
					? String(matchingPort)
					: suggestion.ports[0]
					? String(suggestion.ports[0])
					: ''
			)
		}
		setIsOpen(false)
		setHighlightedIndex(-1)
	}

	const handleBlur = e => {
		onBlur?.(e)
	}

	if (!isOpen) return null

	return (
		<div className='process-autocomplete' ref={suggestionsRef}>
			{suggestions.map((suggestion, index) => (
				<div
					key={`${suggestion.pid}-${index}-${suggestion.type}`}
					className={`process-autocomplete-item ${
						index === highlightedIndex
							? 'process-autocomplete-item--highlighted'
							: ''
					}`}
					onMouseDown={() => handleSelect(suggestion)}
					onMouseEnter={() => setHighlightedIndex(index)}
				>
					<div className='process-autocomplete-item__main'>
						<span className='process-autocomplete-item__name'>
							{suggestion.name}
						</span>
						{suggestion.username && (
							<span className='process-autocomplete-item__username'>
								{suggestion.username}
							</span>
						)}
						{suggestion.type === 'port' && suggestion.ports.length > 0 && (
							<span className='process-autocomplete-item__ports'>
								Порты: {suggestion.ports.join(', ')}
							</span>
						)}
					</div>
					<div className='process-autocomplete-item__meta'>
						{suggestion.type === 'pid' && (
							<div className='process-autocomplete-item__pid'>
								PID: {suggestion.pid}
							</div>
						)}
						{suggestion.type === 'name' && (
							<div className='process-autocomplete-item__pid'>
								PID: {suggestion.pid}
							</div>
						)}
						{suggestion.type === 'port' && (
							<div className='process-autocomplete-item__pid'>
								PID: {suggestion.pid}
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	)
}

export default ProcessAutocomplete
