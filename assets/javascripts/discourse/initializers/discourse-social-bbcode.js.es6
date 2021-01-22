import { withPluginApi } from 'discourse/lib/plugin-api'

export default {
  name: 'discourse-social-bbcode',
  initialize(container, app) {
    const siteSettings = container.lookup('site-settings:main')

    // If plugin is disabled, quit
    if (!siteSettings['discourse_social_bbcode_enabled']) {
      return
    }

    // Load Twitter
    const twitterLoaded = getScript(
      'https://platform.twitter.com/widgets.js'
    ).catch(e =>
      console.log("discourse-social-bbcode error: Twitter script couldn't load")
    )

    // Facebook asynchronous init. See:
    // https://developers.facebook.com/docs/javascript/quickstart/
    // https://developers.facebook.com/docs/internationalization#locales
    window.fbAsyncInit = function() {
      FB.init({
        appId: 'your-app-id', // We don't provide a valid app id, it seems it works anyway
        autoLogAppEvents: true,
        xfbml: false, // Disable Facebook scan on load
        version: 'v5.0'
      })
    }

    // Load Facebook
    // DOESN'T WORK!!! siteSettings.default_locale doesn't include the
    // region, which is expected by Facebook
    const facebookLoaded = getScript(
      `https://connect.facebook.net/${siteSettings.default_locale}/sdk.js`
    ).catch(e =>
      console.log(
        "discourse-social-bbcode error: Facebook script couldn't load"
      )
    )

    // Get the categories
    const catNamesStr = siteSettings[
      'discourse_social_bbcode_categories'
    ].trim()
    const catNames = catNamesStr.length
      ? catNamesStr.split(',').map(n => n.trim())
      : undefined

    withPluginApi('0.8.30', api => {
      // Disable Twitter scan no load
      // https://developer.twitter.com/en/docs/twitter-for-websites/webpage-properties/overview
      // https://meta.discourse.org/t/how-to-allow-certain-html-tags-in-customization/83592/3?u=syl
      api.decorateWidget('header-contents:after', helper =>
        helper.rawHtml('<meta name="twitter:widgets:autoload" content="off">')
      )

      // Refire twitter and facebook on topic rendering
      api.decorateCooked(
        ($elem, helper) => {
          // We support social buttons in topics only, not posts
          // We also support social buttons on topics rendered with no helper,
          // such as DiscPage pages.
          if (helper && !helper.widget.attrs.firstPost) {
            return
          }

          // If category is wrong, quit
          if (catNames) {
            // If this way of getting the category doesn't work in the future,
            // we could use helper.widget.attrs.topicId
            const currentCatName = $('#topic-title span.category-name').text()
            if (!catNames.includes(currentCatName)) {
              return
            }
          }

          // Refire Twitter. See:
          // https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/scripting-loading-and-initialization
          twitterLoaded.then(
            () => window.twttr && window.twttr.widgets.load($elem.get(0))
          )

          // Refire Facebook. See:
          // https://developers.facebook.com/docs/reference/javascript/FB.XFBML.parse/
          facebookLoaded.then(
            () => window.FB && window.FB.XFBML.parse($elem.get(0))
          )

          // Activate instagram buttons
          const instagram = $elem.find('span.sbb-instagram')
          instagram.each((i, el) => {
            el.addEventListener('click', () => {
              window.open(`http://www.instagram.com/${el.dataset.user}`)
            })
          })

          // Activate email links/buttons
          const mailto = $elem.find('a.sbb-mailtolink, span.sbb-mailtobutton')
          mailto.each((i, el) => {
            el.addEventListener('click', () => onEmailClick(el))
          })
        },
        {
          id: 'discourse-social-bbcode',
          onlyStream: true // Don't really know what this is. The "firstPost" test above *is* required. !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        }
      )
    })
  }
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
  // useless blank tab. But:
  // On Safari and Firefox, "onload" doesn't work
  // On Chrome, closing too fast doesn't work (the 'about:blank' test is true
  // even if there will be something in there later)
  // On iOS, window.close doesn't work at all. No workaround proved to work.
  setTimeout(() => {
    try {
      if (myWindow.location.href === 'about:blank') {
        myWindow.close()
      }
    } catch (e) {}
  }, 500)
}

const decodeHtmlEntities = str =>
  str && str.replace(/&quot;/g, '"').replace(/&apos;/g, "'")

const getScript = url =>
  new Promise((resolve, reject) => {
    $.getScript(url)
      .done((script, textStatus) => resolve(textStatus))
      .fail((jqxhr, settings, exception) => reject(exception))
  })
