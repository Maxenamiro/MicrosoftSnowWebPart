import { DisplayMode, Version } from '@microsoft/sp-core-library'
import {
	BaseClientSideWebPart,
	IPropertyPaneConfiguration,
	PropertyPaneSlider,
} from '@microsoft/sp-webpart-base'

import * as strings from 'SnowEffectWebPartStrings'
import styles from './SnowEffectWebPart.module.scss'

export interface ISnowEffectWebPartProps {
	snowAmount: number
	fallSpeed: number
	windStrength: number
	timer: number
}

// Ультра-оптимизированный интерфейс снежинки
interface SnowflakeData {
	x: number
	y: number
	size: number
	speed: number
	swing: number
	phase: number
	phaseSpeed: number
	opacity: number
	fadeOut: number // 0 = normal, 1 = полностью исчезла
}

// Глобальный ключ для хранения состояния снегопада
const SNOWFALL_STORAGE_KEY = 'snowEffectGlobalState'
const CANVAS_ID = 'snow-effect-canvas'

export default class SnowEffectWebPart extends BaseClientSideWebPart<ISnowEffectWebPartProps> {
	private canvas: HTMLCanvasElement | null = null
	private ctx: CanvasRenderingContext2D | null = null
	private snowflakes: SnowflakeData[] = []
	private isActive: boolean = false
	private isFadingOut: boolean = false
	private animationId: number | null = null
	private timerId: number | null = null
	private lastFrameTime: number = 0
	private frameInterval: number = 1000 / 20 // 20 FPS для максимальной производительности
	private resizeObserver: ResizeObserver | null = null
	private dpr: number = 1
	private fadeOutStartTime: number = 0
	private fadeOutDuration: number = 2000 // 2 секунды на плавное исчезновение
	private snowfallStartTime: number = 0 // Время начала текущего снегопада
	private isFirstRender: boolean = true

	protected onInit(): Promise<void> {
		console.log('=== SnowEffectWebPart: onInit() ===')
		console.log('Display mode:', DisplayMode[this.displayMode])

		// Устанавливаем значения по умолчанию
		if (typeof this.properties.snowAmount === 'undefined') {
			this.properties.snowAmount = 100
		}
		if (typeof this.properties.fallSpeed === 'undefined') {
			this.properties.fallSpeed = 2.0
		}
		if (typeof this.properties.windStrength === 'undefined') {
			this.properties.windStrength = 2.0
		}
		if (typeof this.properties.timer === 'undefined') {
			this.properties.timer = 0 // 0 = unlimited по умолчанию
		}

		// Получаем DPR для retina-дисплеев
		this.dpr = window.devicePixelRatio || 1

		return super.onInit()
	}

	public render(): void {
		console.log('=== SnowEffectWebPart: render() ===')
		console.log('Display mode:', DisplayMode[this.displayMode])

		// В режиме редактирования показываем текстовый блок
		if (this.displayMode === DisplayMode.Edit) {
			console.log('Edit mode detected, showing text block')

			// Текстовый блок только в режиме редактирования
			this.domElement.innerHTML = `
				<div class="${styles.snowEffect}">
					<div style="
						padding: 8px;
						text-align: center;
						background: rgba(0, 120, 215, 0.05);
						border-radius: 3px;
						border: 1px dashed rgba(0, 120, 215, 0.1);
						margin: 2px;
						font-size: 11px;
					">
						<span style="color: #0078d7;">❄️ Snow Effect Settings</span>
					</div>
				</div>`
		} else {
			// В режиме просмотра НЕ показываем текстовый блок
			console.log('Read mode detected, hiding text block')
			this.domElement.innerHTML = `<div class="${styles.snowEffect}" style="display: none;"></div>`
		}

		// В ЛЮБОМ режиме инициализируем снегопад
		this.initSnowfall()
	}

