# name: discourse-social-bbcode
# about: Discourse plugin to allow inserting social buttons in topics
# version: 1.0.1
# authors: Sylvain Quendez

# When styles are not working or are not updating, try:
# - stopping server
# - rm -rf discourse/tmp
# - delete discourse/public/uploads/stylesheet-cache
# - restart server
# If styles are still not updating, there is probably a syntax error in the SCSS 
# causing a silent failure and causing the file not being processed.
# To be 100% sure you can also enable Chrome Dev Tools -> Settings -> General -> 
# Disable cache (while DevTools is open), but note it leads to 30s onload times.

# Load styles
register_asset "stylesheets/discourse-social-bbcode.scss"

# Load icons
register_svg_icon "envelope" if respond_to?(:register_svg_icon)

# Register admin settings
enabled_site_setting :discourse_social_bbcode_enabled

# See https://meta.discourse.org/t/mitigate-xss-attacks-with-content-security-policy/104243
# https://developers.google.com/web/fundamentals/security/csp#use_case_1_social_media_widgets
extend_content_security_policy(
  script_src: [
    'https://platform.twitter.com', 
    'https://connect.facebook.net'
  ]
)
