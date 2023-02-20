require 'bundler/inline'

gemfile(true) do
  gem 'sinatra'
  gem 'redcarpet'
  gem 'pg'
  gem 'json'
  gem 'puma'
end

require 'sinatra/base'

class App < Sinatra::Base

  def pg_uri
    ARGV.size == 1 ? ENV['PG_URI'] : ARGV.last
  end
  # Connect to the PostgreSQL database using the URI provided
  def connect_to_db
    conn = PG.connect(pg_uri)
    yield conn
  ensure
    conn.close if conn
  end

  # Render the markdown file to HTML using Redcarpet
  def render_markdown(file_path)
    markdown = File.read(file_path)
    renderer = Redcarpet::Markdown.new(Redcarpet::Render::HTML)
    renderer.render(markdown)
  end


  # Run the SQL code snippet and return the result
  def run_query(conn, sql)
    return if sql !~ /^\s*SELECT\t/i
    result = conn.exec(sql)
    response = result.map(&:to_h)
    puts({sql: sql, response: response})
    response
  end

  set :public_folder, File.dirname(__FILE__)

  get '/' do
    # Render the markdown file
    html = render_markdown(ARGV[0])

    html.scan(%r{<code>sql\n(.*?)\n</code>}m).to_a.each do |match|
      html.gsub!("<code>sql\n#{match[0]}\n</code>",
                 "<pre><code class=\"language-sql\">#{match[0].chomp}</code></pre>")
    end

    # Inject the presentation navigation script
    html = <<-HTML + html
    <head>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.17.1/themes/prism-okaidia.min.css" />
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1.17.1/prism.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1.17.1/components/prism-sql.min.js"></script>
      <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      <script type="text/javascript" src="main.js"></script>
      <link rel="stylesheet" href="main.css">
    </head>
    <button id="first-slide">⏮</button>
    <button id="previous-slide">⬅️</button>
    <button id="start-presentation">▶️</button>
    <button id="stop-presentation" style="display: none;">⏹</button>
    <button id="next-slide">➡️</button>
    <button id="last-slide">⏭</button>
    HTML

    html
  end

  get '/main.js' do
    content_type :js
    send_file File.join(settings.public_folder, 'main.js')
  end

  def parse_aggregated_results(data)
    data.map do |hash|
      hash.transform_values{|e|cast_results(e)}
    end
  end
  def cast_results(e)
    return [] unless e
    return e unless e.start_with?("{") && e.end_with?("}")
    e[1..-2].split(",").map{|f|cast_result(f)}
  end

  def cast_result(element)
    case element
    when /^\d+\.\d+$/
      element.to_f
    when /^"\d{4}-\d{2}-\d{2}\s.+"$/
      element[1..-2]
    else
      element
    end
  end

  post '/query' do
    request.body.rewind
    query = JSON.parse(request.body.read)['query']

    result = nil
    connect_to_db do |conn|
      begin
        result = conn.exec(query)
      rescue PG::Error => e
        return [500, { message: e.message }.to_json]
      end
    end
    data = parse_aggregated_results(result)

    [200, data.to_json]
  end
end

App.run!
