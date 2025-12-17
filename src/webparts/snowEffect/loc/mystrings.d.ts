declare interface ISnowEffectWebPartStrings {
	PropertyPaneDescription: string
	SnowSettingsGroupName: string
	SnowAmountFieldLabel: string
	FallSpeedFieldLabel: string
	WindStrengthFieldLabel: string
	TimerFieldLabel: string
	BasicGroupName: string
	DescriptionFieldLabel: string
	AppLocalEnvironmentSharePoint: string
	AppLocalEnvironmentTeams: string
	AppLocalEnvironmentOffice: string
	AppLocalEnvironmentOutlook: string
	AppSharePointEnvironment: string
	AppTeamsTabEnvironment: string
	AppOfficeEnvironment: string
	AppOutlookEnvironment: string
	UnknownEnvironment: string
}

declare module 'SnowEffectWebPartStrings' {
	const strings: ISnowEffectWebPartStrings
	export = strings
}
