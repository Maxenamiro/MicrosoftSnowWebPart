# snow-effect

## Summary

## ✨ Key features
- ❄️ Canvas-based rendering for maximum performance
- 🚀 FPS-limited animation loop (20 FPS) to reduce CPU usage
- ** 🧠 Global snowfall state sharing via sessionStorage
- ** Prevents duplicate canvases
- ** Allows multiple web part instances to reuse the same snowfall
- ** 🖥 Retina / HiDPI support using device pixel ratio (DPR)
	-	📐 Responsive resizing via ResizeObserver
	-	🌬 Configurable parameters via Property Pane:
	-	Snowflake amount (up to 2000)
	-	Falling speed
	-	Wind strength
	-	Auto-stop timer (with smooth fade-out)
	-	🌫 Graceful fade-out animation instead of abrupt stop
	-	✏️ Edit mode safe
	-	No visual noise in edit mode
	-	Canvas runs only in view mode
	-	🧹 Automatic cleanup
	-	Stops animation when the last web part instance is removed

##🧩 Technical highlights
	-	Single global <canvas> element (position: fixed)
	-	No DOM pollution, no event listeners on the page
	-	Pointer-events disabled (does not block UI interactions)
	-	Smart snowflake lifecycle management
	-	Performance degradation protection for extreme values

##🎯 Use cases
	-	Seasonal or holiday effects (Winter / Christmas)
	-	Corporate intranet decorations
	-	Temporary visual effects without impacting SharePoint UX

##Please star if you use or like its motivating me to do more SP solution and webparts

[picture of the solution in action, if possible]

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.21.1-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)

> Get your own free development tenant by subscribing to [Microsoft 365 developer program](http://aka.ms/o365devprogram)

## Prerequisites

> Any special pre-requisites?

## Solution

| Solution    | Author(s)                                               |
| ----------- | ------------------------------------------------------- |
| folder name | Author details (name, company, twitter alias with link) |

## Version history

| Version | Date             | Comments        |
| ------- | ---------------- | --------------- |
| 1.1     | March 10, 2021   | Update comment  |
| 1.0     | January 29, 2021 | Initial release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- in the command-line run:
  - **npm install**
  - **gulp serve**

> Include any additional steps as needed.

## Features

Description of the extension that expands upon high-level summary above.

This extension illustrates the following concepts:

- topic 1
- topic 2
- topic 3

> Notice that better pictures and documentation will increase the sample usage and the value you are providing for others. Thanks for your submissions advance.

> Share your web part with others through Microsoft 365 Patterns and Practices program to get visibility and exposure. More details on the community, open-source projects and other activities from http://aka.ms/m365pnp.

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/build-for-teams-overview)
- [Use Microsoft Graph in your solution](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/using-microsoft-graph-apis)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
