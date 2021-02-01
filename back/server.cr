require "http/server"
require "json"
require "./check_servers"
require "uuid"

class Server
  # Структура для хранения данных пользователя в видк класса
  class Client
    property output
    property data_array
    property ip_list
    property size_of_ips

    def initialize(@output : Channel(Check_servers::Results), @data_array : Array(Check_servers::Results), @ip_list : Array(String), @size_of_ips : Int32)
    end
  end

  # Глобальная переменная массива пользователей
  @@clients = Hash(String?, Client).new

  # Веб сервер
  server = HTTP::Server.new do |context|
    request = context.request
    uri = URI.parse(request.resource)
    path = uri.path
    params = uri.query_params
    user_key = request.cookies["key"]?.try &.value # Генерация уникального UUID пользователя и передача в Cookies браузера
    case context.request.method
    when "GET"
      result = getWEB(path, params, context, user_key)
    when "POST"
      result = postWEB(context.request, user_key)
    end
    context.response.content_type = "text/html"
    context.response.puts(result)
  end

  # Обработка GET запросов
  def self.getWEB(path, params, context, user_key)
    case path
    when "/"
      context.response.cookies << HTTP::Cookie.new("key", UUID.random.to_s)
      File.read("../front/dist/index.html")
    when "/bundle.js"
      pp "User #{user_key} connected"
      File.read("../front/dist/bundle.js")
    when "/styles.css" then File.read("../front/dist/styles.css")
    else                    ""
    end
  end

  # Оброботка POST запросов
  def self.postWEB(request, user_key)
    return unless body = request.body
    data = JSON.parse(body)
    case data["mode"]
    when "set_data" # Запись информации от клиента в виде IP-адресов
      @@clients[user_key] = Client.new(Channel(Check_servers::Results).new, Array(Check_servers::Results).new, Array(String).new, Int32.new(0))
      @@clients[user_key].ip_list = array_any_to_array_string(data, "ips")
      @@clients[user_key].size_of_ips = @@clients[user_key].ip_list.size
      @@clients[user_key].output = Channel(Check_servers::Results).new(@@clients[user_key].size_of_ips)
      Check_servers.new.start(@@clients[user_key].output, @@clients[user_key].ip_list, "25565", data["rate"].as_s.to_i)
      spawn_listener(user_key)
      sleep 1.second
      get_data(user_key)
    when "get_data" # Запрос готовых результатов
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
            json.string @@clients[user_key].data_array[i].ping
          end
        end
      end
    end
    json
  end

  # Генарация ответа в виде JSON
  def self.get_data(user_key)
    string = JSON.build do |json|
      json.object do
        if @@clients[user_key].data_array.size == @@clients[user_key].size_of_ips
          @@clients[user_key].output.close
          json.field "done", "1"
          json_data(json, user_key)
          pp "User #{user_key} done. #{@@clients[user_key].size_of_ips} checked."
        else
          json.field "done", "0"
          json_data(json, user_key)
        end
      end
    end
    string
  end

  # Прослушивание канала многопоточности и прием актуальной информации о серверах
  def self.spawn_listener(user_key)
    spawn {
      while data = @@clients[user_key].output.receive?
        @@clients[user_key].data_array << data
      end
    }
  end
end

# Инициализация сервера
address = server.bind_tcp 8080
puts "Listening on http://#{address}"

# Автоматическое открытие страницы в браузере при запуске программы
{% if flag?(:linux) %}
  `xdg-open http://#{address}`
{% elsif flag?(:darwin) %}
  `open http://#{address}`
{% elsif flag?(:win32) %}
  `start http://#{address}`
{% end %}

server.listen