	private initSnowfall(): void {
		console.log('=== SnowEffectWebPart: initSnowfall() ===')
		console.log('Is first render:', this.isFirstRender)

		// Проверяем существующий canvas (возможно, созданный другой веб-частью или в предыдущем рендере)
		let existingCanvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement

		if (existingCanvas) {
			console.log('Using existing canvas from previous instance')
			this.canvas = existingCanvas
			this.ctx = this.canvas.getContext('2d')

			// Если canvas уже есть, проверяем идет ли снегопад
			const isSnowfallRunning = this.checkIfSnowfallIsRunning()

			if (isSnowfallRunning && !this.isFirstRender) {
				console.log(
					'Snowfall already running from another instance, connecting to it'
				)
				// Подключаемся к уже работающему снегопаду
				this.setupCanvas()
				this.isActive = true
				// Запускаем анимацию для этого экземпляра
				this.animateCanvas()
				return
			}
		} else {
			console.log('Creating new canvas')
			this.createCanvas()
		}

		if (this.canvas) {
			this.setupCanvas()
			this.startSnowfall()
		}

		this.isFirstRender = false
	}

	private checkIfSnowfallIsRunning(): boolean {
		// Проверяем, есть ли активный снегопад (по наличию canvas и его содержимому)
		const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement
		if (!canvas) return false

		// Также можем проверить sessionStorage на наличие состояния
		const savedState = sessionStorage.getItem(SNOWFALL_STORAGE_KEY)
		return savedState !== null
	}

	private createCanvas(): void {
		console.log('=== SnowEffectWebPart: createCanvas() ===')

		this.canvas = document.createElement('canvas')
		this.canvas.id = CANVAS_ID

		// Критически важные стили
		this.canvas.style.cssText = `
			position: fixed !important;
			top: 0 !important;
			left: 0 !important;
			width: 100vw !important;
			height: 100vh !important;
			pointer-events: none !important;
			z-index: 999999 !important;
			image-rendering: -webkit-optimize-contrast;
			image-rendering: crisp-edges;
		`

		document.body.insertBefore(this.canvas, document.body.firstChild)
		this.ctx = this.canvas.getContext('2d', { alpha: true })

		// Сохраняем состояние, что снегопад запущен
		this.saveSnowfallState()
	}

	private setupCanvas(): void {
		if (!this.canvas || !this.ctx) return

		// Устанавливаем размер canvas с учетом DPR
		const width = window.innerWidth
		const height = window.innerHeight

		this.canvas.width = width * this.dpr
		this.canvas.height = height * this.dpr
		this.canvas.style.width = `${width}px`
		this.canvas.style.height = `${height}px`

		// Масштабируем контекст для retina
		this.ctx.scale(this.dpr, this.dpr)

		// Оптимизация контекста
		;(this.ctx as any).imageSmoothingEnabled = false

		// Наблюдатель за изменением размера
		if (this.resizeObserver) {
			this.resizeObserver.disconnect()
		}

		this.resizeObserver = new ResizeObserver(() => {
			this.handleResize()
		})

		this.resizeObserver.observe(document.body)
	}

	private handleResize(): void {
		if (!this.canvas || !this.ctx) return

		const width = window.innerWidth
		const height = window.innerHeight

		this.canvas.width = width * this.dpr
		this.canvas.height = height * this.dpr
		this.canvas.style.width = `${width}px`
		this.canvas.style.height = `${height}px`

		// Сбрасываем трансформации
		this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

		// Корректируем снежинки за пределами экрана
		this.snowflakes = this.snowflakes.filter((flake) => {
			return (
				flake.x >= -50 &&
				flake.x <= width + 50 &&
				flake.y >= -50 &&
				flake.y <= height + 50
			)
		})
	}

