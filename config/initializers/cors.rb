Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "https://messenger-lr1s.onrender.com"

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true #
  end

  allow do
    origins "http://localhost:3000"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
