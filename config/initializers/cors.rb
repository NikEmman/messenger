Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:3000"
    resource "*", headers: :any, methods: [ :get, :post, :put, :patch, :delete, :options, :head ], credentials: true
  end
  allow do
    origins "http://localhost:5173"
    resource "*", headers: :any, methods: [ :get, :post, :put, :patch, :delete, :options, :head ], credentials: true
  end
  allow do
    # the domain on which the production app will be on
    origins "https://messenger-peb1.onrender.com/"
    resource "*", headers: :any, methods: [ :get, :post, :put, :patch, :delete, :options, :head ], credentials: true
  end
end
