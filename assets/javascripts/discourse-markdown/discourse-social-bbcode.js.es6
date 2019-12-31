export function setup(helper) {
  if (!helper.markdownIt) {
    return
  }

  helper.registerOptions((opts, siteSettings) => {
    opts.features[
      'discourse-social-bbcode'
    ] = !!siteSettings.discourse_social_bbcode_enabled
  })

  helper.whiteList(['span.dpg-balloon'])

  helper.registerPlugin(md => {
    helper.whiteList(['span.sbb-twitterfollow'])

    // See Button customization in https://developer.twitter.com/en/docs/twitter-for-websites/follow-button/overview
    // Parameters:
    // user=UserName (without @) => mandatory
    // size=small(default)|large
    // showScreenName=true(default)|false
    // lang=auto(default)|en|fr|ar...
    // showCount=true(default)|false
    md.inline.bbcode.ruler.push('twitterfollow', {
      tag: 'twitterfollow',
      replace: function(state, tagInfo, content) {
        const user = tagInfo.attrs.user
        if (!user) {
          console.log('Missing "user" in twitterfollow bbcode')
          return false
        }
        let token = state.push('span_open', 'span', 1)
        token.attrs = [['class', 'sbb-twitterfollow']]
        token = state.push('html_raw', '', 0)
        // show-screen-name="false" show-count="false" size="large" lang="fr"
        const data = Object.keys(tagInfo.attrs)
          .filter(key => key !== 'user')
          .map(key => {
            // See https://bytes.com/topic/javascript/answers/90459-help-regxp-replace-uppercase-lowercase
            const keyWithDashes = key.replace(/[A-Z]/g, '-$&').toLowerCase()
            const value = tagInfo.attrs[key]
            return `data-${keyWithDashes}="${value}"`
          })
          .join(' ')
        token.content = `
          <a href="https://twitter.com/${user}?ref_src=twsrc%5Etfw" class="twitter-follow-button" ${data}>Follow @${user}</a>
          <!-- <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> -->
        `
        token = state.push('span_close', 'span', -1)
        return true
      }
    })

    helper.whiteList(['span.sbb-twittertweet'])

    // See Tweet text components in https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview
    // Parameters, all optional:
    // text="I disovered a great website!"
    // url=https://www.wonderful.org
    // hashtags=Amazing,Great,Wow (without #)
    // via=UserName (without @)
    // size=small(default)|large
    md.inline.bbcode.ruler.push('twittertweet', {
      tag: 'twittertweet',
      replace: function(state, tagInfo, content) {
        let token = state.push('span_open', 'span', 1)
        token.attrs = [['class', 'sbb-twittertweet']]
        token = state.push('html_raw', '', 0)
        const attrs = Object.assign({ text: content }, tagInfo.attrs)
        const data = Object.keys(attrs)
          .map(key => `data-${key}="${attrs[key]}"`)
          .join(' ')
        token.content = `
          <a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" ${data}>Tweet</a>
          <!-- <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>    -->
        `
        token = state.push('span_close', 'span', -1)
        return true
      }
    })

    helper.whiteList(['span.sbb-facebook'])

    // Display both Like and Share buttons, but the Share button must be activated with the parameters
    // See all possible parameters here:
    // https://developers.facebook.com/docs/plugins/like-button/#settings
    md.inline.bbcode.ruler.push('facebook', {
      tag: 'facebook',
      replace: function(state, tagInfo, content) {
        let token = state.push('span_open', 'span', 1)
        token.attrs = [['class', 'sbb-facebook']]
        token = state.push('html_raw', '', 0)

        const params = Object.keys(tagInfo.attrs)
          .map(key => `data-${key}="${tagInfo.attrs[key]}"`)
          .join(' ')

        // Divs have been replaced by spans. This is necessary, otherwise the
        // markdown engine won't recognize the block as inline.
        // Also, the "Facebook Button(s)" string has been inserted so that
        // the button placeholder is visible in the composer. It is removed
        // once displayed in the actual post.
        // This seems not necessary anymore : <span id="fb-root"></span>
        token.content = `<span class="fb-like" ${params}>Facebook Button(s)</span>`

        token = state.push('span_close', 'span', -1)
        return true
      }
    })

    helper.whiteList([
      'a.sbb-mailtolink',
      'a[data-to=*]',
      'a[data-cc=*]',
      'a[data-bcc=*]',
      'a[data-subject=*]',
      'a[data-body=*]'
    ])

    // Parameters:
    // - btnclasses: space-separated class list for the button
    // - to, cc, bcc, subject, body
    // To put ' and " in the sibject or body, use &apos; and &quot; respectively
    md.inline.bbcode.ruler.push('mailtolink', {
      tag: 'mailtolink',
      wrap: function(startToken, endToken, tagInfo, content) {
        startToken.type = 'link_open'
        startToken.tag = 'a'
        startToken.attrs = [['class', 'sbb-mailtolink']].concat(
          Object.keys(tagInfo.attrs).map(key => [
            `data-${key}`,
            tagInfo.attrs[key]
          ])
        )
        startToken.nesting = 1
        endToken.type = 'link_close'
        endToken.tag = 'a'
        endToken.nesting = -1
        return false
      }
    })

    helper.whiteList([
      'span.sbb-mailtobutton',
      'span[data-to=*]',
      'span[data-cc=*]',
      'span[data-bcc=*]',
      'span[data-subject=*]',
      'span[data-body=*]'
    ])

    // Parameters:
    // - btnclasses: space-separated class list for the button
    // - to, cc, bcc, subject, body
    // To put ' and " in the sibject or body, use &apos; and &quot; respectively
    md.inline.bbcode.ruler.push('mailtobutton', {
      tag: 'mailtobutton',
      replace: function(state, tagInfo, content) {
        let token = state.push('span_open', 'span', 1)
        token.attrs = [['class', 'sbb-mailtobutton']].concat(
          Object.keys(tagInfo.attrs)
            .filter(key => key !== 'btnclasses')
            .map(key => [`data-${key}`, tagInfo.attrs[key]])
        )
        token = state.push('html_raw', '', 0)
        token.content = `
          <button class="${tagInfo.attrs.btnclasses || ''}">
            <span class="before">${iconHTML('envelope')}</span>
            <span class="text">${content || 'Button'}</span>
            <span class="after"></span>
          </button>
        `
        token = state.push('span_close', 'span', -1)
        return true
      }
    })
  })
}

const iconHTML = iconName => `
  <svg class="fa d-icon d-icon-${iconName} svg-icon svg-string" xmlns="http://www.w3.org/2000/svg">
    <use xlink:href="#${iconName}"></use>
  </svg>
`
