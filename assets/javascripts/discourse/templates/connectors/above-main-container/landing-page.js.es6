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
  }
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

    checkListControls(component)
    checkLoginRequired(url, component)
  })
}

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---

function checkListControls(component) {
  let showListControls = component.siteSettings.fuse_list_controls

  let element = document.querySelector('.list-controls')

  if(element) {
    element.style.display = showListControls ? 'block' : 'none'
  }
}

function checkLoginRequired(url, component) {
  
  if (url !== '/login') {
    component.set('showRequiredLogin', false)
    return null
  }

  //component.set('showRequiredLogin', true)
  component.set('showRequiredLogin', false)

  setTimeout(() => {
    let element = document.querySelector('.container.ember-view')

    if (element) {
      element.style.display = 'none'
    }

    try {
      document.querySelector('#fuse-sign-up-btn').addEventListener('click', () => {
        document.querySelector('.sign-up-button').click()
      })
      document.querySelector('#fuse-log-in-btn').addEventListener('click', () => {
        document.querySelector('.login-button').click()
      })
    } catch(err) {}
  }, 800)
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
  let url = component.siteSettings.fuse_manifest_url

  url += `?t=${Date.now()}`

  fetch(url, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      component.set('events', data)
      component.set('liveEvents', data.filter(d => d.isLive))
      component.set('showLiveEvents', data.filter(d => d.isLive).length > 0 ? true : false)
    })

  metaTimeout = setTimeout(() => {
    metaTick(component)
  }, 1000 * 30) // every 30 seconds?
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

  if (url === '/login') {
    return true
  }

  if (url === '/latest') {
    return true
  }

  return false
}