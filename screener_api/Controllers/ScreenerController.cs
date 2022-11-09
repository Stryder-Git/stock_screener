using System.Diagnostics.SymbolStore;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Text;
// using System.Web.Http;
using Confluent.Kafka;
using Microsoft.AspNetCore.Cors;
using Newtonsoft.Json;
using Java.Util;

public class Symbols
{
    public string[] symbols{ get; set; }
}


namespace ScreenerApi.Controllers
{

[ApiController]
[Route("[controller]")]
public class ScreenerController : ControllerBase
{
    static System.Collections.Generic.Dictionary<int, ScreenerController> Screeners = new System.Collections.Generic.Dictionary<int, ScreenerController>();
    static int id = 0;
    int sseid;

    ILogger<ScreenerController> _logger;
    bool sse_connected = false;
   

    public ScreenerController(ILogger<ScreenerController> logger)
    {
        Console.WriteLine("Creating ScreenerController");
        _logger = logger;
    }

        [HttpDelete]
    public async Task Delete(int i)
        {
            ScreenerController controller = Screeners[i];
            Console.WriteLine(i + " Delete called: " + controller.sse_connected);
            controller.sse_connected = false;
            
        }

        [HttpGet]
     IConsumer<Ignore, string> GetConsumer()
        {
             HttpClient client = new HttpClient();
             //UriBuilder builder = new UriBuilder("http://localhost:6598/api/get");
             //builder.Query = "name='abc'&password='cde'";

             var uri = new Uri("http://localhost:8000/"); //?c=" + configs);
             var strSyms = client.GetAsync(uri).Result.Content.ReadAsStringAsync().Result;
             Console.WriteLine(strSyms);
             string[] symbols = JsonConvert.DeserializeObject<Symbols>(strSyms).symbols;

             
         var conf = new ConsumerConfig
         { 
             GroupId = "test-consumer-group",
             BootstrapServers = "localhost:9092",
             // Note: The AutoOffsetReset property determines the start offset in the event
             // there are not yet any committed offsets for the consumer group for the
             // topic/partitions of interest. By default, offsets are committed
             // automatically, so in this example, consumption will only start from the
             // earliest message in the topic 'my-topic' the first time you run the program.
             AutoOffsetReset = AutoOffsetReset.Latest
         };


            var c = new ConsumerBuilder<Ignore, string>(conf).Build();
            c.Subscribe(symbols);
 
            return c;
        }

        [HttpGet]
    void SendSse(string msg)
        {
            msg = $"data:{this.sseid}:!:{msg}'\n\n";
            Console.WriteLine("sending " + msg);
            byte[] bmsg = ASCIIEncoding.ASCII.GetBytes(msg);
            Response.Body.WriteAsync(bmsg);
            Response.Body.FlushAsync();
        }

        [HttpGet]
     public async Task Get()//string configs)
     {   sse_connected = true;
         this.sseid = ++id;
         Screeners[this.sseid] = this;
             

             IConsumer<Ignore, string> c = GetConsumer();

             CancellationTokenSource cts = new CancellationTokenSource();
             Console.CancelKeyPress += (_, e) => {
                 e.Cancel = true;  // prevent the process from terminating.
                 cts.Cancel();
                 };


             Response.Headers.Add("Content-Type", "text/event-stream");
             try
             {
                 while (sse_connected)
                 {   Console.WriteLine("trying");
                     try
                     {
                         var cr = c.Consume(cts.Token); 
                         SendSse($"{cr.Topic}:!:{cr.Value}");
                     }
                     catch (ConsumeException e)
                     {
                         var msg = $"Error occured: {e.Error.Reason}";
                         Console.WriteLine(msg);
                     }
                 }
                 Response.Body.Close();
             }
             catch (OperationCanceledException)
             {
                 //Ensure the consumer leaves the group cleanly and final offsets are committed.
                 c.Close();
                 Response.Body.Close();
             }

         }
 }

}



