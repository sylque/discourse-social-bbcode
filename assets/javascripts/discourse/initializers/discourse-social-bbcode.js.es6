
export default {
  name: 'discourse-social-bbcode',
  initialize(container, app) {
    document.addEventListener('click', e => {
      const link = e.target.closest('a.sbb-mailtolink, span.sbb-mailtobutton')
      if (link) {
        // Create the "mailto" query param string
        const params = Object.keys(link.dataset)        
          .map(key => {
            const value = encodeURIComponent(
              decodeHtmlEntities(link.dataset[key])
            )
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
            }
          } catch (e) {}
        }
      }
    })
  }
}

const decodeHtmlEntities = str =>
  str && str.replace(/&quot;/g, '"').replace(/&apos;/g, "'")
