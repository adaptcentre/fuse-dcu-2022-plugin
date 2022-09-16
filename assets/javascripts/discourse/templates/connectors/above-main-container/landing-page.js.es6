import { withPluginApi } from "discourse/lib/plugin-api"

// GLOBAL VARS
let clockTimeout = null
let dataTimeout = null

export default {
  setupComponent(args, component) {
    withPluginApi('1.2.0', api => init(api, component, args))
  },
}

function init(api, component, args) {
  api.onPageChange((url, title) => {
    let isEnabled = component.siteSettings.fuse_enabled
    let showLandingPage = isCorrectUrl(url)

    debugPrint(isEnabled, showLandingPage)

    if (showLandingPage && isEnabled) {
      component.set('showLandingPage', true)
      startTicks(component)
    } else {
      component.set('showLandingPage', false)

      clearTimeout(clockTimeout)
      clearTimeout(dataTimeout)
    }
  })
}

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---

function startTicks(component) {
	component.set('showCountdown', true) // might be able to remove

  if (clockTimeout) {
    clearTimeout(clockTimeout)
	}

  clockTick(component)
  metaTick(component)
}

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
    }, 500)
  } else {
    component.set('showCountdown', false)
  }
}

function metaTick(component) {
  let metaTopicId = component.siteSettings.fuse_meta_topic_id
  let apiUser = component.siteSettings.fuse_api_user
  let apiKey = component.siteSettings.fuse_api_key

  console.group()
  console.log("metaTopicId", metaTopicId)
  console.log("apiUser", apiUser)
  console.log("apiKey", apiKey)
  console.groupEnd()

  fetch(`/t/${metaTopicId}.json`, {
    headers: {
      'Api-Key': apiKey,
      'Api-Username': apiUser
    }
  })
    .then(response => response.json())
    .then((data) => {
      let parsed = parseMeta(data)
      console.log(parsed)
    })
}

function parseMeta(raw) {
  let cooked = raw.post_stream.posts[0].cooked
  let split = cooked.split('<hr>')
  let parsed = []

  split.forEach(entry => {

    let p = parseMetaEntry(entry)

    parsed.push(p)
  })

  return parsed
}

function parseMetaEntry(entry) {
  let raw = entry.replace(/(<([^>]+)>)/ig, '')

  let lines = raw.split('\n').filter(l => l.length > 0)

  let obj = {}

  lines.forEach(line => {

    let a = line.substring(0, line.indexOf(':')).trim()
    let b = line.substring(line.indexOf(':')).replace(':', '').trim()

    obj[a] = b
  })

  obj.experts = obj.experts.split(',').map(entry => entry.trim())
  obj.expertTopicIds = obj.expertTopicIds.split(',').map(entry => entry.trim())

  return obj
}

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---

function isCorrectUrl( url ) {

  if( url === '/' ) {
    return true
  }

  return false
}

// --- --- --- --- --- --- --- --- ---
// --- --- --- --- --- --- --- --- ---
function debugPrint(isEnabled, showLandingPage) {
  console.group('Fuse Plugin Settings')
  console.log("isEnabled", isEnabled)
  console.log("showLandingPage", showLandingPage)
  console.groupEnd()
}
