from _common import SYMBOLS, KAFKA_SERVER, MONGO_SERVER, PRICE_DB

from kafka import KafkaConsumer
from pymongo import MongoClient

import json

"""
* Regular reads from all symbols in kafka topics
* insert into db

"""

def run(consumer, mongodb):

    FIELDS = ["date", "open", "high", "low", "close", "volume"]

    for message in consumer:

        print(message.value)

        row = json.loads(message.value.decode())
        row = {f: v for f, v in zip(FIELDS, row)}

        collection = mongodb[message.topic]

        print("inserting", row, "into", message.topic)
        collection.insert_one(row)



if __name__ == '__main__':

    consumer = KafkaConsumer(*SYMBOLS, bootstrap_servers= KAFKA_SERVER)
    mongo = MongoClient("localhost", 27017)


    try:
        run(consumer, mongo[PRICE_DB])
    except KeyboardInterrupt:
        print("cancelled")


"""
READ INTO SPARK

import os
import pyspark as pys

conf = pys.SparkConf().set("spark.jars.packages", 
                           "org.mongodb.spark:mongo-spark-connector_2.12:3.0.1"
                           ).setMaster("local").setAppName("TestApp")

os.environ["HADOOP_HOME"] = r"C:\Packages\hadoop\winutils\hadoop-3.2.2"
spark = pys.SparkContext(conf= conf)
sqlc = pys.SQLContext(spark)
mongo = "mongodb://localhost:27017/stock_screener_price_db."
aapl = sqlc.read.format("com.mongodb.spark.sql.DefaultSource").option("uri", mongo + "AAPL").load()

"""






