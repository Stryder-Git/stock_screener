using System.Diagnostics.SymbolStore;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Text;
// using System.Web.Http;
using Confluent.Kafka;
using Microsoft.AspNetCore.Cors;
using Newtonsoft.Json;

public class Symbols
{
    public string[] symbols{ get; set; }
}


namespace ScreeenerApi.Controllers
{

[ApiController]
[Route("[controller]")]
public class ScreenerController : ControllerBase
{
    private ILogger<ScreenerController> _logger { get; set; }
    // public KafkaConsumer consumer { get; set; }

    public ScreenerController(ILogger<ScreenerController> logger)
    {
        Console.WriteLine("Creating ScreenerController");
        _logger = logger;

    }

     public async Task Get()//string configs)
     {   var conf = new ConsumerConfig
         { 
             GroupId = "test-consumer-group",
             BootstrapServers = "localhost:9092",
             // Note: The AutoOffsetReset property determines the start offset in the event
             // there are not yet any committed offsets for the consumer group for the
             // topic/partitions of interest. By default, offsets are committed
             // automatically, so in this example, consumption will only start from the
             // earliest message in the topic 'my-topic' the first time you run the program.
             AutoOffsetReset = AutoOffsetReset.Earliest
         };
 
         //Console.WriteLine("starting with configs: " + configs);
 
         using (var c = new ConsumerBuilder<Ignore, string>(conf).Build())
            {
             
                string[] symbols;
             using(var client = new HttpClient())
                {
                    //UriBuilder builder = new UriBuilder("http://localhost:6598/api/get");
                    //builder.Query = "name='abc'&password='cde'";

                    var uri = new Uri("http://localhost:8000/"); //?c=" + configs);
                    var strSyms = client.GetAsync(uri).Result.Content.ReadAsStringAsync().Result;
                    Console.WriteLine(strSyms);
                    symbols= JsonConvert.DeserializeObject<Symbols>(strSyms).symbols;
                    //Console.WriteLine(Result.symbols[0]);
                }

                c.Subscribe(symbols);
 
             CancellationTokenSource cts = new CancellationTokenSource();
             Console.CancelKeyPress += (_, e) => {
                 e.Cancel = true;  // prevent the process from terminating.
                 cts.Cancel();
             };
 
             Response.Headers.Add("Content-Type", "text/event-stream");
 
             try
             {
                 while (true)
                 {   Console.WriteLine("trying");
                     try
                     {
                         var cr = c.Consume(cts.Token);
                         string msg = $"data:{cr.Topic}:!:'{cr.Value}'\n\n";
                         Console.WriteLine("sending " + msg);
                         
                         byte[] bmsg = ASCIIEncoding.ASCII.GetBytes(msg);
 
                         await Response.Body.WriteAsync(bmsg);
                         await Response.Body.FlushAsync();
 
                     }
                     catch (ConsumeException e)
                     {
                         var msg = $"Error occured: {e.Error.Reason}";
                         Console.WriteLine(msg);
                     }
                 }
             }
             catch (OperationCanceledException)
             {
                  //Ensure the consumer leaves the group cleanly and final offsets are committed.
                 c.Close();
             }
         }
 }

}

    }



