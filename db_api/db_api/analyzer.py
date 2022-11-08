import os
import pyspark as pys
from pymongo import MongoClient
from collections import namedtuple

conf = pys.SparkConf().set("spark.jars.packages",
                           "org.mongodb.spark:mongo-spark-connector_2.12:3.0.1"
                           ).setMaster("local").setAppName("TestApp")

hadoop_path = r"C:\Packages\hadoop\winutils\hadoop-3.2.2"
if not os.path.exists(hadoop_path):
    print("RUNNING ON EC2")
    hadoop_path = r"C:\Users\Administrator\hadoop"

os.environ["HADOOP_HOME"] = hadoop_path
spark = pys.SparkContext(conf= conf)
sqlc = pys.SQLContext(spark)
mongo_url = "mongodb://localhost:27017/stock_screener_price_db."

mongo = MongoClient("localhost", 27017)

Fields = namedtuple("Fields", ["date", "open", "high", "low", "close", "volume"])



class Analyzer:
    columns = Fields("date", "open", "high", "low", "close", "volume")
    all_data = None

    @classmethod
    def _get(cls, sym):
        return sqlc.read.format("com.mongodb.spark.sql.DefaultSource"
                                ).option("uri", mongo_url + sym).load(
        )[["date", "close"]].withColumnRenamed("close", sym)

    @classmethod
    def set_data(cls):
        symbols = mongo["stock_screener_price_db"].list_collection_names()
        data = cls._get(symbols[0])
        for symbol in symbols[1:]:
            data = data.join(cls._get(symbol), on= "date", how= "outer")

        cls.all_data = data.pandas_api("date")

    """
	CRITERIA
		* current price
		    * value, above/below
		* current volume

	  needs database:
	    * price change over n days
		* volume change over n days
		* above ma n days
		* below ma n days

		* current marketcap
		* above/below value of some fundamental data


    * PARITIONING ??
      
      
    """

    def __init__(self, configs: dict):
        assert not self.all_data is None, f"{self.__class__.__name__}.all_data needs to be prepared"
        self.configs = configs

    def _mask(self, series, val, above):
        if above: return series.gt(val)
        else: return current.lt(val)

    def current(self, val: int, above: bool):
        current = self.data.iloc[len(self.data) - 1]
        mask = self._mask(current, val, above)
        return current[mask].index

    def pct_change(self, field: str, days: int, change: float, above: bool):
        pct_change = self.data.iloc[-days-1:].pct_change(days).iloc[days]
        mask = self._mask(pct_change, val, above)
        return pct_change[mask].index

    def moving_av(self, days: int, above: bool):
        mean = self.data.iloc[-days:].rolling(days).mean()
        mask = self._mask(mean, val, above)
        return mean[mask].index


    def __call__(self):
        self.data = self.all_data

        for config, vals in self.configs.items():
            matches = getattr(self, config)(*vals)
            self.data = self.data[matches]

        return ["A", "B"]
        return matches.to_list()


if __name__ == '__main__':
    Analyzer.set_data()
    a = Analyzer({})
    print(a.price_change(1, 0.5, True))
