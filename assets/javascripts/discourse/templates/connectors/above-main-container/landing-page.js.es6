import { withPluginApi } from "discourse/lib/plugin-api"

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---

// GLOBAL VARS
let clockTimeout = null
let metaTimeout = null

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---

export default {
  setupComponent(args, component) {
    withPluginApi('1.2.0', api => init(api, component, args))
  },
}

function init(api, component, args) {
  api.onPageChange((url, title) => {
    let isEnabled = component.siteSettings.fuse_enabled
    let correctUrl = isCorrectUrl(url)

    component.set('showPlugin', false)
    clearTimeout(clockTimeout)
    clearTimeout(metaTimeout)

    if (correctUrl && isEnabled) {
      component.set('showPlugin', true)
      
      clockTick(component)
      metaTick(component)
    }
  })
}

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---

function clockTick(component) {
  let fuse_date = new Date(component.siteSettings.fuse_date)
  let now = new Date()

  let remainingTime = fuse_date - now

  if (remainingTime > 0) {
    component.set('showCountdown', true)

    let days = Math.floor(remainingTime / (1000 * 60 * 60 * 24))
    let hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    let minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60))
    let seconds = Math.floor((remainingTime % (1000 * 60)) / (1000))

    let daysText = days === 1 ? 'day' : 'days'
    let hoursText = hours === 1 ? 'hour' : 'hours'
    let minutesText = minutes === 1 ? 'minute' : 'minutes'
    let secondsText = seconds === 1 ? 'second' : 'seconds'

    component.set('countdownDays', days.toString().padStart(2, '0'))
    component.set('countdownHours', hours.toString().padStart(2, '0'))
    component.set('countdownMinutes', minutes.toString().padStart(2, '0'))
    component.set('countdownSeconds', seconds.toString().padStart(2, '0'))

    component.set('countdownDaysText', daysText)
    component.set('countdownHoursText', hoursText)
    component.set('countdownMinutesText', minutesText)
    component.set('countdownSecondsText', secondsText)

    clockTimeout = setTimeout(() => {
      clockTick(component)
    }, 333)
  } else {
    component.set('showCountdown', false)
  }
}

function metaTick(component) {
  let url = 'https://raw.githubusercontent.com/adaptcentre/fuse-dcu-2022-plugin/main/public/meta/topics.json'

  url += `?t=${Date.now()}`

  fetch(url, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => console.log(data))
  

  metaTimeout = setTimeout(() => {
    metaTick(component)
  }, 1000 * 5) // every 5 seconds?
}

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---

function isCorrectUrl( url ) {
  if( url === '/' ) {
    return true
  }

  if (url === '/categories') {
    return true
  }

  return false
}