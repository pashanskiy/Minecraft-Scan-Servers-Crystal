require "http/server"
require "json"
require "./check_servers"
require "uuid"

class Server
  struct Client2
    getter output : Channel(Check_servers::Results)
    getter data_array : Array(Check_servers::Results)
    getter ip_list : Array(String)
    getter size_of_ips : Int32

    def initialize(@output, @data_array, @ip_list, @size_of_ips)
      @output = output
      @data_array = data_array
      @ip_list = ip_list
      @size_of_ips = size_of_ips
    end

    def initialize
      @output = Channel(Check_servers::Results).new
      @data_array = Array(Check_servers::Results).new
      @ip_list = ["asd", "wqe", "qwe"]
      @size_of_ips = Int32.new(0)
    end

    def set_output(output : Channel(Check_servers::Results))
      @output = output
    end

    def append_data_array(data_array)
      @data_array << data_array
    end

    def set_ip_list(ip_list : Array(String))
      @ip_list = ["123", "3455", "234324"]
    end

    def set_size_of_ips(size_of_ips : Int32)
      @size_of_ips = size_of_ips
    end
  end

  class Client
    property output
    property data_array
    property ip_list
    property size_of_ips

    def initialize(@output : Channel(Check_servers::Results), @data_array : Array(Check_servers::Results), @ip_list : Array(String), @size_of_ips : Int32)
    end
  end

  @@clients = Hash(String?, Client).new

  server = HTTP::Server.new do |context|
    request = context.request
    uri = URI.parse(request.resource)
    path = uri.path
    params = uri.query_params
    user_key = request.cookies["key"]?.try &.value
    case context.request.method
    when "GET"
      result = getWEB(path, params, context, user_key)
    when "POST"
      result = postWEB(context.request, user_key)
    end
    context.response.content_type = "text/html"
    context.response.puts(result)
  end

  def self.getWEB(path, params, context, user_key)
    # pp "get:  #{path}"
    case path
    when "/"
      context.response.cookies << HTTP::Cookie.new("key", UUID.random.to_s)
      File.read("../front/dist/index.html")
    when "/bundle.js"
      pp "User #{user_key} connected"
      File.read("../front/dist/bundle.js")
    when "/styles.css" then File.read("../front/src/styles/style.css")
    else                    ""
    end
  end

  def self.postWEB(request, user_key)
    return unless body = request.body
    data = JSON.parse(body)
    case data["mode"]
    when "set_data"
      pp "SET SET SET SET SET SET SET SET SET SET SET "
      @@clients[user_key] = Client.new(Channel(Check_servers::Results).new, Array(Check_servers::Results).new, Array(String).new, Int32.new(0))
      # @@clients[user_key] = Client.new()
      @@clients[user_key].ip_list = array_any_to_array_string(data, "ips")
      @@clients[user_key].size_of_ips = @@clients[user_key].ip_list.size
      @@clients[user_key].output = Channel(Check_servers::Results).new(@@clients[user_key].size_of_ips)
      pp @@clients[user_key]
      pp "kek"
      # pp @@clients[user_key]
      Check_servers.new.start(@@clients[user_key].output, @@clients[user_key].ip_list, "25565", data["rate"].as_s.to_i)
      spawn_listener(user_key)
      sleep 1.second
      get_data(user_key)
    when "get_data"
      get_data(user_key)
    end
  end

  def self.array_any_to_array_string(array_any, key)
    array_string = Array(String).new
    (array_any[key].as_a).each do |kek|
      array_string << kek.as_s
    end
    array_string
  end

  def self.json_data(json, user_key)
    json.field "progress", "#{(@@clients[user_key].data_array.size/@@clients[user_key].size_of_ips*100).round(2)}"
    json.field "data" do
      json.array do
        @@clients[user_key].data_array.size.times do |i|
          json.array do
            json.string @@clients[user_key].data_array[i].status
            json.string @@clients[user_key].data_array[i].ip
            json.string @@clients[user_key].data_array[i].port
            json.string @@clients[user_key].data_array[i].version
            json.string @@clients[user_key].data_array[i].online_now
            json.string @@clients[user_key].data_array[i].online_max
            json.string @@clients[user_key].data_array[i].name
          end
        end
      end
    end
    json
  end

  def self.get_data(user_key)
    string = JSON.build do |json|
      json.object do
        if @@clients[user_key].data_array.size == @@clients[user_key].size_of_ips
          @@clients[user_key].output.close
          json.field "done", "1"
          json_data(json, user_key)
          pp "User " + user_key.to_s + " done."
        else
          json.field "done", "0"
          json_data(json, user_key)
        end
      end
    end
    # pp @@clients[user_key].data_array.size
    # pp @@clients[user_key].size_of_ips
    pp string
    string
  end

  def data_to_json
    list_of_data = [] of Results
    @@size_of_ips.times do
      data = @@output.receive
      list_of_data << data
    end
    list_of_data
  end

  def self.spawn_listener(user_key)
    spawn {
      while data = @@clients[user_key].output.receive?
        @@clients[user_key].data_array << data
      end
    }
  end
end

address = server.bind_tcp 8080
puts "Listening on http://#{address}"

{% if flag?(:linux) %}
  `xdg-open http://#{address}`
{% elsif flag?(:darwin) %}
  `open http://#{address}`
{% elsif flag?(:win32) %}
  `start http://#{address}`
{% end %}

server.listen