	private startSnowfall(): void {
		console.log('=== SnowEffectWebPart: startSnowfall() ===')
		console.log('Timer setting:', this.properties.timer, 'seconds')
		console.log('Current properties:', this.properties)

		// Сбрасываем состояние fade out
		this.isFadingOut = false
		this.fadeOutStartTime = 0
		this.snowfallStartTime = Date.now()

		// Останавливаем предыдущую анимацию и таймеры
		this.clearAllTimers()

		this.isActive = true
		this.lastFrameTime = performance.now()

		const snowAmount = this.properties.snowAmount || 100
		const fallSpeed = this.properties.fallSpeed || 2.0
		const windStrength = this.properties.windStrength || 2.0
		const timer = this.properties.timer || 0

		console.log(`Starting ${snowAmount} canvas snowflakes, timer: ${timer}s`)

		// Создаем снежинки
		this.createSnowflakes(snowAmount, fallSpeed, windStrength)

		// Запускаем анимацию
		this.animateCanvas()

		// Запускаем таймер только если установлено значение > 0
		if (timer > 0) {
			this.startTimer(timer)
		} else if (timer === 0) {
			console.log('Timer is 0, snowfall will run indefinitely')
		}

		// Сохраняем состояние снегопада
		this.saveSnowfallState()
	}

	private saveSnowfallState(): void {
		// Сохраняем состояние в sessionStorage, чтобы другие экземпляры знали о работающем снегопаде
		const state = {
			isActive: true,
			timestamp: Date.now(),
			properties: this.properties,
		}
		sessionStorage.setItem(SNOWFALL_STORAGE_KEY, JSON.stringify(state))
	}

	private clearAllTimers(): void {
		// Очищаем все таймеры
		if (this.timerId) {
			console.log('Clearing existing timer')
			clearTimeout(this.timerId)
			this.timerId = null
		}

		if (this.animationId) {
			cancelAnimationFrame(this.animationId)
			this.animationId = null
		}
	}

	private createSnowflakes(
		amount: number,
		fallSpeed: number,
		windStrength: number
	): void {
		this.snowflakes = []
		const width = window.innerWidth
		const height = window.innerHeight

		for (let i = 0; i < amount; i++) {
			this.snowflakes.push({
				x: Math.random() * width,
				y: Math.random() * height,
				size: Math.random() * 3 + 1,
				speed: (Math.random() * 0.8 + 0.2) * fallSpeed,
				swing: (Math.random() * 20 + 5) * windStrength,
				phase: Math.random() * Math.PI * 2,
				phaseSpeed: Math.random() * 0.01 + 0.005,
				opacity: Math.random() * 0.4 + 0.3,
				fadeOut: 0,
			})
		}

		console.log(`Created ${this.snowflakes.length} canvas snowflakes`)
	}

