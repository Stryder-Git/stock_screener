import json
import time
import datetime as dt
import random
from kafka import KafkaProducer
from kafka.admin import KafkaAdminClient, NewTopic


def run(producer, wait, symbols):
	while True:

		t = str(dt.datetime.now())
		for sym in symbols:
			vals = [t]
			vals.extend([random.randint(0, 100) for _ in range(5)])
			print(sym, ": ",    vals)
			producer.send(sym, bytes(json.dumps(vals), "utf-8"), key=bytes(sym, "utf-8"))
	
		producer.flush()
		time.sleep(wait)

if __name__ == "__main__":

	from _common import SYMBOLS, KAFKA_SERVER

	DEFWAIT = 10

	kafka_admin = KafkaAdminClient(bootstrap_servers=KAFKA_SERVER)
	existing_topics = kafka_admin.list_topics()
	to_create = SYMBOLS.difference(existing_topics)
	topics = [NewTopic(sym, 1, 1) for sym in to_create]

	print("creating topics for: ", to_create)
	kafka_admin.create_topics(topics)

	producer = KafkaProducer(bootstrap_servers=KAFKA_SERVER)

	try:
		run(producer, DEFWAIT, SYMBOLS)
	except KeyboardInterrupt:
		print("cancelled")


	