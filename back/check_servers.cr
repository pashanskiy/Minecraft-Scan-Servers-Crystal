require "socket"
require "json"

class Check_servers
  # Структура информации о сервере
  struct Results
    include JSON::Serializable
    getter ip : String
    getter port : String
    getter status : String
    getter version : String
    getter online_now : String
    getter online_max : String
    getter name : String
    getter ping : String

    
    def initialize(@ip, @port, @status, version, online_now, online_max, name, ping)
      @version = version || ""
      @online_now = online_now || ""
      @online_max = online_max || ""
      @name = name || ""
      @ping = ping || ""
    end
  end

  # Рождение многопоточности
  def start(output, array_ips, port, threadsCount)
    input = Channel(String).new(threadsCount)
    threadsCount.times do
      spawn { 
        check_ip(port, input, output) }
    end
    spawn { array_ips.each { |ip| input.send(ip) } 
    input.close 
  }
  end

  # Поток
  def check_ip(port, input, output)
    while ip = input.receive?
      ping = Time.utc
      data = get_sever_data(ip, port)
      ping = Time.utc - ping
      if (data.size<6)
        status="Offline"
        ping = Time::Span.zero
      else
        status="Online"
      end
      data = data.split("\u0000")
      version = data[2]?
      now = data[4]?
      max = data[5]?
      name = data[3]?
      output.send(Check_servers::Results.new(ip, port, status, version, now, max, name, ping.milliseconds.to_s))
    end
  end

  # Получение иоформации о сервере
  def get_sever_data(ip, port)
    mcs_tcp = TCPSocket.new(ip, port, dns_timeout = 1.seconds, connect_timeout = 1.seconds)
    mcs_tcp.read_timeout = 1.seconds
    mcs_tcp << "\xFE\x01"
    size = mcs_tcp.read_byte || 0x0_u8
    bytes = Bytes.new(size - 1)
    mcs_tcp.read(bytes)
    mcs_tcp.close
    String.new(bytes, "UTF-16BE")
  rescue
    String.new
  end
  
end
