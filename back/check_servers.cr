require "socket"
require "json"

class Check_servers
  struct Results
    include JSON::Serializable
    getter ip : String
    getter port : String
    getter status : String
    getter version : String
    getter online_now : String
    getter online_max : String
    getter name : String
    
    def initialize(@ip, @port, @status, version, online_now, online_max, name)
      @version = version || ""
      @online_now = online_now || ""
      @online_max = online_max || ""
      @name = name || ""
    end
  end
  @@i = 0
  @@j = 0
  def start(output, array_ips, port, threadsCount)
    spawn_threads(threadsCount, output, port, array_ips)
  end

  def spawn_threads(threadsCount, output, port, array_ips)
    input = Channel(String).new(threadsCount)
    
    threadsCount.times do
      spawn { 
        #i+=1
        check_ip(port, input, output) }
    end
    spawn { array_ips.each { |ip| input.send(ip) } 
    sleep 5100.milliseconds
    pp "close"
    input.close 
    #output.close
  }
  end

  def data_to_json(output, size_of_ips)
    list_of_data = [] of Results
    size_of_ips.times do
      data = output.receive
      list_of_data << data
    end
    list_of_data
  end

  def check_ip(port, input, output)
    while ip = input.receive?
      #sleep 500.milliseconds
      data = get_sever_data(ip, port)
      
      #pp data
      status = data.size < 6 ? "Offline" : "Online"
      data = data.split("\u0000")
      version = data[2]?
      now = data[4]?
      max = data[5]?
      name = data[3]?
      @@j+=1
      if status == "Online"
      @@i+=1
      pp @@i.to_s + "/" +@@j.to_s + " " + status + " " + ip
      end
      output.send(Check_servers::Results.new(ip, port, status, version, now, max, name))
    end
  end

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
