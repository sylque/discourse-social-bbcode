import { withPluginApi } from 'discourse/lib/plugin-api'

export default {
  name: 'discourse-social-bbcode',
  initialize(container, app) {
    // If plugin is disabled, quit
    if (!app.SiteSettings['discourse_social_bbcode_enabled']) {
      return
    }

    // Facebook asynchronous init. See:
    // https://developers.facebook.com/docs/javascript/quickstart/
    // https://developers.facebook.com/docs/internationalization#locales
    window.fbAsyncInit = function() {
      FB.init({
        appId: 'your-app-id',
        autoLogAppEvents: true,
        xfbml: false, // Disable Facebook scan on load
        version: 'v5.0'
      })
    }

    // Load Twitter and Facebook script
    const scriptLoaded = Promise.all([
      getScript('https://platform.twitter.com/widgets.js'),
      getScript(
        `https://connect.facebook.net/${app.SiteSettings.default_locale}/sdk.js`
      )
    ])

    const scan = app.SiteSettings['discourse_social_bbcode_auto_scan']

    withPluginApi('0.8.30', api => {
      // Disable Twitter scan no load
      // https://developer.twitter.com/en/docs/twitter-for-websites/webpage-properties/overview
      // https://meta.discourse.org/t/how-to-allow-certain-html-tags-in-customization/83592/3?u=syl
      api.decorateWidget('header-contents:after', helper =>
        helper.rawHtml('<meta name="twitter:widgets:autoload" content="off">')
      )

      if (scan) {
        // Refire twitter and facebook on page change
        api.decorateCooked(
          $elem => {
            scriptLoaded.then(() => {
              scanPage($elem.get(0))
            })
          },
          {
            id: 'discourse-social-bbcode',
            onlyStream: true
          }
        )
      }
    })

    // Set a global function to be called by other plugins to scan pages
    // manually
    window.discourseSocialBBCodeScan = rootElement => {
      if (!scan) {
        scriptLoaded.then(() => {
          scanPage(rootElement)
        })
      }
    }
  }
}

// Function to fire twitter and facebook parsing of the page
const scanPage = rootElement => {
  // Refire Twitter. See:
  // https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/scripting-loading-and-initialization
  window.twttr && window.twttr.widgets.load(rootElement)

  // Refire Facebook. See:
  // https://developers.facebook.com/docs/reference/javascript/FB.XFBML.parse/
  window.FB && window.FB.XFBML.parse(rootElement)

  // Set up a click handler for the "mailto" links and buttons
  rootElement
    .querySelectorAll('a.sbb-mailtolink, span.sbb-mailtobutton')
    .forEach(link => {
      link.addEventListener('click', e => {
        onEmailClick(link)
      })
    })
}

const onEmailClick = link => {
  // Create the "mailto" query param string
  const params = Object.keys(link.dataset)
    .map(key => {
      const value = encodeURIComponent(decodeHtmlEntities(link.dataset[key]))
      return `${key}=${value}`
    })
    .join('&')

  // https://stackoverflow.com/a/9880404/3567351
  const myWindow = window.open(`mailto:?${params}`)

  // Now we need to deal with the problem that a blank tab is
  // opened on Firefox (not Chrome) when the user uses an external
  // email client (for example Outlook). We need to close this
  // useless blank tab.
  // https://stackoverflow.com/a/42034130/3567351
  myWindow.onload = () => {
    try {
      if (myWindow.location.href === 'about:blank') {
        myWindow.close()

        // Fix for Safari on iOS. See:
        // https://stackoverflow.com/a/10712923/3567351
        setTimeout(() => {
          if (!myWindow.closed) {
            myWindow.close()
          }
        }, 400)
      }
    } catch (e) {}
  }
}

const decodeHtmlEntities = str =>
  str && str.replace(/&quot;/g, '"').replace(/&apos;/g, "'")

const getScript = url =>
  new Promise((resolve, reject) => {
    $.getScript(url)
      .done((script, textStatus) => resolve(textStatus))
      .fail((jqxhr, settings, exception) => reject(exception))
  })