	private animateCanvas = (): void => {
		if (!this.isActive || !this.ctx || !this.canvas) {
			return
		}

		const now = performance.now()
		const deltaTime = now - this.lastFrameTime

		// Контроль FPS
		if (deltaTime < this.frameInterval) {
			this.animationId = requestAnimationFrame(this.animateCanvas)
			return
		}

		this.lastFrameTime = now - (deltaTime % this.frameInterval)

		// Проверяем таймер в каждом кадре (fallback на случай если setTimeout не сработал)
		const timer = this.properties.timer || 0
		if (timer > 0) {
			const elapsed = Date.now() - this.snowfallStartTime
			if (elapsed > timer * 1000 && !this.isFadingOut) {
				console.log(
					`Timer fallback triggered after ${timer}s, starting fade out`
				)
				this.startFadeOut()
			}
		}

		// Очищаем canvas
		this.ctx.clearRect(
			0,
			0,
			this.canvas.width / this.dpr,
			this.canvas.height / this.dpr
		)

		const width = window.innerWidth
		const height = window.innerHeight
		let activeSnowflakes = 0

		// Обновляем и рисуем снежинки
		for (let i = 0; i < this.snowflakes.length; i++) {
			const flake = this.snowflakes[i]

			// Если снежинка полностью исчезла, пропускаем
			if (flake.fadeOut >= 1) {
				continue
			}

			// Если идет fade out, обновляем прогресс
			if (this.isFadingOut) {
				if (this.fadeOutStartTime === 0) {
					this.fadeOutStartTime = now
				}

				const fadeProgress = Math.min(
					1,
					(now - this.fadeOutStartTime) / this.fadeOutDuration
				)

				// Случайное начало fade out для каждой снежинки
				const individualFadeStart =
					((flake.x + flake.y) / (width + height)) * 0.5
				const individualFadeProgress = Math.max(
					0,
					(fadeProgress - individualFadeStart) / (1 - individualFadeStart)
				)

				flake.fadeOut = Math.min(1, individualFadeProgress)

				// Замедляем снежинки во время fade out
				flake.speed *= 0.995
				flake.swing *= 0.995
			}

			// Движение вниз
			flake.y += flake.speed

			// Боковое движение
			flake.phase += flake.phaseSpeed
			flake.x += Math.sin(flake.phase) * 0.3 * flake.swing

			// Телепортация по горизонтали
			if (Math.random() < 0.0002) {
				flake.x = Math.random() > 0.5 ? -10 : width + 10
			}

			// Если снежинка упала
			if (flake.y > height + 10) {
				flake.y = -5
				flake.x = Math.random() * width

				if (Math.random() < 0.1) {
					flake.size = Math.random() * 3 + 1
					flake.speed =
						(Math.random() * 0.8 + 0.2) * (this.properties.fallSpeed || 2.0)
					flake.opacity = Math.random() * 0.4 + 0.3
				}
			}

			// Если снежинка ушла за горизонтальные границы
			if (flake.x < -50 || flake.x > width + 50) {
				flake.x = Math.random() * width
				flake.y = Math.random() * height
			}

			// Вычисляем итоговую прозрачность
			const finalOpacity = flake.opacity * (1 - flake.fadeOut)

			// Рисуем снежинку только если она еще видима
			if (finalOpacity > 0.01) {
				this.ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`
				this.ctx.beginPath()
				this.ctx.arc(
					flake.x,
					flake.y,
					flake.size * (1 - flake.fadeOut * 0.5),
					0,
					Math.PI * 2
				)
				this.ctx.fill()
				activeSnowflakes++
			}
		}

		// Если все снежинки исчезли, останавливаем анимацию
		if (this.isFadingOut && activeSnowflakes === 0) {
			this.isActive = false
			if (this.animationId) {
				cancelAnimationFrame(this.animationId)
				this.animationId = null
			}
			// Удаляем состояние из storage
			sessionStorage.removeItem(SNOWFALL_STORAGE_KEY)
			console.log('All snowflakes faded out, animation stopped')
			return
		}

		// Оптимизация
		if (this.snowflakes.length > 2000 && deltaTime > 20 && !this.isFadingOut) {
			this.snowflakes = this.snowflakes.filter((_, index) => index % 2 === 0)
			console.log(
				`Reduced snowflakes to ${this.snowflakes.length} for performance`
			)
		}

		this.animationId = requestAnimationFrame(this.animateCanvas)
	}

	private startTimer(timerSeconds: number): void {
		console.log(
			`SnowEffectWebPart: startTimer() called with ${timerSeconds} seconds`
		)

		// Очищаем предыдущий таймер
		if (this.timerId) {
			clearTimeout(this.timerId)
			this.timerId = null
		}

		if (timerSeconds > 0) {
			this.timerId = window.setTimeout(() => {
				console.log(
					`Snowfall timer (${timerSeconds}s) expired, starting fade out`
				)
				this.startFadeOut()
			}, timerSeconds * 1000)
			console.log(`Timer set for ${timerSeconds} seconds`)
		} else if (timerSeconds === 0) {
			console.log('Timer is 0, no auto-stop scheduled')
		}
	}

	private startFadeOut(): void {
		console.log('Starting graceful fade out of snowflakes')
		this.isFadingOut = true
		this.fadeOutStartTime = performance.now()

		// Очищаем таймер, так как он уже сработал
		if (this.timerId) {
			clearTimeout(this.timerId)
			this.timerId = null
		}
	}

	private stopSnowfall(force: boolean = false): void {
		console.log('SnowEffectWebPart: stopSnowfall() called, force:', force)

		if (force) {
			// Принудительная остановка (при удалении веб-части)
			this.forceStopSnowfall()
			sessionStorage.removeItem(SNOWFALL_STORAGE_KEY)
		} else {
			// Если снегопад активен, начинаем плавное исчезновение
			if (this.isActive && this.snowflakes.length > 0) {
				console.log('Starting fade out before stopping')
				this.startFadeOut()

				// Ждем завершения fade out перед полной остановкой
				setTimeout(() => {
					this.forceStopSnowfall()
					sessionStorage.removeItem(SNOWFALL_STORAGE_KEY)
				}, this.fadeOutDuration + 500)
			} else {
				this.forceStopSnowfall()
				sessionStorage.removeItem(SNOWFALL_STORAGE_KEY)
			}
		}
	}

	private forceStopSnowfall(): void {
		console.log('SnowEffectWebPart: forceStopSnowfall() called')

		this.isActive = false
		this.isFadingOut = false

		// Очищаем все таймеры
		this.clearAllTimers()

		// Очищаем canvas
		if (this.ctx && this.canvas) {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		}

		// Очищаем массив снежинок
		this.snowflakes = []
	}

	protected onDispose(): void {
		console.log('=== SnowEffectWebPart: onDispose() ===')

		// Останавливаем снегопад только если это последняя веб-часть
		// Проверяем, есть ли другие экземпляры на странице
		const webParts = document.querySelectorAll('[data-sp-web-part-id]')
		const hasOtherInstances = webParts.length > 1

		if (!hasOtherInstances) {
			console.log('Last web part instance, stopping snowfall')
			this.stopSnowfall(true)
		} else {
			console.log('Other web part instances exist, keeping snowfall running')
		}

		// Удаляем наблюдатель
		if (this.resizeObserver) {
			this.resizeObserver.disconnect()
			this.resizeObserver = null
		}

		super.onDispose()
	}

	protected onPropertyPaneFieldChanged(
		propertyPath: string,
		oldValue: any,
		newValue: any
	): void {
		console.log(
			`Property changed: ${propertyPath} from ${oldValue} to ${newValue}`
		)
		console.log('Current timer value:', this.properties.timer)

		// Обновляем свойство
		;(this.properties as any)[propertyPath] = newValue

		super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue)

		// Перезапускаем снегопад с новыми настройками
		setTimeout(() => {
			this.startSnowfall()
		}, 300)
	}

	protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
		return {
			pages: [
				{
					header: {
						description: strings.PropertyPaneDescription,
					},
					groups: [
						{
							groupName: strings.SnowSettingsGroupName,
							groupFields: [
								PropertyPaneSlider('snowAmount', {
									label: `${strings.SnowAmountFieldLabel}`,
									min: 20,
									max: 2000,
									value: this.properties.snowAmount,
									showValue: true,
								}),
								PropertyPaneSlider('fallSpeed', {
									label: strings.FallSpeedFieldLabel,
									min: 0.5,
									max: 30,
									value: this.properties.fallSpeed,
									showValue: true,
								}),
								PropertyPaneSlider('windStrength', {
									label: strings.WindStrengthFieldLabel,
									min: 0,
									max: 5,
									value: this.properties.windStrength,
									showValue: true,
								}),
								PropertyPaneSlider('timer', {
									label: `${strings.TimerFieldLabel} (0 = unlimited)`,
									min: 0,
									max: 500,
									value: this.properties.timer,
									showValue: true,
								}),
							],
						},
					],
				},
			],
		}
	}

	protected get dataVersion(): Version {
		return Version.parse('1.0')
	}
}
