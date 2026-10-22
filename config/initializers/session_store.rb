# No domain: the cookie belongs to whichever host served the page (Render or minime).
Rails.application.config.session_store :cookie_store, key: "_authentication_app"
